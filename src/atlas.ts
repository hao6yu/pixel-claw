export interface SpriteRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

// ── Character sheets use a uniform 256×512 grid (4 cols × 3 rows) ──
// Columns: 0=Max/main, 1=Chief/01-tech-lead, 2=Cortana/02-threat-hunter, 3=Ghost/03-lore-keeper

function charCell(col: number, row: number): SpriteRect {
  return { x: col * 256, y: row * 512, w: 256, h: 512 };
}

// chars-idle.png: row0=idle, row1=typing, row2=thinking
export const CHAR_IDLE_ATLAS: Record<string, SpriteRect> = {
  'max-idle': charCell(0, 0),
  'chief-idle': charCell(1, 0),
  'cortana-idle': charCell(2, 0),
  'ghost-idle': charCell(3, 0),
  'max-typing': charCell(0, 1),
  'chief-typing': charCell(1, 1),
  'cortana-typing': charCell(2, 1),
  'ghost-typing': charCell(3, 1),
  'max-thinking': charCell(0, 2),
  'chief-thinking': charCell(1, 2),
  'cortana-thinking': charCell(2, 2),
  'ghost-thinking': charCell(3, 2),
};

// chars-action.png: row0=walk1, row1=walk2, row2=sleeping
export const CHAR_ACTION_ATLAS: Record<string, SpriteRect> = {
  'max-walk1': charCell(0, 0),
  'chief-walk1': charCell(1, 0),
  'cortana-walk1': charCell(2, 0),
  'ghost-walk1': charCell(3, 0),
  'max-walk2': charCell(0, 1),
  'chief-walk2': charCell(1, 1),
  'cortana-walk2': charCell(2, 1),
  'ghost-walk2': charCell(3, 1),
  'max-sleeping': charCell(0, 2),
  'chief-sleeping': charCell(1, 2),
  'cortana-sleeping': charCell(2, 2),
  'ghost-sleeping': charCell(3, 2),
};

// furniture.png
export const FURNITURE_ATLAS: Record<string, SpriteRect> = {
  // Row 1: Floor tiles
  'floor-wood-light': { x: 18, y: 18, w: 152, h: 138 },
  'floor-carpet': { x: 186, y: 18, w: 152, h: 138 },
  'floor-tile-beige': { x: 354, y: 18, w: 152, h: 138 },
  'floor-brick': { x: 522, y: 18, w: 152, h: 138 },
  'floor-wood-dark': { x: 690, y: 18, w: 152, h: 138 },
  'floor-wood-brown': { x: 858, y: 18, w: 152, h: 138 },

  // Row 2: Walls
  'wall-baseboard': { x: 18, y: 172, w: 152, h: 152 },
  'wall-tan-baseboard': { x: 186, y: 172, w: 152, h: 152 },
  'wall-trim': { x: 354, y: 172, w: 152, h: 152 },
  'wall-door-brown': { x: 522, y: 172, w: 152, h: 152 },
  'wall-doorway': { x: 690, y: 172, w: 152, h: 152 },
  'wall-framed-door': { x: 858, y: 172, w: 152, h: 152 },

  // Row 3: Desks & Chairs
  'desk-computer': { x: 18, y: 345, w: 175, h: 130 },
  'desk-writing': { x: 200, y: 345, w: 165, h: 130 },
  'table-side': { x: 380, y: 360, w: 110, h: 115 },
  'chair-large': { x: 530, y: 340, w: 130, h: 140 },
  'chair-small': { x: 700, y: 350, w: 110, h: 125 },
  'chair-variant': { x: 850, y: 350, w: 110, h: 125 },

  // Row 4: Bookshelves, Plants, Decor
  'bookshelf-large': { x: 18, y: 500, w: 170, h: 145 },
  'bookshelf-medium': { x: 200, y: 500, w: 155, h: 145 },
  'plant-tall': { x: 390, y: 500, w: 105, h: 130 },
  'plant-wide': { x: 525, y: 505, w: 110, h: 125 },
  'clock': { x: 680, y: 505, w: 120, h: 120 },
  'painting-landscape': { x: 840, y: 510, w: 130, h: 110 },

  // Row 5: Vending, Couch, Whiteboard
  'vending-machine': { x: 15, y: 660, w: 155, h: 175 },
  'coffee-machine-large': { x: 185, y: 660, w: 160, h: 170 },
  'water-cooler-large': { x: 375, y: 660, w: 115, h: 170 },
  'couch': { x: 510, y: 685, w: 195, h: 140 },
  'armchair': { x: 720, y: 695, w: 100, h: 125 },
  'whiteboard': { x: 840, y: 670, w: 150, h: 155 },

  // Row 6
  'vending-small': { x: 15, y: 855, w: 145, h: 155 },
  'coffee-machine': { x: 185, y: 860, w: 120, h: 145 },
  'water-cooler': { x: 365, y: 855, w: 110, h: 155 },
  'table-round': { x: 520, y: 880, w: 130, h: 120 },
  'armchair-side': { x: 700, y: 885, w: 110, h: 115 },
  'fridge': { x: 845, y: 855, w: 120, h: 155 },

  // Row 7: Server, Boxes, Small items
  'server-rack': { x: 15, y: 1030, w: 148, h: 135 },
  'box-open': { x: 195, y: 1050, w: 120, h: 110 },
  'trash-can': { x: 370, y: 1045, w: 95, h: 115 },
  'rubber-duck': { x: 520, y: 1060, w: 100, h: 95 },
  'coffee-mug': { x: 680, y: 1055, w: 85, h: 95 },
  'papers': { x: 835, y: 1050, w: 110, h: 100 },

  // Row 8
  'box-small': { x: 25, y: 1205, w: 105, h: 95 },
  'box-sealed': { x: 180, y: 1210, w: 120, h: 85 },
  'typewriter': { x: 355, y: 1200, w: 115, h: 95 },
  'keyboard-wide': { x: 515, y: 1220, w: 145, h: 70 },
  'keyboard-small': { x: 700, y: 1225, w: 120, h: 65 },
  'mouse': { x: 865, y: 1225, w: 75, h: 70 },
};

// ui-effects.png
export const UI_ATLAS: Record<string, SpriteRect> = {
  'thought-bubble': { x: 68, y: 168, w: 370, h: 330 },
  'speech-bubble': { x: 490, y: 190, w: 440, h: 280 },
  'icon-sleep': { x: 62, y: 590, w: 112, h: 110 },
  'icon-exclamation': { x: 222, y: 585, w: 55, h: 115 },
  'icon-globe': { x: 322, y: 590, w: 96, h: 96 },
  'icon-book': { x: 458, y: 585, w: 90, h: 110 },
  'icon-terminal': { x: 590, y: 590, w: 96, h: 96 },
  'icon-chat': { x: 728, y: 598, w: 96, h: 82 },
  'golden-frame': { x: 52, y: 790, w: 430, h: 430 },
  'progress-bar': { x: 555, y: 830, w: 365, h: 40 },
  'icon-money': { x: 545, y: 960, w: 100, h: 95 },
  'icon-globe-small': { x: 660, y: 965, w: 85, h: 85 },
  'icon-terminal-small': { x: 762, y: 968, w: 82, h: 82 },
  'icon-gear': { x: 862, y: 960, w: 95, h: 95 },
};

// ── Character sprite key helpers ──

const CHAR_NAMES = ['max', 'chief', 'cortana', 'ghost'];

/** Map an agentId to character index (0-3) */
export function getCharIndex(agentId: string): number {
  const id = agentId.toLowerCase();
  if (id.includes('main') || id === 'default') return 0;
  if (id.includes('tech-lead') || id.includes('chief') || id.includes('01-')) return 1;
  if (id.includes('threat') || id.includes('cortana') || id.includes('02-')) return 2;
  if (id.includes('lore') || id.includes('ghost') || id.includes('03-')) return 3;
  // Hash fallback for unknown agents
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(h) % 4;
}

export function getCharName(agentId: string): string {
  return CHAR_NAMES[getCharIndex(agentId)];
}
