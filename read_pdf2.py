import sys
import subprocess

try:
    import pypdf
except ImportError:
    subprocess.check_call([sys.executable, "-m", "pip", "install", "pypdf", "--quiet"])
    import pypdf

path = r"C:\Users\savan\Desktop\herbal\CVMU_HACKATHON_4.0PPT.pdf"

with open(path, "rb") as f:
    reader = pypdf.PdfReader(f)
    all_text = []
    for i, page in enumerate(reader.pages):
        try:
            text = page.extract_text()
            if text:
                all_text.append(f"--- Page {i+1} ---\n{text}")
        except Exception as e:
            all_text.append(f"--- Page {i+1} --- [Error: {e}]")

output = "\n".join(all_text)
# Write with utf-8 encoding
with open(r"C:\Users\savan\Desktop\herbal\pdf_output2.txt", "w", encoding="utf-8", errors="replace") as out:
    out.write(output)

print("Done! Total pages:", len(reader.pages))
