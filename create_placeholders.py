#!/usr/bin/env python3
"""
Create 180 placeholder JPEG images for the vigilance inspection study.

Output: <project>/public/images/
  - Cr_001.jpg … Cr_015.jpg   (Crazing, 15 images)
  - In_001.jpg … In_015.jpg   (Inclusion, 15 images)
  - Pa_001.jpg … Pa_015.jpg   (Patches, 15 images)
  - PS_001.jpg … PS_015.jpg   (Pitted Surface, 15 images)
  - RS_001.jpg … RS_015.jpg   (Rolled-in Scale, 15 images)
  - Sc_001.jpg … Sc_015.jpg   (Scratches, 15 images)
  - none_001.jpg … none_090.jpg  (No defect, 90 images)
"""

import os
import random

try:
    from PIL import Image, ImageDraw
except ImportError:
    import subprocess
    subprocess.run(["pip3", "install", "Pillow", "--break-system-packages", "-q"], check=True)
    from PIL import Image, ImageDraw

# ── Paths ───────────────────────────────────────────────────────────────────
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(SCRIPT_DIR, "public", "images")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# ── Constants ────────────────────────────────────────────────────────────────
SIZE = (200, 200)
DEFECT_CODES = ["Cr", "In", "Pa", "PS", "RS", "Sc"]
DEFECT_NAMES = {
    "Cr": "CRAZING",
    "In": "INCLUSION",
    "Pa": "PATCHES",
    "PS": "PITTED",
    "RS": "ROLLED SCALE",
    "Sc": "SCRATCHES",
}


def _base_texture(draw: ImageDraw.ImageDraw, rng: random.Random) -> None:
    """Add a subtle random noise texture to the background."""
    for _ in range(800):
        x = rng.randint(0, SIZE[0] - 1)
        y = rng.randint(0, SIZE[1] - 1)
        c = 115 + rng.randint(-12, 12)
        draw.point((x, y), fill=c)


def create_defect_image(defect_type: str, num: int) -> None:
    img = Image.new("L", SIZE, color=118)
    draw = ImageDraw.Draw(img)
    rng = random.Random(f"{defect_type}_{num}")

    _base_texture(draw, rng)

    if defect_type == "Cr":          # Crazing – network of micro-cracks
        for _ in range(20):
            x1 = rng.randint(40, 160)
            y1 = rng.randint(40, 160)
            x2 = x1 + rng.randint(-35, 35)
            y2 = y1 + rng.randint(-35, 35)
            draw.line([(x1, y1), (x2, y2)], fill=55, width=1)

    elif defect_type == "In":        # Inclusion – dark foreign-material spots
        for _ in range(6):
            x = rng.randint(50, 150)
            y = rng.randint(50, 150)
            r = rng.randint(5, 14)
            draw.ellipse([x - r, y - r, x + r, y + r], fill=38)

    elif defect_type == "Pa":        # Patches – discoloured polygon
        cx = rng.randint(70, 130)
        cy = rng.randint(70, 130)
        pts = [
            (cx + rng.randint(-35, 35), cy + rng.randint(-35, 35))
            for _ in range(7)
        ]
        draw.polygon(pts, fill=78)

    elif defect_type == "PS":        # Pitted surface – many small pits
        for _ in range(25):
            x = rng.randint(30, 170)
            y = rng.randint(30, 170)
            r = rng.randint(2, 6)
            draw.ellipse([x - r, y - r, x + r, y + r], fill=48)

    elif defect_type == "RS":        # Rolled-in scale – horizontal streaks
        for _ in range(10):
            y = rng.randint(35, 165)
            x1 = rng.randint(10, 70)
            x2 = rng.randint(130, 190)
            draw.line([(x1, y), (x2, y)], fill=68, width=rng.randint(3, 9))

    elif defect_type == "Sc":        # Scratches – long diagonal lines
        for _ in range(4):
            x1 = rng.randint(10, 50)
            y1 = rng.randint(10, 190)
            x2 = rng.randint(150, 190)
            y2 = rng.randint(10, 190)
            draw.line([(x1, y1), (x2, y2)], fill=45, width=2)

    # Label bar
    draw.rectangle([0, 180, 200, 200], fill=38)
    draw.text((4, 183), f"{DEFECT_NAMES[defect_type]} #{num}", fill=200)

    # Thin border
    draw.rectangle([0, 0, 199, 199], outline=90, width=2)

    filename = f"{defect_type}_{num:03d}.jpg"
    img.save(os.path.join(OUTPUT_DIR, filename), "JPEG", quality=92)


def create_no_defect_image(num: int) -> None:
    img = Image.new("L", SIZE, color=128)
    draw = ImageDraw.Draw(img)
    rng = random.Random(f"none_{num}")

    _base_texture(draw, rng)

    # Label bar
    draw.rectangle([0, 180, 200, 200], fill=55)
    draw.text((4, 183), f"NO DEFECT #{num}", fill=210)

    # Thin border
    draw.rectangle([0, 0, 199, 199], outline=148, width=2)

    filename = f"none_{num:03d}.jpg"
    img.save(os.path.join(OUTPUT_DIR, filename), "JPEG", quality=92)


# ── Main ─────────────────────────────────────────────────────────────────────
print(f"Writing images to: {OUTPUT_DIR}")

for dtype in DEFECT_CODES:
    for i in range(1, 16):
        create_defect_image(dtype, i)
    print(f"  ✓  {dtype} – 15 images")

for i in range(1, 91):
    create_no_defect_image(i)
print("  ✓  none – 90 images")

total = len([f for f in os.listdir(OUTPUT_DIR) if f.endswith(".jpg")])
print(f"\n✅  Done – {total} images in {OUTPUT_DIR}")
