#!/usr/bin/env python3
"""
Generate PWA icons for PinoyPOS
Requires: pip install Pillow
"""

from PIL import Image, ImageDraw, ImageFont
import os

# Configuration
SIZES = [192, 512]
BG_COLOR = "#00C853"  # Material Design Green
TEXT_COLOR = "#FFFFFF"
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'public')

def generate_icon(size):
    """Generate a simple icon with background color and text"""
    # Create image
    img = Image.new('RGB', (size, size), BG_COLOR)
    draw = ImageDraw.Draw(img)
    
    # Calculate font size (60% of image size)
    font_size = int(size * 0.6)
    
    # Try to use a system font, fallback to default
    try:
        # macOS fonts
        font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", font_size)
    except:
        try:
            # Try Arial
            font = ImageFont.truetype("/Library/Fonts/Arial.ttf", font_size)
        except:
            # Fallback to default font
            font = ImageFont.load_default()
    
    # Draw text centered
    text = "P"
    
    # Get text bounding box to center it
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    
    position = ((size - text_width) // 2, (size - text_height) // 2 - bbox[1])
    draw.text(position, text, fill=TEXT_COLOR, font=font)
    
    # Save
    output_path = os.path.join(OUTPUT_DIR, f'icon-{size}x{size}.png')
    img.save(output_path, 'PNG')
    print(f'✅ Created: {output_path}')

if __name__ == '__main__':
    print('🎨 Generating PinoyPOS PWA Icons...\n')
    
    for size in SIZES:
        try:
            generate_icon(size)
        except Exception as e:
            print(f'❌ Error generating {size}x{size}: {e}')
    
    print(f'\n✅ Done! Icons saved to {OUTPUT_DIR}')
    print('📦 Commit and deploy to Netlify')
