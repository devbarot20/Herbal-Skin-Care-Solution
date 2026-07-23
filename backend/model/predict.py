import os
import warnings
import logging
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"
warnings.filterwarnings("ignore", category=DeprecationWarning)
warnings.filterwarnings("ignore", category=FutureWarning)
logging.getLogger("tensorflow").setLevel(logging.ERROR)
import numpy as np
import tensorflow as tf
tf.get_logger().setLevel("ERROR")
from tensorflow.keras.preprocessing import image
import json
import hashlib

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(BASE_DIR, "skin_model.h5")
REMEDIES_PATH = os.path.join(BASE_DIR, "data", "remedies.json")

# Classes: match the generator labels
CLASSES = ["acne", "normal", "oily"]

# Global model cache to avoid reloading on every request
_MODEL = None
_MODEL_MTIME = 0

# Cache for deterministic analysis results keyed by image hash
_RESULT_CACHE = {}

def load_remedies():
    try:
        with open(REMEDIES_PATH, 'r') as f:
            return json.load(f)
    except Exception:
        return {}

def is_face_image(img_path: str) -> bool:
    """
    Returns True if a human face or close-up facial skin is detected.
    Uses MTCNN (Deep Learning) for highly accurate face detection.
    """
    import cv2
    img = cv2.imread(img_path)
    if img is None:
        return False

    h, w = img.shape[:2]
    rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    
    try:
        from mtcnn import MTCNN
        detector = MTCNN()
        faces = detector.detect_faces(rgb_img)
        
        if len(faces) > 0:
            for face in faces:
                fx, fy, fw, fh = face['box']
                confidence = face['confidence']
                ratio = (fw * fh) / (w * h)
                print(f"FACE CHECK (MTCNN): Found {fw}x{fh} ({ratio:.1%}) with conf {confidence:.2f}")
                
                if confidence > 0.85 and ratio >= 0.015:
                    print(f"FACE CHECK: ACCEPTED via MTCNN")
                    return True
    except Exception as e:
        print(f"FACE CHECK (MTCNN): Failed or not available: {e}")

    print(f"FACE CHECK: REJECTED — no face detected by MTCNN")
    return False


def predict_skin_type(img_path, validate_skin: bool = False, is_live_frame: bool = False):
    global _MODEL, _MODEL_MTIME, _RESULT_CACHE
    
    if not os.path.exists(MODEL_PATH):
        return {"error": "Model not found. Training might still be in progress."}
    
    try:
        # Check cache to guarantee identical results for the same image
        with open(img_path, 'rb') as f:
            img_bytes = f.read()
            img_hash = hashlib.md5(img_bytes).hexdigest()
            
        if img_hash in _RESULT_CACHE:
            print(f"CACHE HIT: Returning deterministic result for {img_hash}")
            return _RESULT_CACHE[img_hash]
            
        # Check if model file has changed
        mtime = os.path.getmtime(MODEL_PATH)
        if _MODEL is None or mtime > _MODEL_MTIME:
            import time
            for i in range(3):
                try:
                    _MODEL = tf.keras.models.load_model(MODEL_PATH)
                    _MODEL_MTIME = mtime
                    print(f"Model reloaded from {MODEL_PATH}")
                    _RESULT_CACHE = {}
                    break
                except Exception as e:
                    if i == 2: raise e
                    print(f"Model file busy, retrying in 1s... ({i+1}/3)")
                    time.sleep(1)

        # --- SAFEGUARD: Check OCR FIRST to catch product labels and documents (Skip for Live Camera Frames) ---
        if not is_live_frame:
            import cv2
            import pytesseract
            
            POSSIBLE_TESS_PATHS = [
                r'C:\Program Files\Tesseract-OCR\tesseract.exe',
                r'C:\Program Files (x86)\Tesseract-OCR\tesseract.exe',
                os.path.join(os.environ.get('USERPROFILE', ''), 'AppData', 'Local', 'Tesseract-OCR', 'tesseract.exe')
            ]
            for path in POSSIBLE_TESS_PATHS:
                if os.path.exists(path):
                    pytesseract.pytesseract.tesseract_cmd = path
                    break
            
            img_cv = cv2.imread(img_path)
            if img_cv is not None:
                gray = cv2.cvtColor(img_cv, cv2.COLOR_BGR2GRAY)
                
                try:
                    blurred = cv2.GaussianBlur(gray, (3, 3), 0)
                    thresh = cv2.adaptiveThreshold(
                        blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                        cv2.THRESH_BINARY, 11, 2
                    )
                    
                    custom_config = r'--oem 3 --psm 4'
                    raw_ocr = pytesseract.image_to_string(thresh, config=custom_config)
                    
                    import re
                    alphanumeric_chars = re.sub(r'[^a-zA-Z0-9]', '', raw_ocr)
                    ocr_text = raw_ocr.lower()
                    
                    print(f"SAFEGUARD: Valid OCR text ({len(alphanumeric_chars)} chars found)")
                    
                    if len(alphanumeric_chars) > 35:
                        print(f"SAFEGUARD: BLOCKED — This is a document ({len(alphanumeric_chars)} chars of text)")
                        return {
                            "error": "Image contains text. Please upload a clear human face image, not a document or certificate."
                        }

                    label_words = [
                        "ingredients", "aqua", "water", "sulfate", "paraben", "acid",
                        "cream", "lotion", "serum", "gel", "extract", "oil",
                        "aloe", "leaf", "root", "seed", "flower", "directions",
                        "apply", "rinse", "shampoo", "conditioner", "moistur",
                        "spf", "sunscreen", "fragrance", "preserv", "vitamin",
                        "sodium", "lauryl", "glycerin", "propyl", "mineral"
                    ]
                    
                    matched = [w for w in label_words if w in ocr_text]
                    if len(matched) >= 2:
                        print(f"SAFEGUARD: BLOCKED — matched {len(matched)} label words: {matched}")
                        return {
                            "error": f"This looks like a product label, not skin! Detected words: {', '.join(matched[:5])}. Please use the Ingredient Scanner instead.",
                            "is_label": True
                        }
                    else:
                        print(f"SAFEGUARD: Passed OCR check ({len(matched)} match: {matched})")
                except Exception as ocr_err:
                    print(f"SAFEGUARD: OCR check failed (non-fatal): {str(ocr_err)}")
        # --- END SAFEGUARD ---

        img = image.load_img(img_path, target_size=(224, 224))
        img_array = image.img_to_array(img)
        img_array = np.expand_dims(img_array, axis=0)
        from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
        img_array = preprocess_input(img_array)
        
        predictions = _MODEL(img_array, training=False).numpy()
        
        class_idx = np.argmax(predictions[0])
        confidence = round(float(np.max(predictions[0])), 4)
        
        skin_type = CLASSES[class_idx]
        remedies_db = load_remedies()
        
        probabilities = {CLASSES[i]: round(float(predictions[0][i]), 4) for i in range(len(CLASSES))}
        
        normal_prob = probabilities.get("normal", 0)
        acne_prob = probabilities.get("acne", 0)
        oily_prob = probabilities.get("oily", 0)
        
        health_score = int(round((normal_prob * 100) + (oily_prob * 40) + (acne_prob * 20), 0))
        health_score = max(10, min(100, health_score))
        
        final_result = {
            "skin_type": skin_type,
            "confidence": confidence,
            "probabilities": probabilities,
            "health_score": health_score,
            "remedies": remedies_db.get(skin_type, {}).get("remedies", []),
            "description": remedies_db.get(skin_type, {}).get("description", ""),
            "tips": remedies_db.get(skin_type, {}).get("tips", [])
        }
        
        _RESULT_CACHE[img_hash] = final_result
        return final_result
        
    except Exception as e:
        _MODEL = None
        return {"error": f"Prediction failed: {str(e)}. The model file might be busy or incomplete."}
