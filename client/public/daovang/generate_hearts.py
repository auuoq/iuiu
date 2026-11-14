import math
from PIL import Image, ImageDraw, ImageFilter

def create_glossy_heart(width, height, sparkle_phase=0.0):
    # Render at 4x resolution for super crisp anti-aliasing
    scale = 4
    W = int(width * scale)
    H = int(height * scale)
    img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Parametric heart path
    # Fit nicely with small margin
    margin = int(W * 0.06)
    usable_w = W - 2 * margin
    usable_h = H - 2 * margin
    cx = W / 2
    # The center of mass of parametric heart is slightly above bottom
    cy = margin + usable_h * 0.46

    # Scale factors: x goes from -16 to 16 (range 32)
    # y goes from -17 to 12 approx (range ~29)
    scale_x = usable_w / 33.0
    scale_y = usable_h / 31.0

    points = []
    steps = 180
    for i in range(steps):
        t = (2 * math.pi * i) / steps
        # Standard parametric heart
        x = 16 * (math.sin(t) ** 3)
        y = -(13 * math.cos(t) - 5 * math.cos(2*t) - 2 * math.cos(3*t) - math.cos(4*t))
        px = cx + x * scale_x
        py = cy + y * scale_y
        points.append((px, py))

    # 1. Base shadow / outer rim (dark ruby crimson)
    draw.polygon(points, fill=(140, 10, 30, 255))

    # 2. Main heart body with inset
    inset_points = []
    inset_factor = 0.94
    for px, py in points:
        ix = cx + (px - cx) * inset_factor
        iy = cy + (py - cy) * inset_factor
        inset_points.append((ix, iy))

    draw.polygon(inset_points, fill=(230, 20, 60, 255))

    # 3. Soft radial shading layer for 3D sphere volume
    shading = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    sdraw = ImageDraw.Draw(shading)

    # Left lobe 3D highlight
    lobe_lx = cx - usable_w * 0.22
    lobe_ly = cy - usable_h * 0.22
    r_lobe = usable_w * 0.28
    for r in range(int(r_lobe), 0, -2):
        alpha = int(120 * (1 - r / r_lobe))
        sdraw.ellipse([lobe_lx - r, lobe_ly - r, lobe_lx + r, lobe_ly + r], fill=(255, 100, 140, alpha))

    # Right lobe 3D highlight
    lobe_rx = cx + usable_w * 0.22
    lobe_ry = cy - usable_h * 0.20
    r_lobe_r = usable_w * 0.22
    for r in range(int(r_lobe_r), 0, -2):
        alpha = int(90 * (1 - r / r_lobe_r))
        sdraw.ellipse([lobe_rx - r, lobe_ry - r, lobe_rx + r, lobe_ry + r], fill=(255, 90, 130, alpha))

    # Bottom shadow
    bottom_y = cy + usable_h * 0.35
    sdraw.ellipse([cx - usable_w * 0.3, bottom_y - usable_h * 0.1, cx + usable_w * 0.3, bottom_y + usable_h * 0.2], fill=(100, 5, 20, 90))

    # Mask shading by the inset heart
    mask = Image.new('L', (W, H), 0)
    ImageDraw.Draw(mask).polygon(inset_points, fill=255)
    img.paste(Image.composite(shading, Image.new('RGBA', (W, H), (0,0,0,0)), mask), (0, 0), mask)

    # 4. Glossy specular shine on top-left lobe
    shine = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    shdraw = ImageDraw.Draw(shine)
    sx = lobe_lx - usable_w * 0.05
    sy = lobe_ly - usable_h * 0.06
    sw = usable_w * 0.16
    sh = usable_h * 0.10
    shdraw.ellipse([sx - sw, sy - sh, sx + sw, sy + sh], fill=(255, 255, 255, 220))
    # Soft secondary shine on right
    shdraw.ellipse([lobe_rx + usable_w * 0.02 - sw*0.6, lobe_ry - sh*0.6, lobe_rx + usable_w * 0.02 + sw*0.6, lobe_ry + sh*0.6], fill=(255, 230, 240, 140))

    shine = shine.filter(ImageFilter.GaussianBlur(radius=scale * 1.2))
    img.alpha_composite(shine)

    # 5. Optional sparkle glint
    if sparkle_phase > 0:
        sp_x = sx + math.cos(sparkle_phase * 2 * math.pi) * sw * 0.5
        sp_y = sy + math.sin(sparkle_phase * 2 * math.pi) * sh * 0.5
        sp_size = usable_w * 0.12 * (0.8 + 0.4 * math.sin(sparkle_phase * 2 * math.pi))
        sparkle = Image.new('RGBA', (W, H), (0, 0, 0, 0))
        spdraw = ImageDraw.Draw(sparkle)
        # 4-point star
        spdraw.line([(sp_x - sp_size, sp_y), (sp_x + sp_size, sp_y)], fill=(255, 255, 255, 250), width=int(scale * 1.5))
        spdraw.line([(sp_x, sp_y - sp_size), (sp_x, sp_y + sp_size)], fill=(255, 255, 255, 250), width=int(scale * 1.5))
        spdraw.ellipse([sp_x - sp_size*0.3, sp_y - sp_size*0.3, sp_x + sp_size*0.3, sp_y + sp_size*0.3], fill=(255, 255, 255, 255))
        img.alpha_composite(sparkle)

    # Downsample with Lanczos for smooth antialiasing
    result = img.resize((width, height), Image.Resampling.LANCZOS)
    return result

# Test creation
test_heart = create_glossy_heart(199, 206, sparkle_phase=0.25)
test_heart.save('client/public/daovang/assets/test_heart_big.png')
test_small = create_glossy_heart(54, 53)
test_small.save('client/public/daovang/assets/test_heart_small.png')
print('Generated test hearts!')

