#!/usr/bin/env python3
from PIL import Image, ImageDraw, ImageFont
import os

def create_allie_logo(size):
    """Create the Allie 'A' logo as a PNG"""
    # Create white background with rounded corners effect
    img = Image.new('RGBA', (size, size), (255, 255, 255, 255))
    draw = ImageDraw.Draw(img)

    # Add subtle rounded corner effect
    corner_radius = size // 8

    # Teal color for the 'A' - #14B8A6
    teal_color = (20, 184, 166)

    # Font size should be about 70% of image size
    font_size = int(size * 0.7)

    try:
        # Try to use system font
        font = ImageFont.truetype("/System/Library/Fonts/Arial.ttf", font_size)
    except:
        try:
            # Fallback to default PIL font
            font = ImageFont.load_default()
        except:
            # Last resort - draw without font
            font = None

    # Calculate text position to center the 'A'
    if font:
        # Get text bounding box
        bbox = draw.textbbox((0, 0), "A", font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
    else:
        # Estimate dimensions
        text_width = font_size * 0.6
        text_height = font_size

    # Center the text
    x = (size - text_width) // 2
    y = (size - text_height) // 2 - font_size // 10  # Slight adjustment

    # Draw the 'A' letter
    if font:
        draw.text((x, y), "A", font=font, fill=teal_color)
    else:
        # Fallback: draw a simple A shape
        draw.polygon([
            (size//2, size//4),           # Top point
            (size//3, size*3//4),         # Bottom left
            (size//3 + size//10, size*3//4),  # Bottom left inner
            (size//2 - size//20, size//2),    # Left middle
            (size//2 + size//20, size//2),    # Right middle
            (size*2//3 - size//10, size*3//4), # Bottom right inner
            (size*2//3, size*3//4),       # Bottom right
        ], fill=teal_color)

    return img

def main():
    """Generate all required logo sizes"""
    sizes = [16, 32, 180, 192, 512]

    print("Creating Allie logos...")

    for size in sizes:
        print(f"Creating {size}x{size} logo...")
        img = create_allie_logo(size)

        if size == 16:
            filename = "favicon-16x16.png"
        elif size == 32:
            filename = "favicon-32x32.png"
        elif size == 180:
            filename = "apple-touch-icon.png"
        elif size == 192:
            filename = "logo192.png"
        elif size == 512:
            filename = "logo512.png"

        img.save(filename)
        print(f"Saved {filename}")

    # Also create favicon.ico
    print("Creating favicon.ico...")
    ico_img = create_allie_logo(32)
    ico_img.save("favicon.ico", format='ICO', sizes=[(32,32)])
    print("Saved favicon.ico")

    print("✅ All Allie logos created successfully!")

if __name__ == "__main__":
    main()