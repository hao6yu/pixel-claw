from PIL import Image, ImageOps, ImageEnhance

SRC = 'tmp_assets/kenney_roguelike/Spritesheet/roguelikeChar_transparent.png'
OUT_IDLE = 'public/chars-idle.png'
OUT_ACTION = 'public/chars-action.png'

CELL_W, CELL_H = 256, 512
SCALE = 11  # 16x16 -> 176x176, then centered in each 256x512 cell
STEP = 17
TILE = 16

# Coordinates picked from Kenney Roguelike Characters sheet.
BASE_COORDS = {
    'max': (0, 0),
    'chief': (1, 0),
    'cortana': (7, 0),
    'ghost': (8, 0),
}

TINTS = {
    'max': (1.12, 1.02, 0.95),      # warm protagonist tone
    'chief': (0.82, 0.95, 1.08),    # cool armored lead tone
    'cortana': (0.90, 1.04, 1.20),  # sleek cyan-tech vibe
    'ghost': (0.75, 0.80, 0.82),    # muted stealth vibe
}


def tint(img: Image.Image, factors):
    r, g, b, a = img.split()
    r = r.point(lambda v: max(0, min(255, int(v * factors[0]))))
    g = g.point(lambda v: max(0, min(255, int(v * factors[1]))))
    b = b.point(lambda v: max(0, min(255, int(v * factors[2]))))
    out = Image.merge('RGBA', (r, g, b, a))
    out = ImageEnhance.Contrast(out).enhance(1.08)
    return out


def tile(sheet: Image.Image, c: int, r: int) -> Image.Image:
    x, y = c * STEP, r * STEP
    return sheet.crop((x, y, x + TILE, y + TILE)).convert('RGBA')


def draw_state(base: Image.Image, state: str, char: str) -> Image.Image:
    s = base.copy()

    if state == 'typing':
        # Add subtle keyboard/laptop glow and forward-lean
        s = ImageOps.pad(s, (16, 16), centering=(0.5, 0.55), method=Image.NEAREST)
        px = s.load()
        for x in range(3, 13):
            px[x, 13] = (90, 170, 220, 220)
            if x in (4, 11):
                px[x, 12] = (180, 220, 255, 220)
    elif state == 'thinking':
        # Lift one eye/brow area + small thought spark
        px = s.load()
        px[11, 2] = (220, 230, 255, 255)
        px[12, 1] = (220, 230, 255, 255)
        px[13, 0] = (220, 230, 255, 220)
    elif state == 'walk1':
        s = ImageOps.pad(s, (16, 16), centering=(0.47, 0.5), method=Image.NEAREST)
        px = s.load()
        # front leg highlight
        for p in [(6, 14), (6, 15), (7, 15)]:
            px[p] = (45, 45, 55, 255)
    elif state == 'walk2':
        s = ImageOps.pad(s, (16, 16), centering=(0.53, 0.5), method=Image.NEAREST)
        px = s.load()
        for p in [(9, 14), (9, 15), (8, 15)]:
            px[p] = (45, 45, 55, 255)
    elif state == 'sleeping':
        s = ImageOps.pad(s, (16, 16), centering=(0.5, 0.58), method=Image.NEAREST)
        px = s.load()
        # close eyes + tiny Z glyph color keyed by character vibe
        eye = (35, 35, 45, 255)
        px[6, 6] = eye
        px[9, 6] = eye
        z = {
            'max': (240, 210, 120, 255),
            'chief': (140, 190, 255, 255),
            'cortana': (120, 255, 240, 255),
            'ghost': (180, 180, 190, 255),
        }[char]
        px[12, 1] = z
        px[13, 1] = z
        px[12, 2] = z
    return s


def place_cell(sheet: Image.Image, col: int, row: int, sprite16: Image.Image):
    enlarged = sprite16.resize((TILE * SCALE, TILE * SCALE), Image.NEAREST)
    x0 = col * CELL_W + (CELL_W - enlarged.width) // 2
    y0 = row * CELL_H + (CELL_H - enlarged.height) // 2 + 70
    sheet.alpha_composite(enlarged, (x0, y0))


src = Image.open(SRC).convert('RGBA')
idle_sheet = Image.new('RGBA', (CELL_W * 4, CELL_H * 3), (0, 0, 0, 0))
action_sheet = Image.new('RGBA', (CELL_W * 4, CELL_H * 3), (0, 0, 0, 0))

order = ['max', 'chief', 'cortana', 'ghost']
for col, name in enumerate(order):
    c, r = BASE_COORDS[name]
    base = tint(tile(src, c, r), TINTS[name])

    # Idle sheet rows: idle / typing / thinking
    place_cell(idle_sheet, col, 0, draw_state(base, 'idle', name))
    place_cell(idle_sheet, col, 1, draw_state(base, 'typing', name))
    place_cell(idle_sheet, col, 2, draw_state(base, 'thinking', name))

    # Action sheet rows: walk1 / walk2 / sleeping
    place_cell(action_sheet, col, 0, draw_state(base, 'walk1', name))
    place_cell(action_sheet, col, 1, draw_state(base, 'walk2', name))
    place_cell(action_sheet, col, 2, draw_state(base, 'sleeping', name))

idle_sheet.save(OUT_IDLE)
action_sheet.save(OUT_ACTION)
print('Generated', OUT_IDLE, 'and', OUT_ACTION)
