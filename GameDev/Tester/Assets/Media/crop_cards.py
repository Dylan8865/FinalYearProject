from PIL import Image
import os

img_path = 'Screenshot 2026-07-02 153137.png'
img = Image.open(img_path).convert('L')
pixels = img.load()
width, height = img.size

# Find rows (Y axis)
row_sums = [sum(pixels[x, y] for x in range(width)) for y in range(height)]
# Find columns (X axis)
col_sums = [sum(pixels[x, y] for y in range(height)) for x in range(width)]

def get_segments(sums, threshold, min_length):
    segments = []
    in_segment = False
    start = 0
    for i, val in enumerate(sums):
        # average pixel value in this row/col across the other dimension
        # if the average is above a certain threshold (e.g., > 10 for background #0B1120)
        avg = val / (width if len(sums) == height else height)
        if avg > threshold:
            if not in_segment:
                start = i
                in_segment = True
        else:
            if in_segment:
                if i - start >= min_length:
                    segments.append((start, i))
                in_segment = False
    if in_segment and (len(sums) - start) >= min_length:
        segments.append((start, len(sums)))
    return segments

# The background is very dark (around 10-20 grayscale). Let's use threshold 20.
# Min length of a card is maybe 100 pixels
y_segments = get_segments(row_sums, 15, 100)
x_segments = get_segments(col_sums, 15, 80)

print(f"Found {len(y_segments)} row segments and {len(x_segments)} col segments.")

# We should have 2 row segments, and maybe 7 column segments.
# Wait, the cards might have a dark background too, so average pixel value might be low.
# Let's try threshold 15.

elements = ['Na', 'Cl', 'Mg', 'O', 'Al', 'Fe', 'H', 'C', 'N']
idx = 0
original_img = Image.open(img_path).convert('RGBA')

for y_start, y_end in y_segments:
    for x_start, x_end in x_segments:
        # Check if there is actually a card here (row 2 only has 2 cards)
        # We can check the center of the crop
        center_x = (x_start + x_end) // 2
        center_y = (y_start + y_end) // 2
        avg_center = sum(original_img.getpixel((center_x + dx, center_y + dy))[0] for dx in range(-5, 5) for dy in range(-5, 5)) / 100
        
        if avg_center > 10 and idx < len(elements):
            crop = original_img.crop((x_start, y_start, x_end, y_end))
            out_name = f'Element_{elements[idx]}.png'
            crop.save(out_name)
            print(f'Saved {out_name}')
            idx += 1
