import os
import json
import math
from PIL import Image, ImageDraw, ImageFilter

def create_solid_glossy_heart(width, height, sparkle_phase=0.0):
    scale = 4
    W = max(16, int(width * scale))
    H = max(16, int(height * scale))
    
    img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    margin = max(2, int(min(W, H) * 0.05))
    usable_w = W - 2 * margin
    usable_h = H - 2 * margin
    cx = W / 2.0
    cy = margin + usable_h * 0.44

    scale_x = usable_w / 33.0
    scale_y = usable_h / 31.0

    points = []
    steps = 140
    for i in range(steps):
        t = (2 * math.pi * i) / steps
        x = 16 * (math.sin(t) ** 3)
        y = -(13 * math.cos(t) - 5 * math.cos(2*t) - 2 * math.cos(3*t) - math.cos(4*t))
        px = cx + x * scale_x
        py = cy + y * scale_y
        points.append((px, py))

    # Outer border (dark crimson outline for crisp pop against soil)
    draw.polygon(points, fill=(130, 8, 30, 255))

    # Inner body - vibrant, rich ruby red
    inset_factor = 0.91 if min(width, height) > 20 else 0.83
    inset_points = [(cx + (px - cx) * inset_factor, cy + (py - cy) * inset_factor) for px, py in points]
    draw.polygon(inset_points, fill=(235, 20, 65, 255))

    # Soft 3D lighting & volume layer
    lighting = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    ldraw = ImageDraw.Draw(lighting)

    # Upper Left lobe highlight
    lobe_lx = cx - usable_w * 0.22
    lobe_ly = cy - usable_h * 0.22
    r_lobe = usable_w * 0.28
    for r in range(int(r_lobe), 0, -2):
        alpha = int(140 * (1 - r / r_lobe))
        ldraw.ellipse([lobe_lx - r, lobe_ly - r, lobe_lx + r, lobe_ly + r], fill=(255, 140, 180, alpha))

    # Upper Right lobe highlight
    lobe_rx = cx + usable_w * 0.22
    lobe_ry = cy - usable_h * 0.20
    r_lobe_r = usable_w * 0.24
    for r in range(int(r_lobe_r), 0, -2):
        alpha = int(110 * (1 - r / r_lobe_r))
        ldraw.ellipse([lobe_rx - r, lobe_ry - r, lobe_rx + r, lobe_ry + r], fill=(255, 120, 160, alpha))

    # Soft curved bottom shade (dark ruby depth)
    bottom_y = cy + usable_h * 0.38
    for r in range(int(usable_w * 0.35), 0, -3):
        alpha = int(80 * (1 - r / (usable_w * 0.35)))
        ldraw.ellipse([cx - r, bottom_y - r*0.6, cx + r, bottom_y + r*0.6], fill=(80, 5, 15, alpha))

    # Blur lighting slightly for ultra-smooth realistic crystal depth
    lighting = lighting.filter(ImageFilter.GaussianBlur(radius=max(1, int(scale * 0.7))))

    # Mask lighting to stay inside inner heart
    mask = Image.new('L', (W, H), 0)
    ImageDraw.Draw(mask).polygon(inset_points, fill=255)
    lighting.putalpha(Image.composite(lighting.split()[3], Image.new('L', (W, H), 0), mask))
    
    img.alpha_composite(lighting)

    # Specular glass shine (bright curved glint on the lobe)
    shine = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    shdraw = ImageDraw.Draw(shine)
    sx = lobe_lx - usable_w * 0.04
    sy = lobe_ly - usable_h * 0.05
    sw = usable_w * 0.16
    sh = usable_h * 0.11
    shdraw.ellipse([sx - sw, sy - sh, sx + sw, sy + sh], fill=(255, 255, 255, 245))
    shdraw.ellipse([lobe_rx + usable_w * 0.02 - sw*0.5, lobe_ry - sh*0.5, lobe_rx + usable_w * 0.02 + sw*0.5, lobe_ry + sh*0.5], fill=(255, 240, 245, 170))
    shine = shine.filter(ImageFilter.GaussianBlur(radius=max(1, int(scale * 0.8))))
    img.alpha_composite(shine)

    # 4-pointed diamond sparkle glint
    if sparkle_phase > 0:
        angle = sparkle_phase * 2 * math.pi
        sp_x = sx + math.cos(angle) * sw * 0.5
        sp_y = sy + math.sin(angle) * sh * 0.4
        sp_size = usable_w * 0.18 * (0.8 + 0.35 * math.sin(angle * 2))
        sparkle = Image.new('RGBA', (W, H), (0, 0, 0, 0))
        spdraw = ImageDraw.Draw(sparkle)
        spdraw.line([(sp_x - sp_size, sp_y), (sp_x + sp_size, sp_y)], fill=(255, 255, 255, 255), width=max(1, int(scale * 1.5)))
        spdraw.line([(sp_x, sp_y - sp_size), (sp_x, sp_y + sp_size)], fill=(255, 255, 255, 255), width=max(1, int(scale * 1.5)))
        spdraw.ellipse([sp_x - sp_size*0.25, sp_y - sp_size*0.25, sp_x + sp_size*0.25, sp_y + sp_size*0.25], fill=(255, 255, 255, 255))
        img.alpha_composite(sparkle)

    return img.resize((width, height), Image.Resampling.LANCZOS)

def apply_hearts_to_atlas():
    atlas_json_path = 'client/public/daovang/assets/atlas.json'
    atlas_png_path = 'client/public/daovang/assets/atlas.png'
    atlas_webp_path = 'client/public/daovang/assets/atlas.webp'

    # Always load from pristine original backup
    if not os.path.exists('client/public/daovang/assets/atlas_original.png'):
        Image.open(atlas_png_path).save('client/public/daovang/assets/atlas_original.png')
        print('Backed up atlas_original.png')

    atlas_img = Image.open('client/public/daovang/assets/atlas_original.png').convert('RGBA')

    with open(atlas_json_path, 'r', encoding='utf-8') as f:
        d = json.load(f)

    frames = d['frames']
    if isinstance(frames, dict):
        frames = [{'filename': k, **v} for k, v in frames.items()]

    modified_rects = set()
    count = 0

    # 1. ACTUAL IN-GAME LEVEL GOLD SPRITES:
    # sprite207 ($500), sprite311 ($500), sprite316 ($250), sprite217 ($100), sprite314 ($100), sprite205 ($50), sprite312 ($50)
    game_gold_targets = [
        ('sprite207.png', 0.0),
        ('sprite311.png', 0.0),
        ('sprite316.png', 0.0),
        ('sprite217.png', 0.0),
        ('sprite314.png', 0.0),
        ('sprite205.png', 0.0),
        ('sprite312.png', 0.0),
    ]

    # Animation frames for the sparkle on $500 gold
    for i in range(1, 10):
        game_gold_targets.append((f'sprite207_000{i}.png', i / 9.0))

    # Also keep goldBig (title/menu)
    for i in range(1, 10):
        game_gold_targets.append((f'goldBig_000{i}.png', i / 9.0))

    # 2. IN-GAME HOOK HOLDING GOLD FRAMES (ONLY TYPES 2, 3, 4, 5 ARE GOLD!):
    # hv2: Type 2 (Small gold $50)
    # hv3: Type 3 (Medium gold $100)
    # hv4: Type 4 (Large gold $250)
    # hv5: Type 5 (Giant gold $500)
    # NOTE:
    # hv1 is the EMPTY claw -> MUST STAY ORIGINAL CLAW!
    # hv8 and hv14 are ROCKS -> MUST STAY ORIGINAL ROCKS!
    # hv11 is DIAMOND -> MUST STAY ORIGINAL DIAMOND!
    # hv12 is MYSTERY BAG -> MUST STAY ORIGINAL BAG!
    # hv6, hv7, hv10 are MICE -> MUST STAY ORIGINAL MICE!
    # hv13 is BONE, hv9 is SKULL -> MUST STAY ORIGINAL!
    for i in [2, 3, 4, 5]:
        game_gold_targets.append((f'hv{i}.png', 0.0))

    for name, sparkle in game_gold_targets:
        f_meta = next((f for f in frames if f['filename'] == name), None)
        if f_meta:
            fr = f_meta['frame']
            x, y, w, h = fr['x'], fr['y'], fr['w'], fr['h']
            rect_key = (x, y, w, h, round(sparkle, 2))
            if rect_key in modified_rects:
                continue
            modified_rects.add(rect_key)

            heart = create_solid_glossy_heart(w, h, sparkle_phase=sparkle)
            # Clear old pixels first
            blank = Image.new('RGBA', (w, h), (0, 0, 0, 0))
            atlas_img.paste(blank, (x, y))
            atlas_img.paste(heart, (x, y), heart)
            count += 1
            print(f'Replaced {name} ({w}x{h} at {x},{y}) with Ruby Heart (sparkle={sparkle:.2f})')

    # Save to atlas.png
    atlas_img.save(atlas_png_path, 'PNG')
    print(f'Saved modified atlas.png with {count} unique heart rects!')

    # Save to atlas.webp with high quality
    atlas_img.save(atlas_webp_path, 'WEBP', quality=95)
    print('Saved modified atlas.webp!')

if __name__ == '__main__':
    apply_hearts_to_atlas()
