"""Render the Oatside case study loop as PNG frames.

Three scenes (Barista, Caffe Latte, Matcha). A dot-grid wipe in the next scene's
colour carries each scene into the next; products bounce in and float.
"""
import math
import os
import sys

from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
OUT_W, OUT_H = int(sys.argv[1]) if len(sys.argv) > 1 else 960, int(sys.argv[2]) if len(sys.argv) > 2 else 720
SS = 1.5                                   # supersample for smooth dots and type
W, H = int(OUT_W * SS), int(OUT_H * SS)
FPS = 25
SCENE = 2.0                                # seconds per product
WIPE = 0.55                                # seconds the dot wipe takes, at the end of a scene
SCENES = [
    {"img": "barista.png", "bg": (243, 210, 60), "word": (233, 193, 34), "ink": (24, 22, 20), "name": "Barista Blend", "h": 0.68},
    {"img": "latte.png", "bg": (59, 36, 24), "word": (72, 45, 31), "ink": (244, 232, 214), "name": "Oat Caffè Latte", "h": 0.60},
    {"img": "matcha.png", "bg": (244, 201, 207), "word": (236, 186, 194), "ink": (34, 70, 30), "name": "Matcha Oat Latte", "h": 0.60},
]
LOOP = SCENE * len(SCENES)
FRAMES = int(LOOP * FPS)

anton = ImageFont.truetype(os.path.join(HERE, "fonts", "Anton-Regular.ttf"), int(H * 0.86))
label = ImageFont.truetype(os.path.join(HERE, "fonts", "SpaceGrotesk.ttf"), int(H * 0.028))
try:
    label.set_variation_by_name("Medium")
except Exception:
    pass

products = []
for s in SCENES:
    im = Image.open(os.path.join(HERE, s["img"])).convert("RGBA")
    th = int(H * s["h"])
    products.append(im.resize((int(im.width * th / im.height), th), Image.LANCZOS))

WORD = "OATSIDE  "
word_w = int(anton.getlength(WORD))
word_y = int(H * 0.5 - anton.getbbox("OATSIDE")[3] * 0.56)


def clamp(v, a=0.0, b=1.0):
    return a if v < a else b if v > b else v


def ease(v):
    v = clamp(v)
    return v * v * (3 - 2 * v)


def back_out(v, s=1.15):
    v = clamp(v) - 1
    return v * v * ((s + 1) * v + s) + 1


def backdrop(i, t):
    """Scene background: flat colour plus the giant scrolling OATSIDE in a tone of it."""
    s = SCENES[i]
    img = Image.new("RGB", (W, H), s["bg"])
    d = ImageDraw.Draw(img)
    off = (t / LOOP) * word_w           # one full word per loop, so the scroll repeats seamlessly
    x = -off
    while x < W:
        d.text((x, word_y), WORD, font=anton, fill=s["word"])
        x += word_w
    return img


def place_product(img, i, local):
    """Bounce up from below, then float."""
    p = products[i]
    rise = back_out(local / 0.62)
    float_y = math.sin(local * 2.4) * H * 0.008
    angle = math.sin(local * 1.9 + i) * 1.6
    rotated = p.rotate(angle, resample=Image.BICUBIC, expand=True)
    x = (W - rotated.width) // 2
    y_rest = (H - rotated.height) // 2 - int(H * 0.01)
    y = int(y_rest + (1 - rise) * H * 0.95 + float_y)
    # soft contact shadow, fades in as the product lands
    sh = Image.new("L", (W, H), 0)
    sd = ImageDraw.Draw(sh)
    sw, shh = rotated.width * 0.62, H * 0.022
    cx, cy = W / 2, y_rest + rotated.height - H * 0.004
    sd.ellipse((cx - sw / 2, cy - shh / 2, cx + sw / 2, cy + shh / 2), fill=int(70 * ease(rise)))
    img.paste((0, 0, 0), (0, 0), sh)
    img.paste(rotated, (x, y), rotated)


def dot_mask(p, corner):
    """Dots grow from one corner across the frame; fully covered at p = 1."""
    m = Image.new("L", (W, H), 0)
    d = ImageDraw.Draw(m)
    g = H / 15
    ox, oy = [(0, H), (W, 0), (0, 0), (W, H)][corner % 4]
    maxd = math.hypot(W, H)
    rmax = g * 0.74
    y = g / 2
    while y < H + g:
        x = g / 2
        while x < W + g:
            dist = math.hypot(x - ox, y - oy) / maxd
            local = ease((p * 1.7 - dist * 0.7))
            r = rmax * local
            if r > 0.5:
                d.ellipse((x - r, y - r, x + r, y + r), fill=255)
            x += g
        y += g
    return m


def labels(img, i):
    s = SCENES[i]
    d = ImageDraw.Draw(img)
    pad = int(H * 0.045)
    d.text((pad, H - pad), "CASE STUDY · OATSIDE", font=label, fill=s["ink"], anchor="ls")
    d.text((W - pad, H - pad), s["name"].upper(), font=label, fill=s["ink"], anchor="rs")


os.makedirs(os.path.join(HERE, "frames"), exist_ok=True)
for f in range(FRAMES):
    t = f / FPS
    i = int(t // SCENE)
    local = t - i * SCENE
    frame = backdrop(i, t)
    place_product(frame, i, local)
    labels(frame, i)
    wipe_start = SCENE - WIPE
    if local >= wipe_start:
        nxt = (i + 1) % len(SCENES)
        p = (local - wipe_start) / WIPE
        nb = backdrop(nxt, t)
        labels(nb, nxt)
        frame.paste(nb, (0, 0), dot_mask(p, i))
    frame.resize((OUT_W, OUT_H), Image.LANCZOS).save(os.path.join(HERE, "frames", f"f{f:04d}.png"))
print("frames", FRAMES, "at", OUT_W, "x", OUT_H)
