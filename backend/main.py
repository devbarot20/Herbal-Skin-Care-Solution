import os
import warnings
import logging
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"
warnings.filterwarnings("ignore")
logging.getLogger("tensorflow").setLevel(logging.ERROR)
import tensorflow as tf

import shutil
import base64
import tempfile
import jwt
from dotenv import load_dotenv

# Load .env file automatically
load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, Header, Request, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
from pydantic import BaseModel
from supabase import create_client, Client
from model.predict import predict_skin_type
from ocr.ingredient_scanner import scan_ingredients
import json
import uuid
from auth.database import Base, engine

# Auto-create database tables (For any future local models, though users are in Supabase)
Base.metadata.create_all(bind=engine)

# Supabase Auth Setup
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")

supabase: Client = None
if SUPABASE_URL and SUPABASE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Secret for decoding the custom HerbHacks JWT (from auth/utils.py)
# HERBHACKS_SECRET = "herbhacks_super_secret_key_2024_change_in_production"

def get_user_id_from_token(authorization: Optional[str]) -> Optional[str]:
    """Extract Supabase user ID from the header safely (non-blocking)."""
    try:
        print(f"--> [EXTRACT] AUTH HEADER RECEIVED: {authorization[:30]}..." if authorization else "--> [EXTRACT] NO AUTH HEADER")
        if not authorization:
            return None
            
        token = authorization.split(" ")[1] if " " in authorization else authorization
        
        payload = jwt.decode(
            token, 
            options={"verify_signature": False} 
        )
        sub = str(payload.get("sub"))
        print(f"--> [EXTRACT] SUCCESS: {sub}")
        return sub
    except jwt.ExpiredSignatureError:
        print("--> [EXTRACT] ERROR: Token expired")
        return None
    except Exception as e:
        print(f"--> [EXTRACT] ERROR: {e}")
        return None

def verify_user(authorization: str = Header(...)):
    """Blocks request if Supabase JWT is completely malformed."""
    try:
        token = authorization.split(" ")[1] if " " in authorization else authorization
        payload = jwt.decode(
            token, 
            options={"verify_signature": False}
        )
        return str(payload.get("sub"))
    except Exception as e:
        print(f"AUTH BLOCK ERROR: {e}")
        raise HTTPException(status_code=401, detail="Invalid auth token format")


app = FastAPI(title="HerbHacks API")

# Ensure temp directory exists
TEMP_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "temp")
os.makedirs(TEMP_DIR, exist_ok=True)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Auth is entirely handled by Supabase SDK in the frontend now.
# Local auth endpoints have been removed.

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
HARMFUL_PATH = os.path.join(BASE_DIR, "data", "harmful_chemicals.json")
PRODUCTS_PATH = os.path.join(BASE_DIR, "data", "products.json")

# Helper to load harmful chemicals
def load_harmful():
    with open(HARMFUL_PATH, 'r') as f:
        return json.load(f)["harmful_chemicals"]

class Base64Image(BaseModel):
    image: str

class ScanRequest(BaseModel):
    image_url: str

def save_to_supabase(img_path: str, result: dict, user_id: Optional[str]):
    """Run in background — uploads image to Storage and saves result to scan_history."""
    if not supabase:
        return
    try:
        # Upload image to Supabase Storage
        file_name = f"{user_id or 'guest'}/{uuid.uuid4()}.jpg"
        with open(img_path, "rb") as img_file:
            supabase.storage.from_("scan-images").upload(
                file_name, img_file, {"content-type": "image/jpeg"}
            )

        raw_url = supabase.storage.from_("scan-images").get_public_url(file_name)
        image_url = raw_url if isinstance(raw_url, str) else raw_url.get("publicUrl", "")

        scan_record = {
            "user_id": user_id,
            "image_url": image_url,
            "disease_name": result.get("skin_type", "Unknown"),
            "confidence_score": result.get("confidence"),
            "remedies": result.get("remedies"),
        }
        supabase.table("scan_history").insert(scan_record).execute()
        print(f"✅ Supabase saved | user: {user_id} | skin: {scan_record['disease_name']}")
    except Exception as e:
        import traceback
        print(f"⚠️ Supabase background save failed: {e}")
        traceback.print_exc()
    finally:
        # Clean up temp file after background save
        try:
            if os.path.exists(img_path):
                os.remove(img_path)
        except:
            pass

@app.post("/analyze")
async def analyze_skin(request: ScanRequest, user_id: str = Depends(verify_user)):
    # 1. Download image from request.image_url or load directly into TensorFlow
    # ... setup your TF model here ... (mocked for now)
    
    disease_detected = "Acne"
    confidence = 0.95
    remedies = {"topical": "Tea Tree Oil", "lifestyle": "Drink water"}

    # 2. Save the result to Supabase Scan History
    new_scan = {
        "user_id": user_id,
        "image_url": request.image_url,
        "disease_name": disease_detected,
        "confidence_score": confidence,
        "remedies": remedies
    }
    
    if supabase:
        response = supabase.table("scan_history").insert(new_scan).execute()
    
    # 3. Return results to Frontend
    return {
        "status": "success",
        "analysis": new_scan
    }

@app.get("/")
async def root():
    return {"status": "HerbHacks API is running"}

@app.post("/predict")
async def predict(image: UploadFile = File(...), authorization: Optional[str] = Header(default=None), background_tasks: BackgroundTasks = BackgroundTasks()):
    temp_path = os.path.join(TEMP_DIR, f"{uuid.uuid4()}.jpg")
    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)

        # validate_skin=True: reject non-skin uploads (wallpapers, objects, etc.)
        result = predict_skin_type(temp_path, validate_skin=True)

        # Schedule Supabase save in background only for valid results
        user_id = get_user_id_from_token(authorization)
        print(f"--> [PREDICT] Extracted user_id: {user_id}")
        if not result.get("error"):
            print(f"--> [PREDICT] Scheduling save task with user_id: {user_id}")
            background_tasks.add_task(save_to_supabase, temp_path, result, user_id)
        else:
            # Clean up temp file immediately for rejected images
            try:
                if os.path.exists(temp_path):
                    os.remove(temp_path)
            except:
                pass

        # Return result immediately to frontend
        return result
    except Exception as e:
        print(f"Prediction API Error: {str(e)}")
        # Clean up on error since background task won't run
        if os.path.exists(temp_path):
            try: os.remove(temp_path)
            except: pass
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/predict-frame")
async def predict_frame(data: Base64Image, authorization: Optional[str] = Header(default=None), background_tasks: BackgroundTasks = BackgroundTasks()):
    temp_path = os.path.join(TEMP_DIR, f"{uuid.uuid4()}.jpg")
    try:
        if not data.image:
            raise HTTPException(status_code=400, detail="Empty image data")

        b64_data = data.image.split(",")[-1]
        img_bytes = base64.b64decode(b64_data)

        with open(temp_path, "wb") as f:
            f.write(img_bytes)

        result = predict_skin_type(temp_path)

        # Schedule Supabase save in background — does NOT block the response
        user_id = get_user_id_from_token(authorization)
        print(f"--> [FRAME] Extracted user_id: {user_id}")
        background_tasks.add_task(save_to_supabase, temp_path, result, user_id)

        # Return result immediately to frontend
        return result
    except Exception as e:
        print(f"Predict-Frame Error: {str(e)}")
        # Clean up on error since background task won't run
        if os.path.exists(temp_path):
            try: os.remove(temp_path)
            except: pass
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/scan-ingredients")
async def scan_ingredients_api(image: UploadFile = File(...)):
    temp_path = os.path.join(TEMP_DIR, f"{uuid.uuid4()}.jpg")
    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
        
        result = scan_ingredients(temp_path)
        return result
    except Exception as e:
        print(f"OCR API Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(temp_path):
            try: os.remove(temp_path)
            except: pass

@app.get("/products/{skin_type}")
async def get_products(skin_type: str):
    try:
        with open(PRODUCTS_PATH, 'r') as f:
            all_products = json.load(f)
        products = all_products.get(skin_type.lower())
        if products is None:
            raise HTTPException(status_code=404, detail=f"No products found for skin type: {skin_type}")
        return products
    except FileNotFoundError:
        raise HTTPException(status_code=500, detail="Products database not found.")

@app.get("/harmful-chemicals")
async def get_harmful():
    return load_harmful()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5001)
