#!/usr/bin/env python3
"""Create 90 placeholder images for vigilance study"""

import os
try:
    from PIL import Image, ImageDraw
except ImportError:
    import subprocess
    subprocess.run(['pip', 'install', 'Pillow', '--break-system-packages'], check=True)
    from PIL import Image, ImageDraw

OUTPUT_DIR = '/Users/skymaster/Library/CloudStorage/OneDrive-NortheasternUniversity/Projects/vigilance-webapp/public/images'

# Clear old images
import shutil
if os.path.exists(OUTPUT_DIR):
    shutil.rmtree(OUTPUT_DIR)
os.makedirs(OUTPUT_DIR)

DEFECT_CONFIG = {
    'Cr': {'count': 8, 'name': 'CRAZING'},
    'In': {'count': 8, 'name': 'INCLUSION'},
    'Pa': {'count': 8, 'name': 'PATCHES'},
    'PS': {'count': 7, 'name': 'PITTED'},
    'RS': {'count': 7, 'name': 'ROLLED SCALE'},
    'Sc': {'count': 7, 'name': 'SCRATCHES'},
}

import random

def create_defect_image(defect_type, num, name):
    img = Image.new('L', (200, 200), color=120)
    draw = ImageDraw.Draw(img)
    random.seed(f"{defect_type}_{num}")
    
    if defect_type == 'Cr':
        for _ in range(15):
            x1, y1 = random.randint(50, 150), random.randint(50, 150)
            x2, y2 = x1 + random.randint(-30, 30), y1 + random.randint(-30, 30)
            draw.line([(x1, y1), (x2, y2)], fill=60, width=1)
    elif defect_type == 'In':
        for _ in range(5):
            x, y = random.randint(60, 140), random.randint(60, 140)
            r = random.randint(5, 15)
            draw.ellipse([x-r, y-r, x+r, y+r], fill=40)
    elif defect_type == 'Pa':
        x, y = random.randint(50, 100), random.randint(50, 100)
        points = [(x + random.randint(-30, 30), y + random.randint(-30, 30)) for _ in range(6)]
        draw.polygon(points, fill=80)
    elif defect_type == 'PS':
        for _ in range(20):
            x, y = random.randint(40, 160), random.randint(40, 160)
            r = random.randint(2, 5)
            draw.ellipse([x-r, y-r, x+r, y+r], fill=50)
    elif defect_type == 'RS':
        for _ in range(8):
            y = random.randint(40, 160)
            x1, x2 = random.randint(20, 80), random.randint(120, 180)
            draw.line([(x1, y), (x2, y)], fill=70, width=random.randint(3, 8))
    elif defect_type == 'Sc':
        for _ in range(3):
            x1, y1 = random.randint(20, 60), random.randint(20, 180)
            x2, y2 = random.randint(140, 180), random.randint(20, 180)
            draw.line([(x1, y1), (x2, y2)], fill=50, width=2)
    
    draw.rectangle([0, 180, 200, 200], fill=40)
    draw.text((5, 182), f"{name} #{num}", fill=200)
    draw.rectangle([0, 0, 199, 199], outline=100, width=3)
    
    img.save(os.path.join(OUTPUT_DIR, f"{defect_type}_{num:03d}.jpg"), 'JPEG', quality=90)

def create_no_defect_image(num):
    img = Image.new('L', (200, 200), color=130)
    draw = ImageDraw.Draw(img)
    random.seed(f"none_{num}")
    for _ in range(500):
        x, y = random.randint(0, 199), random.randint(0, 179)
        c = 130 + random.randint(-10, 10)
        draw.point((x, y), fill=c)
    draw.rectangle([0, 180, 200, 200], fill=60)
    draw.text((5, 182), f"NO DEFECT #{num}", fill=200)
    draw.rectangle([0, 0, 199, 199], outline=150, width=2)
    img.save(os.path.join(OUTPUT_DIR, f"none_{num:03d}.jpg"), 'JPEG', quality=90)

print("Creating 90 placeholder images...")

for dtype, config in DEFECT_CONFIG.items():
    for i in range(1, config['count'] + 1):
        create_defect_image(dtype, i, config['name'])
    print(f"  Created {config['count']} {dtype} images")

for i in range(1, 46):
    create_no_defect_image(i)
print("  Created 45 non-defect images")

total = len([f for f in os.listdir(OUTPUT_DIR) if f.endswith('.jpg')])
print(f"\n✅ Total: {total} images")
