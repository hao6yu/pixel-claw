from PIL import Image, ImageDraw

SCALE = 8
CELL_W, CELL_H = 256, 512  # 32x64 logical
LOG_W, LOG_H = 32, 64

# NES-like restrained palette
COL = {
    'outline': '#1a1c2c',
    'shadow': '#2d335b',
    'skin': '#f0c8a0',
    'skin2': '#d8a078',
    'white': '#f4f4f4',
    'max_shirt': '#3a5fbf',
    'max_dark': '#24367a',
    'chief_armor': '#5b8f3b',
    'chief_dark': '#355426',
    'visor': '#f2d15c',
    'cortana_main': '#5ec8ff',
    'cortana_dark': '#2f6f9a',
    'ghost_main': '#c8c4d8',
    'ghost_dark': '#7d7892',
    'pants': '#2f355f',
    'boots': '#3a2b1f',
    'glow': '#9de7ff',
    'purple': '#7c4fb8',
}

CHARS = ['max', 'chief', 'cortana', 'ghost']


def R(d, x, y, w, h, c):
    d.rectangle((x*SCALE, y*SCALE, (x+w)*SCALE-1, (y+h)*SCALE-1), fill=c)


def draw_outline(d, cx, top, w=14, h=18):
    R(d, cx-w//2-1, top-1, w+2, h+2, COL['outline'])


def draw_head(d, cx, top):
    draw_outline(d, cx, top, 12, 11)
    R(d, cx-6, top, 12, 11, COL['skin'])
    R(d, cx+3, top+2, 3, 8, COL['skin2'])


def draw_body(d, cx, y, w, h, c1, c2):
    draw_outline(d, cx, y, w, h)
    R(d, cx-w//2, y, w, h, c1)
    R(d, cx+max(1,w//6), y+1, max(2,w//3), h-1, c2)


def draw_limbs(d, cx, y, walk=0):
    # arms
    R(d, cx-10, y+2, 3, 11, COL['outline'])
    R(d, cx+7, y+2, 3, 11, COL['outline'])
    R(d, cx-9, y+2, 2, 10, COL['skin2'])
    R(d, cx+7, y+2, 2, 10, COL['skin'])
    # legs
    lx = -4 if walk == 1 else -3
    rx = 2 if walk == 1 else 3
    if walk == 2:
        lx, rx = -2, 1
    R(d, cx+lx-1, y+13, 4, 14, COL['outline'])
    R(d, cx+rx-1, y+13, 4, 14, COL['outline'])
    R(d, cx+lx, y+13, 3, 12, COL['pants'])
    R(d, cx+rx, y+13, 3, 12, COL['pants'])
    R(d, cx+lx-1, y+25, 5, 3, COL['boots'])
    R(d, cx+rx-1, y+25, 5, 3, COL['boots'])


def face(d, cx, y, mode='idle'):
    if mode == 'sleep':
        R(d, cx-4, y+4, 3, 1, COL['outline']); R(d, cx+2, y+4, 3, 1, COL['outline'])
    elif mode == 'think':
        R(d, cx-4, y+3, 2, 2, COL['outline']); R(d, cx+2, y+2, 2, 2, COL['outline'])
    else:
        R(d, cx-4, y+3, 2, 2, COL['outline']); R(d, cx+2, y+3, 2, 2, COL['outline'])
        R(d, cx-3, y+3, 1, 1, COL['white']); R(d, cx+3, y+3, 1, 1, COL['white'])
    if mode == 'typing':
        R(d, cx-1, y+7, 2, 1, COL['outline'])
    else:
        R(d, cx-1, y+7, 2, 1, COL['skin2'])


def character(cell, char, state):
    d = ImageDraw.Draw(cell)
    cx = 16
    top = 10
    torso_y = 22

    walk = 0
    if state == 'walk1': walk = 1
    if state == 'walk2': walk = 2

    # subtle pose adjustments
    if state == 'thinking':
        cx += 1
    if state == 'sleeping':
        # desk sleep pose
        draw_body(d, 16, 35, 20, 8, COL['shadow'], COL['outline'])
        draw_head(d, 11, 29)
        face(d, 11, 29, 'sleep')
        R(d, 0, 43, 32, 3, COL['outline'])
        return

    if char == 'max':
        # Max v2: cleaner hero sprite, less blocky face, stronger hoodie silhouette
        draw_head(d, cx, top)
        face(d, cx, top, 'typing' if state=='typing' else ('think' if state=='thinking' else 'idle'))
        # Hairline + brows for expression
        R(d, cx-5, top-1, 10, 2, '#6f3f20')
        R(d, cx-4, top+2, 2, 1, '#4a2d16')
        R(d, cx+2, top+2, 2, 1, '#4a2d16')
        # Hoodie body with zipper + pocket
        draw_body(d, cx, torso_y, 14, 17, '#2e6fc8', '#1d4b8f')
        R(d, cx-7, torso_y-1, 14, 3, '#1d4b8f')
        R(d, cx, torso_y+1, 1, 12, '#9ac7ff')
        R(d, cx-4, torso_y+10, 8, 3, '#255aa8')
        # Headset/mic accent
        R(d, cx+6, top+4, 2, 1, COL['outline'])
        R(d, cx+8, top+4, 1, 1, COL['glow'])
    elif char == 'chief':
        # Chief v2: stronger helmet silhouette and armored chest read
        draw_head(d, cx, top+1)
        # Full helmet shell
        R(d, cx-8, top-3, 16, 6, '#345b28')
        R(d, cx-8, top-3, 16, 2, COL['outline'])
        R(d, cx-7, top-1, 14, 1, '#4f8a39')
        # Gold visor strip
        R(d, cx-5, top+4, 10, 3, COL['visor'])
        R(d, cx-3, top+5, 6, 1, '#fff2b5')
        # Neck guard
        R(d, cx-4, top+8, 8, 2, '#243f1b')
        # Armor torso + chest plate + belt
        draw_body(d, cx, torso_y, 16, 19, '#5a9342', '#355426')
        R(d, cx-5, torso_y+3, 10, 4, '#6ca84d')
        R(d, cx-6, torso_y+8, 12, 2, '#2b4a20')
        R(d, cx-6, torso_y+13, 12, 2, '#253d1d')
        # Shoulder plates
        R(d, cx-11, torso_y+1, 4, 5, '#355426')
        R(d, cx+7, torso_y+1, 4, 5, '#355426')
    elif char == 'cortana':
        draw_head(d, cx, top)
        face(d, cx, top, 'typing' if state=='typing' else ('think' if state=='thinking' else 'idle'))
        # hair + sleek suit
        R(d, cx-7, top-1, 3, 12, COL['cortana_dark'])
        R(d, cx+4, top-1, 3, 12, COL['cortana_dark'])
        draw_body(d, cx, torso_y, 12, 18, COL['cortana_main'], COL['cortana_dark'])
        R(d, cx-5, torso_y+14, 10, 1, COL['glow'])
    else:  # ghost
        draw_head(d, cx, top+1)
        face(d, cx, top+1, 'typing' if state=='typing' else ('think' if state=='thinking' else 'idle'))
        # hood + cloak
        R(d, cx-8, top-1, 16, 6, COL['ghost_dark'])
        R(d, cx-9, top+3, 18, 3, COL['outline'])
        draw_body(d, cx, torso_y, 15, 18, COL['ghost_main'], COL['ghost_dark'])
        R(d, cx-9, torso_y+16, 18, 2, COL['purple'])

    draw_limbs(d, cx, torso_y, walk=walk)

    if state == 'typing':
        R(d, cx-11, torso_y+8, 4, 2, COL['outline'])
        R(d, cx+7, torso_y+8, 4, 2, COL['outline'])
    if state == 'thinking':
        R(d, cx+7, top-4, 2, 2, COL['white'])
        R(d, cx+10, top-7, 3, 3, COL['white'])


def build_sheet(rows):
    img = Image.new('RGBA', (CELL_W*4, CELL_H*3), (0, 0, 0, 0))
    for c, ch in enumerate(CHARS):
        for r, st in enumerate(rows):
            cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
            character(cell, ch, st)
            img.alpha_composite(cell, (c*CELL_W, r*CELL_H))
    return img


if __name__ == '__main__':
    idle = build_sheet(['idle', 'typing', 'thinking'])
    action = build_sheet(['walk1', 'walk2', 'sleeping'])
    idle.save('public/chars-idle.png')
    action.save('public/chars-action.png')
    print('wrote sprite sheets')
