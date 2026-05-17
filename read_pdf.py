import sys
import subprocess
import os

try:
    import pypdf
except ImportError:
    print("Installing pypdf...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "pypdf", "--quiet"])
    import pypdf

path = r"C:\Users\savan\Desktop\herbal\CVMU_HACKATHON_4.0PPT.pdf"
if not os.path.exists(path):
    print(f"File not found: {path}")
    sys.exit(1)

try:
    with open(path, "rb") as f:
        reader = pypdf.PdfReader(f)
        for i, page in enumerate(reader.pages):
            print(f"--- Page {i + 1} ---")
            print(page.extract_text())
except Exception as e:
    print(f"Error reading PDF: {e}")
