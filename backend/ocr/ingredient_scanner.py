import pytesseract
from PIL import Image
import os
import json
import cv2
import numpy as np

# Try to find Tesseract in multiple common Windows locations
POSSIBLE_TESS_PATHS = [
    r'C:\Program Files\Tesseract-OCR\tesseract.exe',
    r'C:\Program Files (x86)\Tesseract-OCR\tesseract.exe',
    os.path.join(os.environ.get('USERPROFILE', ''), 'AppData', 'Local', 'Tesseract-OCR', 'tesseract.exe')
]

for path in POSSIBLE_TESS_PATHS:
    if os.path.exists(path):
        pytesseract.pytesseract.tesseract_cmd = path
        break

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HARMFUL_PATH = os.path.join(BASE_DIR, "data", "harmful_chemicals.json")

def scan_ingredients(image_path):
    text = ""
    # 1. OCR Preprocessing
    try:
        # Check if tesseract is configured/available
        try:
            pytesseract.get_tesseract_version()
        except Exception as e:
            print(f"Tesseract version check failed: {str(e)}")
            return {
                "error": "Tesseract OCR not found on system.",
                "action_required": "Please install Tesseract OCR from: https://github.com/UB-Mannheim/tesseract/wiki and restart the app.",
                "searched_paths": POSSIBLE_TESS_PATHS
            }
        
        # Load image via OpenCV
        img = cv2.imread(image_path)
        if img is None:
            raise Exception("Could not read image (OpenCV returned None)")
            
        # Convert to grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Apply slight blur to reduce noise
        blurred = cv2.GaussianBlur(gray, (3, 3), 0)
        
        # Apply adaptive thresholding to handle uneven lighting
        thresh = cv2.adaptiveThreshold(
            blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
            cv2.THRESH_BINARY, 11, 2
        )
        
        # Perform OCR on the processed image
        text = pytesseract.image_to_string(thresh)
        print(f"OCR extracted text length: {len(text)}")
        
    except Exception as e:
        print(f"OCR Preprocessing Error: {str(e)}")
        return {"error": f"OCR Failed: {str(e)}"}
    
    # 2. Match Harmful Chemicals
    try:
        with open(HARMFUL_PATH, 'r') as f:
            harmful_db = json.load(f)["harmful_chemicals"]
        
        detected = []
        text_lower = text.lower()
        print(f"DEBUG: Matching text: {text_lower[:100]}...") # Log start of text
        
        for chem in harmful_db:
            # Create a list of search terms from the name
            # Example: "Parabens (Methylparaben, Propylparaben)" -> ["parabens", "methylparaben", "propylparaben"]
            name_full = chem["name"].lower()
            
            # Extract common terms from parentheses if they exist
            import re
            terms = re.findall(r'[a-zA-Z0-9\s-]+', name_full)
            # Filter out very short strings
            search_terms = [t.strip() for t in terms if len(t.strip()) > 3]
            
            is_match = False
            for term in search_terms:
                if term in text_lower:
                    is_match = True
                    print(f"DEBUG: Matched '{term}' from database entry '{chem['name']}'")
                    break
            
            if is_match:
                detected.append(chem)
                
        print(f"DEBUG: Total chemicals detected: {len(detected)}")
        return {
            "raw_text": text,
            "harmful_detected": detected
        }
    except Exception as e:
        print(f"Matching Error: {str(e)}")
        return {"error": f"Chemical Matching Failed: {str(e)}"}
