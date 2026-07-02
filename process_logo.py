import sys
import subprocess

def install_and_import(package):
    try:
        __import__(package)
    except ImportError:
        subprocess.check_call([sys.executable, "-m", "pip", "install", package])

# Ensure rembg and Pillow are installed
try:
    import rembg
    from PIL import Image
except ImportError:
    print("Installing dependencies (rembg, pillow)... This may take a minute.")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "rembg", "pillow"])
    import rembg
    from PIL import Image

input_path = r"C:\Users\User\Pictures\C8L_Photos\logotipoc8l.jpeg"
output_path = r"C:\Users\User\.gemini\antigravity-ide\scratch\c8l-agency\public\logo.png"

print("Removing background...")
with open(input_path, 'rb') as i:
    input_data = i.read()
    # Remove background using rembg
    output_data = rembg.remove(input_data)

# Save intermediate
import os
os.makedirs(os.path.dirname(output_path), exist_ok=True)
with open(output_path, 'wb') as o:
    o.write(output_data)

print("Cropping transparent edges...")
# Open again to crop transparent edges
img = Image.open(output_path)
bbox = img.getbbox()
if bbox:
    img = img.crop(bbox)
    # Save to all target paths
    img.save(output_path, "PNG")
    
    workspace_paths = [
        r"c:\Users\User\Desktop\proyectos c8l leo vela agency\public\logo.png",
        r"c:\Users\User\Desktop\proyectos c8l leo vela agency\public\assets\c8l_logo_blue_chrome.png"
    ]
    for p in workspace_paths:
        try:
            os.makedirs(os.path.dirname(p), exist_ok=True)
            img.save(p, "PNG")
            print(f"Saved copy to: {p}")
        except Exception as e:
            print(f"Error saving to {p}: {e}")

print(f"Success! Logo processed and saved to {output_path} and active web directories")
