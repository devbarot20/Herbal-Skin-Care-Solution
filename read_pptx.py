import zipfile
import xml.etree.ElementTree as ET
import os

path = r"C:\Users\savan\Desktop\herbal\CVMU_HACKATHON_4.0PPT.pptx"
if not os.path.exists(path):
    print(f"File not found: {path}")
else:
    text_content = []
    try:
        with zipfile.ZipFile(path, 'r') as z:
            # Sort slides to maintain order (slide1.xml, slide2.xml, etc.)
            slide_files = [f for f in z.namelist() if f.startswith('ppt/slides/slide') and f.endswith('.xml')]
            slide_files.sort(key=lambda x: int(''.join(filter(str.isdigit, x.split('/')[-1]))))
            
            for index, filename in enumerate(slide_files):
                xml_content = z.read(filename)
                tree = ET.fromstring(xml_content)
                namespaces = {'a': 'http://schemas.openxmlformats.org/drawingml/2006/main'}
                slide_text = []
                for node in tree.findall('.//a:t', namespaces):
                    if node.text:
                        slide_text.append(node.text)
                text_content.append(f"--- Slide {index + 1} ---")
                text_content.append('\n'.join(slide_text))
        print('\n'.join(text_content))
    except Exception as e:
        print(f"Error: {e}")
