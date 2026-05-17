import os
import subprocess
import sys

def install_and_import(package):
    try:
        __import__(package)
    except ImportError:
        print(f"Installing {package}...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", package])

install_and_import('fpdf')
from fpdf import FPDF

class PDFReport(FPDF):
    def header(self):
        self.set_font('Arial', 'B', 15)
        self.cell(0, 10, 'HerbHacks - AI Herbal Skin Care Solution', 0, 1, 'C')
        self.set_font('Arial', '', 10)
        self.cell(0, 10, 'Complete Project Analysis Report', 0, 1, 'C')
        self.ln(10)

    def footer(self):
        self.set_y(-15)
        self.set_font('Arial', 'I', 8)
        self.cell(0, 10, f'Page {self.page_no()}', 0, 0, 'C')

    def chapter_title(self, title):
        self.set_font('Arial', 'B', 12)
        self.set_fill_color(200, 220, 255)
        self.cell(0, 10, title, 0, 1, 'L', 1)
        self.ln(4)

    def chapter_body(self, text):
        self.set_font('Arial', '', 11)
        # Replacing unicode characters that might throw errors in FPDF
        text = text.encode('latin-1', 'replace').decode('latin-1')
        self.multi_cell(0, 7, text)
        self.ln()

def generate_report():
    pdf = PDFReport()
    pdf.add_page()
    
    # 1. Project Overview
    pdf.chapter_title('1. Project Overview')
    overview = (
        "HerbHacks is an AI-powered holistic skin health tracking and diagnostic platform. "
        "The application allows users to analyze their skin for potential conditions (like acne, eczema, etc.), "
        "receive personalized Ayurvedic and herbal remedies based on those conditions, and track their skin "
        "health progress over time via a private cloud-synchronized dashboard. It also provides an OCR-based "
        "ingredient scanner to flag harmful chemicals in cosmetic products."
    )
    pdf.chapter_body(overview)
    
    # 2. Technology Stack
    pdf.chapter_title('2. Technology Stack')
    tech_stack = (
        "Frontend:\n"
        "- React (Vite) for fast UI rendering.\n"
        "- Tailwind CSS for modern, responsive glassmorphism styling.\n"
        "- Recharts for visualizing the skin health score progress.\n"
        "- Supabase Authentication for login and session management.\n\n"
        "Backend:\n"
        "- FastAPI (Python) serving as the main backend router.\n"
        "- TensorFlow (Keras) for AI skin disease classification (MobileNet/Custom CNN).\n"
        "- MediaPipe & MTCNN for robust offline face detection and cropping.\n"
        "- EasyOCR / Tesseract for ingredient scanning and text extraction.\n"
        "- Supabase PostgreSQL for cloud database (scan_history, users).\n"
        "- Supabase Storage for secure long-term image archiving."
    )
    pdf.chapter_body(tech_stack)
    
    # 3. Key Technical Features
    pdf.chapter_title('3. Key Features List')
    features = (
        "1. AI Skin Analysis: Evaluates user-uploaded or live-captured face images to classify skin conditions.\n"
        "2. Face Validation Safeguard: Prevents non-human objects from being evaluated by the AI.\n"
        "3. Live Camera Tracking: Mediapipe detects and aligns the user's face in real-time.\n"
        "4. Supabase Auth & History: Users have private dashboards securely displaying their historical charts.\n"
        "5. Harmful Chemical Scanner (OCR): Users highlight ingredients on product labels to check toxicity.\n"
        "6. Herbal Remedies DB: Provides organic Ayurvedic treatments mapped specifically to AI predictions.\n"
        "7. Store Locator: Integrated mapping interface to locate nearby herbal/organic stores."
    )
    pdf.chapter_body(features)
    
    # 4. Data Flow & Security
    pdf.chapter_title('4. Data Architecture & Security')
    architecture = (
        "When a user performs a scan, the frontend delegates authentication tokens to the FastAPI backend. "
        "The backend first validates the image to ensure it contains a human face. If valid, the image is passed "
        "to the TensorFlow model which outputs a disease confidence score and matches it with a JSON database of "
        "remedies. Simultaneously, a background task uploads the image to a Supabase Storage Bucket, secures the "
        "private URL, and inserts the result block into the PostgreSQL 'scan_history' table. Supabase Row Level "
        "Security (RLS) ensures that when the user accesses their Dashboard later, they can only retrieve rows "
        "matching their unique cryptographic JWT signature."
    )
    pdf.chapter_body(architecture)

    # 5. Hackathon Judge Q&A
    pdf.chapter_title('5. Anticipated Judge Questions & Answers')
    qna = (
        "Q1: How does your AI ensure it's actually analyzing skin and not a random object or wallpaper?\n"
        "A1: We implemented strict safeguards using MediaPipe and MTCNN. Before our TensorFlow skin model runs, "
        "MTCNN scans the image. If no human face is detected with high confidence, the backend instantly rejects "
        "the upload, saving cloud compute resources and ensuring clinical data integrity.\n\n"
        
        "Q2: How is user privacy and scan history secured?\n"
        "A2: We use Supabase Authentication for secure JWT sessions. For the database, we implemented PostgreSQL "
        "Row Level Security (RLS). This cryptographic safeguard ensures that even though scans are efficiently "
        "saved to the cloud, the React frontend can only ever query and view the specific 'scan_history' rows "
        "that cryptographically match the logged-in user's ID.\n\n"
        
        "Q3: What is the technical flow of the Live Camera feature?\n"
        "A3: The React frontend accesses the webcam and runs MediaPipe's WASM face detector edge-side "
        "purely to ensure the user is perfectly aligned in the UI frame. Once aligned for 1 full second, "
        "it captures a base64 frame and sends it securely to our FastAPI backend. The backend runs the heavy TensorFlow "
        "classification, concurrently schedules an asynchronous background task to save to Supabase, and instantly "
        "returns the Ayurvedic remedies to the user for a lightning-fast experience.\n\n"
        
        "Q4: How does the ingredient scanner work?\n"
        "A4: We utilize Optical Character Recognition (OCR) on user photos of skincare product labels. "
        "The extracted text is normalized in Python and cross-referenced against our local dictionary of known "
        "harmful cosmetic chemicals (e.g., Parabens, Sulfates). It strictly highlights toxic ingredients, "
        "promoting our holistic, herbal-safe ethos."
    )
    pdf.chapter_body(qna)
    
    pdf.output('HerbHacks_Project_Analysis.pdf')
    print("Report generated successfully: HerbHacks_Project_Analysis.pdf")

if __name__ == '__main__':
    generate_report()
