#!/usr/bin/env python3
"""
Crop bottom 20px from all placeholder images to remove text labels.
This ensures participants cannot see defect type labels during the study.

Usage: python3 scripts/crop_images.py
"""

import os
import sys

try:
    from PIL import Image
except ImportError:
    import subprocess
    subprocess.run([sys.executable, '-m', 'pip', 'install', 'Pillow', '--break-system-packages'], check=True)
    from PIL import Image

IMAGE_DIR = '/Users/skymaster/Library/CloudStorage/OneDrive-NortheasternUniversity/Projects/vigilance-webapp/public/images'

def crop_images():
    """Remove bottom 20px label from all study images."""
    if not os.path.exists(IMAGE_DIR):
        print(f"Error: {IMAGE_DIR} not found")
        return False
    
    images = [f for f in os.listdir(IMAGE_DIR) if f.endswith('.jpg')]
    print(f"Found {len(images)} images to crop")
    
    for filename in images:
        filepath = os.path.join(IMAGE_DIR, filename)
        
        with Image.open(filepath) as img:
            width, height = img.size
            
            # Crop bottom 20px (where text label is)
            cropped = img.crop((0, 0, width, height - 20))
            
            # Resize back to 200x200
            resized = cropped.resize((width, width), Image.Resampling.LANCZOS)
            
            # Save
            resized.save(filepath, 'JPEG', quality=95)
    
    print(f"✅ Cropped {len(images)} images (removed bottom labels)")
    return True

if __name__ == '__main__':
    crop_images()
