import { pxAt, darken, lighten } from '../utils';

/** Atlas-based furniture drawing intentionally disabled for consistency. */
function drawFurnitureSprite(
  _ctx: CanvasRenderingContext2D,
  _key: string,
  _x: number, _y: number,
  _destW: number, _destH: number,
): boolean {
  return false;
}

export function drawDesk(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  // Desk with chair + monitor ≈ 22×36 virtual pixels → draw as composite
  if (drawFurnitureSprite(ctx, 'desk-computer', x - 3 * s, y + 14 * s, 22 * s, 22 * s)) {
    // Draw chair behind
    drawFurnitureSprite(ctx, 'chair-large', x + 3 * s, y + 10 * s, 10 * s, 12 * s);
    return;
  }
  ctx.imageSmoothingEnabled = false;
  const bx = x / s;
  const by = y / s;

  // ── Chair (behind desk) ──
  // Back rest - rounded top
  pxAt(ctx, bx, by, 5, 11, 6, 1, '#6b5545', s); // top highlight
  pxAt(ctx, bx, by, 4, 12, 8, 3, '#5a4535', s); // main back
  pxAt(ctx, bx, by, 5, 12, 6, 1, lighten('#5a4535', 0.12), s); // highlight arc
  pxAt(ctx, bx, by, 10, 12, 2, 3, darken('#5a4535', 0.15), s); // right shadow
  // Seat cushion
  pxAt(ctx, bx, by, 4, 15, 8, 2, '#5a4535', s);
  pxAt(ctx, bx, by, 4, 15, 8, 1, '#6b5545', s); // top highlight
  pxAt(ctx, bx, by, 10, 15, 2, 2, darken('#5a4535', 0.12), s); // right shadow
  // Chair legs
  pxAt(ctx, bx, by, 4, 17, 1, 3, '#3a3030', s);
  pxAt(ctx, bx, by, 11, 17, 1, 3, '#3a3030', s);
  pxAt(ctx, bx, by, 7, 17, 2, 4, '#3a3030', s); // center post
  pxAt(ctx, bx, by, 7, 17, 2, 1, '#4a4040', s); // post highlight
  // Wheels
  pxAt(ctx, bx, by, 5, 21, 2, 1, '#2a2020', s);
  pxAt(ctx, bx, by, 9, 21, 2, 1, '#2a2020', s);

  // ── Desk surface - wood plank style ──
  // Top edge highlight
  pxAt(ctx, bx, by, -3, 22, 22, 1, lighten('#8b6f47', 0.25), s);
  // Main surface with plank lines
  pxAt(ctx, bx, by, -3, 23, 22, 3, '#8b6f47', s);
  // Plank grain lines
  pxAt(ctx, bx, by, -3, 24, 22, 1, darken('#8b6f47', 0.06), s);
  pxAt(ctx, bx, by, -1, 23, 1, 3, darken('#8b6f47', 0.08), s); // plank divider
  pxAt(ctx, bx, by, 7, 23, 1, 3, darken('#8b6f47', 0.08), s);  // plank divider
  pxAt(ctx, bx, by, 14, 23, 1, 3, darken('#8b6f47', 0.08), s); // plank divider
  // Front face (darker)
  pxAt(ctx, bx, by, -3, 26, 22, 1, darken('#8b6f47', 0.18), s);
  pxAt(ctx, bx, by, -3, 27, 22, 5, '#6b5337', s);
  pxAt(ctx, bx, by, -3, 27, 22, 1, darken('#6b5337', 0.08), s); // top edge of front
  // Left side shadow on front face
  pxAt(ctx, bx, by, -3, 27, 1, 5, lighten('#6b5337', 0.06), s);
  pxAt(ctx, bx, by, 17, 27, 2, 5, darken('#6b5337', 0.1), s);
  // Drawer divider lines
  pxAt(ctx, bx, by, -3, 28, 22, 1, darken('#6b5337', 0.12), s);
  pxAt(ctx, bx, by, -3, 30, 22, 1, darken('#6b5337', 0.08), s);
  // Drawer handle (top drawer)
  pxAt(ctx, bx, by, 6, 29, 4, 1, lighten('#6b5337', 0.2), s);
  pxAt(ctx, bx, by, 6, 30, 1, 1, darken('#6b5337', 0.1), s); // handle shadow
  // Drawer handle (bottom drawer)
  pxAt(ctx, bx, by, 6, 31, 4, 1, lighten('#6b5337', 0.18), s);
  // Legs
  pxAt(ctx, bx, by, -2, 32, 2, 3, '#5a4530', s);
  pxAt(ctx, bx, by, -2, 32, 2, 1, lighten('#5a4530', 0.1), s);
  pxAt(ctx, bx, by, 16, 32, 2, 3, '#5a4530', s);
  pxAt(ctx, bx, by, 17, 32, 1, 3, darken('#5a4530', 0.1), s);
  // Shadow under desk
  pxAt(ctx, bx, by, -2, 35, 20, 1, 'rgba(0,0,0,0.08)', s);
  pxAt(ctx, bx, by, -1, 36, 18, 1, 'rgba(0,0,0,0.04)', s);

  // ── Monitor with screen glow ──
  // Bezel
  pxAt(ctx, bx, by, 2, 14, 12, 8, '#3a3a44', s);
  pxAt(ctx, bx, by, 2, 14, 12, 1, '#4a4a54', s); // top bezel highlight
  pxAt(ctx, bx, by, 13, 14, 1, 8, '#2a2a34', s); // right bezel shadow
  // Screen - blue desktop with glow
  pxAt(ctx, bx, by, 3, 15, 10, 6, '#1a3848', s);
  // Screen glow - lighter center
  pxAt(ctx, bx, by, 5, 16, 6, 4, '#1e3e50', s);
  pxAt(ctx, bx, by, 6, 17, 4, 2, '#224458', s);
  // Code lines on screen
  pxAt(ctx, bx, by, 4, 16, 5, 1, '#3a9a70', s);
  pxAt(ctx, bx, by, 4, 17, 3, 1, '#5a7ab0', s);
  pxAt(ctx, bx, by, 4, 18, 7, 1, '#3a8a90', s);
  pxAt(ctx, bx, by, 5, 19, 4, 1, '#c0a050', s);
  pxAt(ctx, bx, by, 4, 20, 3, 1, '#3a9a70', s);
  // Screen reflection
  pxAt(ctx, bx, by, 3, 15, 3, 1, 'rgba(255,255,255,0.1)', s);
  pxAt(ctx, bx, by, 3, 15, 1, 3, 'rgba(255,255,255,0.06)', s);
  // Monitor stand
  pxAt(ctx, bx, by, 6, 22, 4, 1, '#3a3a44', s);
  pxAt(ctx, bx, by, 7, 22, 2, 2, '#3a3a44', s);
  pxAt(ctx, bx, by, 7, 22, 1, 2, '#4a4a54', s); // stand highlight

  // ── Keyboard ──
  pxAt(ctx, bx, by, 2, 24, 8, 2, '#4a4a54', s);
  pxAt(ctx, bx, by, 2, 24, 8, 1, '#5a5a64', s); // top highlight
  // Key rows
  for (let kx = 0; kx < 6; kx++) {
    pxAt(ctx, bx, by, 3 + kx, 24, 1, 1, '#3a3a44', s);
  }
  for (let kx = 0; kx < 5; kx++) {
    pxAt(ctx, bx, by, 3 + kx, 25, 1, 1, '#3a3a44', s);
  }
}

export function drawStandingDesk(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  if (drawFurnitureSprite(ctx, 'desk-writing', x, y + 7 * s, 14 * s, 16 * s)) return;
  ctx.imageSmoothingEnabled = false;
  const bx = x / s;
  const by = y / s;

  // Desk surface with wood grain
  pxAt(ctx, bx, by, 0, 10, 14, 1, lighten('#8b6f47', 0.25), s); // highlight edge
  pxAt(ctx, bx, by, 0, 11, 14, 2, '#8b6f47', s);
  pxAt(ctx, bx, by, 0, 12, 14, 1, darken('#8b6f47', 0.06), s); // grain
  pxAt(ctx, bx, by, 5, 11, 1, 2, darken('#8b6f47', 0.08), s); // plank line
  pxAt(ctx, bx, by, 10, 11, 1, 2, darken('#8b6f47', 0.08), s);
  pxAt(ctx, bx, by, 0, 13, 14, 1, darken('#8b6f47', 0.18), s); // front edge
  // Metal legs
  pxAt(ctx, bx, by, 1, 14, 1, 8, '#5a5a64', s);
  pxAt(ctx, bx, by, 1, 14, 1, 1, '#6a6a74', s); // highlight
  pxAt(ctx, bx, by, 12, 14, 1, 8, '#4a4a54', s);
  // Shadow
  pxAt(ctx, bx, by, 0, 22, 14, 1, 'rgba(0,0,0,0.06)', s);

  // Laptop - screen
  pxAt(ctx, bx, by, 3, 7, 8, 3, '#3a3a44', s);
  pxAt(ctx, bx, by, 3, 7, 8, 1, '#4a4a54', s); // top bezel
  pxAt(ctx, bx, by, 4, 7, 6, 2, '#1a3848', s);
  // Code on screen
  pxAt(ctx, bx, by, 5, 8, 3, 1, '#3a9a70', s);
  pxAt(ctx, bx, by, 5, 7, 2, 1, '#5a7ab0', s);
  // Screen glow
  pxAt(ctx, bx, by, 6, 8, 2, 1, '#224458', s);
  // Keyboard base
  pxAt(ctx, bx, by, 3, 10, 8, 1, '#4a4a54', s);
  pxAt(ctx, bx, by, 3, 10, 8, 1, '#5a5a64', s);
}

export function drawBookshelf(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  // Deterministic 24x24 wall bookshelf (NES-style chunky silhouette)
  ctx.imageSmoothingEnabled = false;
  const bx = x / s;
  const by = y / s;
  const w = 24;
  const h = 24;

  pxAt(ctx, bx, by, 0, 0, w, h, '#5b4230', s);
  pxAt(ctx, bx, by, 0, 0, w, 1, '#73563f', s);
  pxAt(ctx, bx, by, 0, 0, 1, h, '#7d5f46', s);
  pxAt(ctx, bx, by, w - 1, 0, 1, h, '#463323', s);

  for (const yShelf of [6, 12, 18]) {
    pxAt(ctx, bx, by, 1, yShelf, w - 2, 1, '#7a5a41', s);
    pxAt(ctx, bx, by, 1, yShelf + 1, w - 2, 1, '#493626', s);
  }

  const bookCols = ['#b13f3d', '#3d66b1', '#3f8d52', '#bf9343', '#7b4bb5', '#2f8d95'];
  for (let row = 0; row < 4; row++) {
    const rowTop = 1 + row * 6;
    let cx = 2;
    for (let i = 0; i < 7; i++) {
      const bw = (i + row) % 3 === 0 ? 2 : 1;
      const bh = 4 + ((i + row) % 2);
      if (cx + bw > w - 2) break;
      const c = bookCols[(i + row * 2) % bookCols.length];
      pxAt(ctx, bx, by, cx, rowTop + (5 - bh), bw, bh, c, s);
      pxAt(ctx, bx, by, cx, rowTop + (5 - bh), 1, bh, lighten(c, 0.12), s);
      if (bw > 1) pxAt(ctx, bx, by, cx + bw - 1, rowTop + (5 - bh), 1, bh, darken(c, 0.12), s);
      cx += bw + 1;
    }
  }

  pxAt(ctx, bx, by, 1, h, w - 2, 1, 'rgba(0,0,0,0.12)', s);
}

export function drawPottedPlant(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  if (drawFurnitureSprite(ctx, 'plant-tall', x, y, 10 * s, 14 * s)) return;
  ctx.imageSmoothingEnabled = false;
  const bx = x / s;
  const by = y / s;

  // Pot - terracotta with highlight
  pxAt(ctx, bx, by, 2, 8, 6, 5, '#b06030', s);
  pxAt(ctx, bx, by, 2, 8, 2, 5, '#c07040', s); // left highlight
  pxAt(ctx, bx, by, 2, 8, 6, 1, '#c87848', s); // top rim highlight
  pxAt(ctx, bx, by, 7, 8, 1, 5, darken('#b06030', 0.15), s); // right shadow
  pxAt(ctx, bx, by, 2, 12, 6, 1, darken('#b06030', 0.12), s); // bottom shadow
  // Pot rim
  pxAt(ctx, bx, by, 1, 8, 8, 1, '#c07040', s);
  // Soil
  pxAt(ctx, bx, by, 3, 8, 4, 1, '#4a3020', s);

  // Stem
  pxAt(ctx, bx, by, 5, 3, 1, 5, '#2a5a30', s);

  // Leaf clusters with 3 shades
  const leafDark = '#2a6a3a';
  const leafMid = '#3a8050';
  const leafLight = '#4a9a60';

  // Main foliage mass
  pxAt(ctx, bx, by, 3, 2, 4, 3, leafMid, s);
  pxAt(ctx, bx, by, 2, 3, 6, 2, leafMid, s);
  pxAt(ctx, bx, by, 4, 1, 3, 1, leafMid, s);
  // Highlights (top-left light)
  pxAt(ctx, bx, by, 3, 2, 2, 1, leafLight, s);
  pxAt(ctx, bx, by, 2, 3, 1, 1, leafLight, s);
  pxAt(ctx, bx, by, 4, 1, 2, 1, leafLight, s);
  // Shadows (bottom-right)
  pxAt(ctx, bx, by, 7, 4, 1, 1, leafDark, s);
  pxAt(ctx, bx, by, 5, 5, 2, 1, leafDark, s);
  pxAt(ctx, bx, by, 6, 3, 1, 2, leafDark, s);
  // Extra leaf detail
  pxAt(ctx, bx, by, 1, 4, 1, 1, leafLight, s);
  pxAt(ctx, bx, by, 8, 3, 1, 1, leafDark, s);

  // Shadow under pot
  pxAt(ctx, bx, by, 2, 13, 6, 1, 'rgba(0,0,0,0.08)', s);
  pxAt(ctx, bx, by, 3, 14, 4, 1, 'rgba(0,0,0,0.04)', s);
}

export function drawClock(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, time: number) {
  // Deterministic 12x12 clock to avoid atlas crop variance
  ctx.imageSmoothingEnabled = false;
  const bx = x / s;
  const by = y / s;

  pxAt(ctx, bx, by, 1, 0, 10, 1, '#6f5b4c', s);
  pxAt(ctx, bx, by, 0, 1, 12, 10, '#5a4a3d', s);
  pxAt(ctx, bx, by, 1, 1, 10, 10, '#ece5d4', s);
  pxAt(ctx, bx, by, 2, 2, 8, 8, '#f5eedf', s);
  pxAt(ctx, bx, by, 10, 1, 1, 10, '#4a3c30', s);
  pxAt(ctx, bx, by, 1, 10, 10, 1, '#4a3c30', s);

  pxAt(ctx, bx, by, 5, 2, 2, 1, '#3a2e2a', s);
  pxAt(ctx, bx, by, 9, 5, 1, 2, '#3a2e2a', s);
  pxAt(ctx, bx, by, 5, 9, 2, 1, '#3a2e2a', s);
  pxAt(ctx, bx, by, 2, 5, 1, 2, '#3a2e2a', s);

  const t = time || 0;
  const hDir = Math.abs(Math.floor(((t * 0.05) % 12) / 3)) % 4;
  const mDir = Math.abs(Math.floor(((t * 0.8) % 60) / 15)) % 4;
  const hPos = [[6, 4], [7, 6], [6, 7], [4, 6]][hDir];
  const mPos = [[6, 3], [8, 6], [6, 8], [3, 6]][mDir];
  pxAt(ctx, bx, by, 6, 6, 1, 1, '#2a2020', s);
  pxAt(ctx, bx, by, hPos[0], hPos[1], 1, 1, '#2a2020', s);
  pxAt(ctx, bx, by, mPos[0], mPos[1], 1, 1, '#b74141', s);

  pxAt(ctx, bx, by, 1, 11, 10, 1, 'rgba(0,0,0,0.1)', s);
}

export function drawWaterCooler(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  ctx.imageSmoothingEnabled = false;
  const bx = x / s;
  const by = y / s;

  pxAt(ctx, bx, by, 3, 0, 8, 10, '#86b9d3', s);
  pxAt(ctx, bx, by, 3, 0, 2, 10, '#a5d5ea', s);
  pxAt(ctx, bx, by, 10, 0, 1, 10, '#699ab3', s);

  pxAt(ctx, bx, by, 2, 10, 10, 13, '#7f8795', s);
  pxAt(ctx, bx, by, 2, 10, 10, 1, '#9ca6b5', s);
  pxAt(ctx, bx, by, 2, 10, 1, 13, '#a5aebb', s);
  pxAt(ctx, bx, by, 11, 10, 1, 13, '#626a77', s);
  pxAt(ctx, bx, by, 3, 14, 8, 3, '#697180', s);
  pxAt(ctx, bx, by, 11, 14, 2, 1, '#5b626e', s);
  pxAt(ctx, bx, by, 12, 14, 1, 2, '#464d57', s);
  pxAt(ctx, bx, by, 4, 23, 2, 2, '#5f6774', s);
  pxAt(ctx, bx, by, 8, 23, 2, 2, '#5f6774', s);
}

export function drawVendingMachine(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  ctx.imageSmoothingEnabled = false;
  const bx = x / s;
  const by = y / s;

  pxAt(ctx, bx, by, 0, 0, 16, 26, '#4c4f64', s);
  pxAt(ctx, bx, by, 0, 0, 16, 1, '#666a83', s);
  pxAt(ctx, bx, by, 0, 0, 1, 26, '#70758d', s);
  pxAt(ctx, bx, by, 15, 0, 1, 26, '#36394a', s);
  pxAt(ctx, bx, by, -1, 24, 18, 3, '#323545', s);

  pxAt(ctx, bx, by, 2, 2, 10, 15, '#2a3b4b', s);
  pxAt(ctx, bx, by, 2, 2, 2, 4, 'rgba(255,255,255,0.1)', s);
  for (let r = 0; r < 4; r++) {
    pxAt(ctx, bx, by, 2, 5 + r * 3, 10, 1, 'rgba(140,150,170,0.35)', s);
    for (let c = 0; c < 4; c++) {
      const cols = ['#cf5550', '#e2b84d', '#5ca1d6', '#63b56d'];
      const col = cols[(r + c) % cols.length];
      pxAt(ctx, bx, by, 3 + c * 2, 3 + r * 3, 1, 2, col, s);
    }
  }

  pxAt(ctx, bx, by, 12, 4, 2, 8, '#2a2d3a', s);
  pxAt(ctx, bx, by, 12, 4, 2, 1, '#515669', s);
  pxAt(ctx, bx, by, 12, 13, 2, 1, '#53bf63', s);
  pxAt(ctx, bx, by, 2, 19, 10, 3, '#191c25', s);
}

export function drawCoffeeMachine(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  ctx.imageSmoothingEnabled = false;
  const bx = x / s;
  const by = y / s;

  pxAt(ctx, bx, by, 0, 0, 14, 12, '#2d2f3b', s);
  pxAt(ctx, bx, by, 0, 0, 14, 1, '#444757', s);
  pxAt(ctx, bx, by, 0, 0, 1, 12, '#4f5263', s);
  pxAt(ctx, bx, by, 13, 0, 1, 12, '#1d1f27', s);
  pxAt(ctx, bx, by, 2, 2, 10, 1, '#9fa5af', s);
  pxAt(ctx, bx, by, 2, 5, 10, 1, '#9fa5af', s);
  pxAt(ctx, bx, by, 5, 3, 3, 2, '#616776', s);
  pxAt(ctx, bx, by, 11, 1, 1, 1, '#4fd463', s);
  pxAt(ctx, bx, by, 3, 8, 8, 3, '#4a3122', s);
  pxAt(ctx, bx, by, 3, 8, 8, 1, '#654531', s);
  pxAt(ctx, bx, by, 5, -1, 1, 1, 'rgba(220,220,220,0.25)', s);
  pxAt(ctx, bx, by, 6, -2, 1, 1, 'rgba(210,210,210,0.15)', s);
}

export function drawCouch(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  ctx.imageSmoothingEnabled = false;
  const bx = x / s;
  const by = y / s;

  const c = '#3c4f73';
  const l = lighten(c, 0.12);
  const d = darken(c, 0.15);

  pxAt(ctx, bx, by, 2, 0, 28, 6, c, s);
  pxAt(ctx, bx, by, 3, 0, 26, 1, l, s);
  pxAt(ctx, bx, by, 2, 0, 1, 6, l, s);
  pxAt(ctx, bx, by, 29, 0, 1, 6, d, s);

  pxAt(ctx, bx, by, 2, 6, 28, 8, c, s);
  pxAt(ctx, bx, by, 2, 6, 28, 1, l, s);
  pxAt(ctx, bx, by, 16, 6, 1, 7, d, s);
  pxAt(ctx, bx, by, 2, 13, 28, 1, d, s);

  pxAt(ctx, bx, by, 0, 2, 3, 12, darken(c, 0.06), s);
  pxAt(ctx, bx, by, 0, 2, 3, 1, l, s);
  pxAt(ctx, bx, by, 29, 2, 3, 12, d, s);

  pxAt(ctx, bx, by, 3, 14, 3, 2, '#2a2020', s);
  pxAt(ctx, bx, by, 26, 14, 3, 2, '#2a2020', s);
  pxAt(ctx, bx, by, 3, 16, 26, 1, 'rgba(0,0,0,0.1)', s);
}

export function drawLandscapePainting(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  ctx.imageSmoothingEnabled = false;
  const bx = x / s;
  const by = y / s;

  pxAt(ctx, bx, by, 0, 0, 26, 14, '#6f4f36', s);
  pxAt(ctx, bx, by, 0, 0, 26, 1, '#846147', s);
  pxAt(ctx, bx, by, 0, 0, 1, 14, '#8c694d', s);
  pxAt(ctx, bx, by, 25, 0, 1, 14, '#573d29', s);
  pxAt(ctx, bx, by, 1, 1, 24, 12, '#5f88b8', s);
  pxAt(ctx, bx, by, 1, 1, 24, 2, '#7aa5d6', s);
  pxAt(ctx, bx, by, 18, 2, 3, 2, '#f1dc69', s);
  pxAt(ctx, bx, by, 4, 3, 5, 1, '#e2e7ee', s);
  pxAt(ctx, bx, by, 1, 7, 24, 5, '#4d8253', s);
  pxAt(ctx, bx, by, 1, 8, 24, 4, '#3f6e45', s);
  pxAt(ctx, bx, by, 8, 6, 7, 2, '#5f9a67', s);
  pxAt(ctx, bx, by, 1, 14, 24, 1, 'rgba(0,0,0,0.12)', s);
}

export function drawWhiteboard(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  ctx.imageSmoothingEnabled = false;
  const bx = x / s;
  const by = y / s;

  pxAt(ctx, bx, by, 0, 0, 30, 16, '#b7b7bf', s);
  pxAt(ctx, bx, by, 0, 0, 30, 1, '#c9c9d1', s);
  pxAt(ctx, bx, by, 0, 0, 1, 16, '#d0d0d8', s);
  pxAt(ctx, bx, by, 29, 0, 1, 16, '#9a9aa2', s);
  pxAt(ctx, bx, by, 1, 1, 28, 11, '#f2f2f0', s);
  pxAt(ctx, bx, by, 1, 1, 28, 1, '#fbfbf8', s);

  pxAt(ctx, bx, by, 3, 3, 11, 1, '#c44a4a', s);
  pxAt(ctx, bx, by, 4, 5, 14, 1, '#4476c4', s);
  pxAt(ctx, bx, by, 3, 7, 10, 1, '#4aa059', s);
  pxAt(ctx, bx, by, 18, 3, 8, 1, '#4476c4', s);
  pxAt(ctx, bx, by, 18, 7, 8, 1, '#4476c4', s);
  pxAt(ctx, bx, by, 18, 3, 1, 5, '#4476c4', s);
  pxAt(ctx, bx, by, 25, 3, 1, 5, '#4476c4', s);

  pxAt(ctx, bx, by, 2, 12, 26, 3, '#9b9ba3', s);
  pxAt(ctx, bx, by, 2, 12, 26, 1, '#afafb7', s);
  pxAt(ctx, bx, by, 4, 12, 3, 1, '#c44a4a', s);
  pxAt(ctx, bx, by, 9, 12, 3, 1, '#4476c4', s);
  pxAt(ctx, bx, by, 14, 12, 3, 1, '#4aa059', s);
}
