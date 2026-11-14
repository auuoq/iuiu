import json
import math
from PIL import Image, ImageDraw, ImageFilter

def create_gf_miner():
    # Load original full photos
    img_puffed = Image.open('C:/Users/admin/.gemini/antigravity/brain/9ee3f123-3167-4b70-ae65-7aded1ddd3bc/.user_uploaded/media_1794655902365_55af3ba3.jpg')
    img_wink = Image.open('C:/Users/admin/.gemini/antigravity/brain/9ee3f123-3167-4b70-ae65-7aded1ddd3bc/.user_uploaded/media_1794655914931_b4c11c8d.jpg')

    # Cut exact heads
    def cut_head(img, cx, cy, rx, ry, feather=4):
        W, H = img.size
        mask = Image.new('L', (W, H), 0)
        draw = ImageDraw.Draw(mask)
        draw.ellipse([cx - rx, cy - ry, cx + rx, cy + ry], fill=255)
        mask = mask.filter(ImageFilter.GaussianBlur(radius=feather))
        
        out = Image.new('RGBA', (W, H), (0, 0, 0, 0))
        out.paste(img, (0, 0), mask)
        bbox = (max(0, int(cx - rx)), max(0, int(cy - ry)),
                min(W, int(cx + rx)), min(H, int(cy + ry)))
        return out.crop(bbox)

    head_puffed_orig = cut_head(img_puffed, 295, 540, 240, 290)
    head_wink_orig = cut_head(img_wink, 270, 350, 230, 270)

    # Load atlas
    atlas_json_path = 'client/public/daovang/assets/atlas.json'
    atlas_png_path = 'client/public/daovang/assets/atlas.png'
    atlas_webp_path = 'client/public/daovang/assets/atlas.webp'

    # Current atlas (already has ruby hearts for gold!)
    atlas_img = Image.open(atlas_png_path).convert('RGBA')
    orig_atlas = Image.open('client/public/daovang/assets/atlas_original.png').convert('RGBA')

    with open(atlas_json_path, 'r', encoding='utf-8') as f:
        d = json.load(f)
    frames = d['frames']
    if isinstance(frames, dict):
        frames = [{'filename': k, **v} for k, v in frames.items()]

    # 1. Update menuMiner.png (Main menu)
    f_menu = next(f for f in frames if f['filename'] == 'menuMiner.png')
    fr_menu = f_menu['frame']
    mx, my, mw, mh = fr_menu['x'], fr_menu['y'], fr_menu['w'], fr_menu['h']
    
    # Get original menuMiner
    menu_crop = orig_atlas.crop((mx, my, mx + mw, my + mh))
    
    # Clear old beard and hair, keep pointing hand and body
    for y in range(mh):
        for x in range(mw):
            r, g, b, a = menu_crop.getpixel((x, y))
            if a > 0:
                is_gray = (abs(r - g) < 18 and abs(g - b) < 18 and r > 70)
                is_old_face = (x > 85 and y < 270 and r > 160)
                is_old_beard_tip = (x > 80 and x < 260 and y >= 250 and y < 330 and abs(r - g) < 25 and abs(g - b) < 25)
                if is_gray or is_old_face or is_old_beard_tip:
                    menu_crop.putpixel((x, y), (0, 0, 0, 0))

    # Collar fill
    draw_menu = ImageDraw.Draw(menu_crop)
    draw_menu.polygon([(130, 240), (245, 240), (250, 310), (130, 310)], fill=(155, 90, 30, 255))
    
    hw_menu = head_wink_orig.resize((265, 305), Image.Resampling.LANCZOS)
    menu_crop.alpha_composite(hw_menu, (72, 25))

    # Paste into atlas
    blank_menu = Image.new('RGBA', (mw, mh), (0, 0, 0, 0))
    atlas_img.paste(blank_menu, (mx, my))
    atlas_img.paste(menu_crop, (mx, my), menu_crop)
    print("Replaced menuMiner.png in atlas!")

    # Helper for in-game miner frames
    # Head sizes: width: 33, height: 37
    hw_small = head_wink_orig.resize((33, 37), Image.Resampling.LANCZOS)
    hp_small = head_puffed_orig.resize((33, 37), Image.Resampling.LANCZOS)

    def process_miner_frame(frame_name, head_img, head_ox=11, head_oy=-3):
        f_meta = next((f for f in frames if f['filename'] == frame_name), None)
        if not f_meta: return
        fr = f_meta['frame']
        fx, fy, fw, fh = fr['x'], fr['y'], fr['w'], fr['h']
        
        # Take from pristine orig_atlas
        m_crop = orig_atlas.crop((fx, fy, fx + fw, fy + fh))
        
        # Clear old miner head region: x: 8..46, y: 0..30
        for py in range(min(32, fh)):
            for px in range(fw):
                if 5 <= px <= 46:
                    r, g, b, a = m_crop.getpixel((px, py))
                    # Clear gray hair/beard or old man skin
                    if a > 0:
                        is_gray = (abs(r - g) < 20 and abs(g - b) < 20 and r > 70)
                        is_skin = (r > 160 and g > 110 and b > 70)
                        if is_gray or is_skin or py < 20:
                            m_crop.putpixel((px, py), (0, 0, 0, 0))

        # Composite new head
        m_crop.alpha_composite(head_img, (head_ox, head_oy))

        # Paste back into atlas
        blank = Image.new('RGBA', (fw, fh), (0, 0, 0, 0))
        atlas_img.paste(blank, (fx, fy))
        atlas_img.paste(m_crop, (fx, fy), m_crop)
        print(f"Replaced {frame_name} ({fw}x{fh})")

    # 2. minerDown0001..4 (Idle / swinging -> Winking head)
    for i in range(1, 5):
        process_miner_frame(f'minerDown000{i}.png', hw_small, head_ox=11, head_oy=-2)

    # 3. minerUp0001..17 (Cranking winch -> Puffed cheeks head bobbing!)
    bob_offsets = [0, 1, 2, 2, 1, 0, -1, -2, -2, -1, 0, 1, 2, 2, 1, 0, -1]
    for i in range(1, 18):
        name = f'minerUp000{i}.png' if i < 10 else f'minerUp00{i}.png'
        oy = -2 + bob_offsets[(i - 1) % len(bob_offsets)]
        process_miner_frame(name, hp_small, head_ox=11, head_oy=oy)

    # 4. minerStr0001..2 (Straining -> Puffed cheeks)
    process_miner_frame('minerStr0001.png', hp_small, head_ox=11, head_oy=-1)
    process_miner_frame('minerStr0002.png', hp_small, head_ox=11, head_oy=-2)

    # 5. minerD1..5 (Dynamite -> Winking head)
    for i in range(1, 6):
        process_miner_frame(f'minerD{i}.png', hw_small, head_ox=14, head_oy=2)

    # Save to atlas.png and atlas.webp
    atlas_img.save(atlas_png_path, 'PNG')
    print("Saved modified atlas.png with GF character!")

    atlas_img.save(atlas_webp_path, 'WEBP', quality=95)
    print("Saved modified atlas.webp with GF character!")

if __name__ == '__main__':
    create_gf_miner()
