#!/usr/bin/env python3
from PIL import Image, ImageDraw
import math

def create_family_logo(size):
    """Create the family stick figure logo as a PNG"""
    # Create white background
    img = Image.new('RGB', (size, size), 'white')
    draw = ImageDraw.Draw(img)

    # Scale factors based on 512 original
    scale = size / 512

    # Line width
    line_width = max(1, int(8 * scale))

    # Draw center circle (head)
    center_x = int(256 * scale)
    center_y = int(150 * scale)
    center_r = int(60 * scale)
    draw.ellipse([center_x - center_r, center_y - center_r,
                  center_x + center_r, center_y + center_r],
                 outline='black', width=line_width)

    # Draw left circle (head)
    left_x = int(150 * scale)
    left_y = int(200 * scale)
    left_r = int(50 * scale)
    draw.ellipse([left_x - left_r, left_y - left_r,
                  left_x + left_r, left_y + left_r],
                 outline='black', width=line_width)

    # Draw right circle (head)
    right_x = int(362 * scale)
    right_y = int(200 * scale)
    right_r = int(50 * scale)
    draw.ellipse([right_x - right_r, right_y - right_r,
                  right_x + right_r, right_y + right_r],
                 outline='black', width=line_width)

    # Draw curved line (body)
    # Approximate the quadratic bezier with line segments
    points = []
    for t in range(0, 101, 5):
        t_norm = t / 100.0
        # Quadratic bezier formula
        x = (1 - t_norm)**2 * (130 * scale) + \
            2 * (1 - t_norm) * t_norm * (256 * scale) + \
            t_norm**2 * (382 * scale)
        y = (1 - t_norm)**2 * (250 * scale) + \
            2 * (1 - t_norm) * t_norm * (400 * scale) + \
            t_norm**2 * (250 * scale)
        points.append((int(x), int(y)))

    # Draw the curve as connected line segments
    for i in range(len(points) - 1):
        draw.line([points[i], points[i + 1]], fill='black', width=line_width)

    return img

# Create both sizes
logo192 = create_family_logo(192)
logo192.save('logo192.png', 'PNG')
print("Created logo192.png")

logo512 = create_family_logo(512)
logo512.save('logo512.png', 'PNG')
print("Created logo512.png")

print("\nFamily stick figure logos created successfully!")
print("The files have been saved as logo192.png and logo512.png")