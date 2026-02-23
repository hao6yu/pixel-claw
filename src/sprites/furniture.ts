import { pxAt, darken, lighten } from '../utils';
import { getSheets } from '../sprite-loader';
import { FURNITURE_ATLAS } from '../atlas';
import type { SpriteRect } from '../atlas';

/** Draw a furniture sprite from the sheet. Returns true if drawn. */
function drawFurnitureSprite(
  ctx: CanvasRenderingContext2D,
  key: string,
  x: number, y: number,
  destW: number, destH: number,
): boolean {
  const sheets = getSheets();
  if (!sheets) return false;
  const rect = FURNITURE_ATLAS[key];
  if (!rect) return false;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(sheets.furniture, rect.x, rect.y, rect.w, rect.h, Math.round(x), Math.round(y), Math.round(destW), Math.round(destH));
  return true;
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
  if (drawFurnitureSprite(ctx, 'bookshelf-large', x, y, 40 * s, 32 * s)) return;
  ctx.imageSmoothingEnabled = false;
  const bx = x / s;
  const by = y / s;
  const w = 20;
  const h = 18;

  // Main body
  pxAt(ctx, bx, by, 0, 0, w, h, '#5a4030', s);
  // Top highlight
  pxAt(ctx, bx, by, 0, 0, w, 1, '#6b4a35', s);
  // Left side highlight
  pxAt(ctx, bx, by, 0, 0, 1, h, '#6b4a35', s);
  // Right side shadow
  pxAt(ctx, bx, by, w - 1, 0, 1, h, '#4a3525', s);
  // Bottom shadow
  pxAt(ctx, bx, by, 0, h - 1, w, 1, darken('#5a4030', 0.15), s);

  const bookColors = ['#c04040', '#4060c0', '#40a060', '#c0a040', '#8040a0', '#c06030', '#3080a0', '#a04070', '#5080c0', '#c07050'];

  for (let sy = 0; sy < 3; sy++) {
    const shelfY = 1 + sy * 6;
    // Shelf board
    pxAt(ctx, bx, by, 1, shelfY + 5, w - 2, 1, '#7a5a40', s);
    // Shadow under shelf
    pxAt(ctx, bx, by, 1, shelfY, w - 2, 1, 'rgba(0,0,0,0.12)', s);

    // Books with varied widths and highlights
    let bkx = 2;
    const numBooks = 5 + ((sy * 3 + Math.floor(bx * 7)) % 3);
    for (let b = 0; b < numBooks; b++) {
      const bw = 1 + ((b + sy * 3 + Math.floor(bx)) % 2);
      const bh = 3 + ((b + sy) % 2);
      const bc = bookColors[(b + sy * 3 + Math.floor(bx * 7)) % bookColors.length];
      if (bkx + bw >= w - 2) break;

      // Book body
      pxAt(ctx, bx, by, bkx, shelfY + 5 - bh, bw, bh, bc, s);
      // Spine highlight (left edge)
      pxAt(ctx, bx, by, bkx, shelfY + 5 - bh, 1, bh, lighten(bc, 0.2), s);
      // Top edge highlight
      pxAt(ctx, bx, by, bkx, shelfY + 5 - bh, bw, 1, lighten(bc, 0.1), s);
      // Right edge shadow
      if (bw > 1) {
        pxAt(ctx, bx, by, bkx + bw - 1, shelfY + 5 - bh, 1, bh, darken(bc, 0.15), s);
      }
      // Title line detail
      if (bh >= 4) {
        pxAt(ctx, bx, by, bkx, shelfY + 5 - bh + 2, bw, 1, darken(bc, 0.1), s);
      }
      bkx += bw + 1;
    }
  }

  // Shadow below shelf
  pxAt(ctx, bx, by, 1, h, w - 2, 1, 'rgba(0,0,0,0.1)', s);
  pxAt(ctx, bx, by, 2, h + 1, w - 4, 1, 'rgba(0,0,0,0.05)', s);
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
  if (drawFurnitureSprite(ctx, 'clock', x, y, 16 * s, 16 * s)) return;
  ctx.imageSmoothingEnabled = false;
  const bx = x / s;
  const by = y / s;

  // Frame with highlight/shadow
  pxAt(ctx, bx, by, 1, 0, 6, 1, '#5a5050', s);
  pxAt(ctx, bx, by, 0, 1, 8, 6, '#e8e0d0', s);
  pxAt(ctx, bx, by, 1, 7, 6, 1, '#4a4040', s);
  pxAt(ctx, bx, by, 0, 1, 1, 6, '#5a5050', s); // left highlight
  pxAt(ctx, bx, by, 7, 1, 1, 6, '#4a4040', s); // right shadow
  // Inner face highlight
  pxAt(ctx, bx, by, 2, 2, 4, 4, '#f0e8d8', s);

  // Hour markers
  pxAt(ctx, bx, by, 4, 1, 1, 1, '#3a3030', s);
  pxAt(ctx, bx, by, 6, 4, 1, 1, '#3a3030', s);
  pxAt(ctx, bx, by, 4, 6, 1, 1, '#3a3030', s);
  pxAt(ctx, bx, by, 1, 4, 1, 1, '#3a3030', s);

  const t = time || 0;
  const h = (t * 0.05) % 12;
  const m = (t * 0.8) % 60;
  const handPositions = [[4, 2], [5, 4], [4, 5], [2, 4]];
  const mPositions = [[4, 1], [6, 4], [4, 6], [1, 4]];
  const hDir = Math.abs(Math.floor(h / 3)) % 4;
  const mDir = Math.abs(Math.floor(m / 15)) % 4;
  pxAt(ctx, bx, by, 4, 4, 1, 1, '#2a2020', s);
  pxAt(ctx, bx, by, handPositions[hDir][0], handPositions[hDir][1], 1, 1, '#2a2020', s);
  pxAt(ctx, bx, by, mPositions[mDir][0], mPositions[mDir][1], 1, 1, '#c04040', s);

  // Shadow below clock
  pxAt(ctx, bx, by, 1, 8, 6, 1, 'rgba(0,0,0,0.1)', s);
}

export function drawWaterCooler(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  if (drawFurnitureSprite(ctx, 'water-cooler-large', x, y, 18 * s, 30 * s)) return;
  ctx.imageSmoothingEnabled = false;
  const bx = x / s;
  const by = y / s;

  // Body
  pxAt(ctx, bx, by, 2, 10, 6, 6, '#8a8a90', s);
  pxAt(ctx, bx, by, 2, 10, 6, 1, '#9a9aa0', s); // top highlight
  pxAt(ctx, bx, by, 2, 10, 1, 6, '#9a9aa0', s); // left highlight
  pxAt(ctx, bx, by, 7, 10, 1, 6, darken('#8a8a90', 0.12), s); // right shadow
  // Legs
  pxAt(ctx, bx, by, 2, 16, 2, 2, '#7a7a80', s);
  pxAt(ctx, bx, by, 6, 16, 2, 2, '#7a7a80', s);
  // Water bottle with highlight
  pxAt(ctx, bx, by, 3, 1, 4, 9, '#a0d0e8', s);
  pxAt(ctx, bx, by, 3, 1, 1, 9, '#b8e4f8', s); // left highlight (light refraction)
  pxAt(ctx, bx, by, 6, 1, 1, 9, darken('#a0d0e8', 0.1), s); // right shadow
  pxAt(ctx, bx, by, 4, 0, 2, 1, '#90c0d8', s); // bottle top
  // Spigot
  pxAt(ctx, bx, by, 7, 12, 2, 1, '#7a7a80', s);
  pxAt(ctx, bx, by, 8, 12, 1, 2, '#5a5a60', s);
  // Shadow
  pxAt(ctx, bx, by, 2, 18, 6, 1, 'rgba(0,0,0,0.08)', s);
}

export function drawVendingMachine(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  if (drawFurnitureSprite(ctx, 'vending-machine', x, y, 10 * s, 18 * s)) return;
  ctx.imageSmoothingEnabled = false;
  const bx = x / s;
  const by = y / s;

  // Body with shading
  pxAt(ctx, bx, by, 0, 0, 10, 18, '#4a4a54', s);
  pxAt(ctx, bx, by, 0, 0, 10, 1, '#5a5a64', s); // top highlight
  pxAt(ctx, bx, by, 0, 0, 1, 18, '#5a5a64', s); // left highlight
  pxAt(ctx, bx, by, 9, 0, 1, 18, '#3a3a44', s); // right shadow
  // Base
  pxAt(ctx, bx, by, -1, 16, 12, 2, '#3a3a44', s);
  pxAt(ctx, bx, by, -1, 16, 12, 1, '#4a4a54', s); // base top highlight

  // Glass front with reflection
  pxAt(ctx, bx, by, 1, 2, 7, 10, '#2a3a4a', s);
  // Glass reflection diagonal
  pxAt(ctx, bx, by, 1, 2, 1, 3, 'rgba(255,255,255,0.08)', s);
  pxAt(ctx, bx, by, 2, 2, 1, 2, 'rgba(255,255,255,0.06)', s);
  pxAt(ctx, bx, by, 3, 2, 1, 1, 'rgba(255,255,255,0.04)', s);

  // Product rows
  const snackColors = ['#e04040', '#40a0e0', '#e0c040', '#40c060', '#e080c0', '#f0a030', '#60c0c0', '#c06040', '#8080e0'];
  for (let row = 0; row < 3; row++) {
    // Shelf divider
    pxAt(ctx, bx, by, 1, 2 + row * 3 + 2, 7, 1, 'rgba(100,100,120,0.4)', s);
    for (let col = 0; col < 3; col++) {
      const ci = (row * 3 + col) % snackColors.length;
      pxAt(ctx, bx, by, 2 + col * 2, 3 + row * 3, 1, 2, snackColors[ci], s);
      // Tiny highlight on each product
      pxAt(ctx, bx, by, 2 + col * 2, 3 + row * 3, 1, 1, lighten(snackColors[ci], 0.15), s);
    }
  }

  // Coin slot area
  pxAt(ctx, bx, by, 8, 5, 1, 3, '#2a2a34', s);
  pxAt(ctx, bx, by, 8, 5, 1, 1, '#6a6a74', s); // slot highlight
  // Button
  pxAt(ctx, bx, by, 8, 9, 1, 1, '#40c060', s);

  // Dispensing slot
  pxAt(ctx, bx, by, 1, 13, 7, 2, '#1a1a24', s);
  pxAt(ctx, bx, by, 1, 13, 7, 1, '#2a2a34', s); // slot top edge

  // Shadow
  pxAt(ctx, bx, by, 0, 18, 10, 1, 'rgba(0,0,0,0.1)', s);
  pxAt(ctx, bx, by, 1, 19, 8, 1, 'rgba(0,0,0,0.05)', s);
}

export function drawCoffeeMachine(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  if (drawFurnitureSprite(ctx, 'coffee-machine-large', x, y, 16 * s, 18 * s)) return;
  ctx.imageSmoothingEnabled = false;
  const bx = x / s;
  const by = y / s;

  // Body with shading
  pxAt(ctx, bx, by, 0, 0, 8, 10, '#2a2a34', s);
  pxAt(ctx, bx, by, 0, 0, 8, 1, '#3a3a44', s); // top highlight
  pxAt(ctx, bx, by, 0, 0, 1, 10, '#3a3a44', s); // left highlight
  pxAt(ctx, bx, by, 7, 0, 1, 10, '#1a1a24', s); // right shadow

  // Chrome accents with highlight
  pxAt(ctx, bx, by, 1, 2, 6, 1, '#9a9aa4', s);
  pxAt(ctx, bx, by, 1, 2, 3, 1, '#aaaab4', s); // chrome highlight left
  pxAt(ctx, bx, by, 1, 5, 6, 1, '#9a9aa4', s);
  pxAt(ctx, bx, by, 1, 5, 3, 1, '#aaaab4', s);

  // Nozzle area
  pxAt(ctx, bx, by, 3, 3, 2, 2, '#5a5a64', s);
  pxAt(ctx, bx, by, 3, 3, 1, 1, '#6a6a74', s); // nozzle highlight

  // Drip tray
  pxAt(ctx, bx, by, 1, 7, 6, 2, '#4a3020', s);
  pxAt(ctx, bx, by, 1, 7, 6, 1, '#5a4030', s); // tray highlight

  // Power light
  pxAt(ctx, bx, by, 6, 1, 1, 1, '#40e040', s);

  // Steam particles (animated via position variance)
  pxAt(ctx, bx, by, 3, -1, 1, 1, 'rgba(220,220,220,0.25)', s);
  pxAt(ctx, bx, by, 4, -2, 1, 1, 'rgba(200,200,200,0.18)', s);
  pxAt(ctx, bx, by, 5, -3, 1, 1, 'rgba(200,200,200,0.1)', s);

  // Shadow
  pxAt(ctx, bx, by, 0, 10, 8, 1, 'rgba(0,0,0,0.08)', s);
}

export function drawCouch(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  if (drawFurnitureSprite(ctx, 'couch', x, y, 40 * s, 24 * s)) return;
  ctx.imageSmoothingEnabled = false;
  const bx = x / s;
  const by = y / s;

  const couchColor = '#3a4a6a';
  const couchLight = lighten(couchColor, 0.12);
  const couchDark = darken(couchColor, 0.15);
  const couchShadow = darken(couchColor, 0.25);

  // Back rest
  pxAt(ctx, bx, by, 1, 0, 18, 4, couchColor, s);
  pxAt(ctx, bx, by, 2, 0, 16, 1, couchLight, s); // top highlight
  pxAt(ctx, bx, by, 1, 0, 1, 4, couchLight, s); // left highlight
  pxAt(ctx, bx, by, 18, 0, 1, 4, couchDark, s); // right shadow

  // Seat cushions
  pxAt(ctx, bx, by, 1, 4, 18, 4, couchColor, s);
  pxAt(ctx, bx, by, 1, 4, 18, 1, couchLight, s); // cushion top highlight

  // Cushion divider line
  pxAt(ctx, bx, by, 10, 4, 1, 3, couchDark, s);

  // Fabric texture dots
  pxAt(ctx, bx, by, 4, 5, 1, 1, couchLight, s);
  pxAt(ctx, bx, by, 7, 6, 1, 1, couchLight, s);
  pxAt(ctx, bx, by, 13, 5, 1, 1, couchLight, s);
  pxAt(ctx, bx, by, 16, 6, 1, 1, couchLight, s);

  // Stitching lines
  pxAt(ctx, bx, by, 2, 3, 16, 1, couchDark, s); // between back and seat
  pxAt(ctx, bx, by, 2, 7, 16, 1, couchDark, s); // seat front edge

  // Armrests with roundness
  pxAt(ctx, bx, by, 0, 1, 2, 7, darken(couchColor, 0.08), s);
  pxAt(ctx, bx, by, 0, 1, 2, 1, couchLight, s); // arm top highlight
  pxAt(ctx, bx, by, 0, 1, 1, 7, couchLight, s); // arm left highlight
  pxAt(ctx, bx, by, 18, 1, 2, 7, couchDark, s);
  pxAt(ctx, bx, by, 18, 1, 2, 1, couchColor, s); // right arm top

  // Legs
  pxAt(ctx, bx, by, 1, 8, 2, 2, '#2a2020', s);
  pxAt(ctx, bx, by, 1, 8, 1, 1, '#3a3030', s); // leg highlight
  pxAt(ctx, bx, by, 17, 8, 2, 2, '#2a2020', s);

  // Shadow
  pxAt(ctx, bx, by, 1, 10, 18, 1, 'rgba(0,0,0,0.1)', s);
  pxAt(ctx, bx, by, 2, 11, 16, 1, 'rgba(0,0,0,0.05)', s);
}

export function drawLandscapePainting(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  if (drawFurnitureSprite(ctx, 'painting-landscape', x, y, 30 * s, 18 * s)) return;
  ctx.imageSmoothingEnabled = false;
  const bx = x / s;
  const by = y / s;

  // Frame with highlight/shadow
  pxAt(ctx, bx, by, 0, 0, 16, 10, '#6a4a30', s);
  pxAt(ctx, bx, by, 0, 0, 16, 1, '#7a5a40', s); // top highlight
  pxAt(ctx, bx, by, 0, 0, 1, 10, '#7a5a40', s); // left highlight
  pxAt(ctx, bx, by, 15, 0, 1, 10, '#5a3a20', s); // right shadow
  pxAt(ctx, bx, by, 0, 9, 16, 1, '#5a3a20', s); // bottom shadow

  // Inner frame border
  pxAt(ctx, bx, by, 1, 1, 14, 1, '#5a3a20', s);
  pxAt(ctx, bx, by, 1, 8, 14, 1, '#4a2a18', s);
  pxAt(ctx, bx, by, 1, 1, 1, 8, '#5a3a20', s);
  pxAt(ctx, bx, by, 14, 1, 1, 8, '#4a2a18', s);

  // Sky gradient
  pxAt(ctx, bx, by, 2, 2, 12, 1, '#80b0e0', s);
  pxAt(ctx, bx, by, 2, 3, 12, 2, '#6090c0', s);
  // Sun
  pxAt(ctx, bx, by, 11, 2, 2, 2, '#f0e060', s);
  pxAt(ctx, bx, by, 11, 2, 1, 1, '#f8f0a0', s); // sun highlight
  // Clouds
  pxAt(ctx, bx, by, 4, 2, 3, 1, '#e0e8f0', s);
  pxAt(ctx, bx, by, 3, 3, 4, 1, '#d0d8e0', s);
  // Hills
  pxAt(ctx, bx, by, 2, 5, 12, 3, '#4a8050', s);
  pxAt(ctx, bx, by, 2, 5, 5, 1, '#3a7040', s);
  pxAt(ctx, bx, by, 7, 5, 4, 1, '#5a9a68', s); // hill highlight
  pxAt(ctx, bx, by, 10, 6, 4, 1, '#3a6a38', s); // hill shadow
  pxAt(ctx, bx, by, 2, 7, 12, 1, '#3a6a38', s);

  // Shadow below painting on wall
  pxAt(ctx, bx, by, 1, 10, 14, 1, 'rgba(0,0,0,0.12)', s);
  pxAt(ctx, bx, by, 2, 11, 12, 1, 'rgba(0,0,0,0.06)', s);
}

export function drawWhiteboard(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  if (drawFurnitureSprite(ctx, 'whiteboard', x, y, 32 * s, 20 * s)) return;
  ctx.imageSmoothingEnabled = false;
  const bx = x / s;
  const by = y / s;

  // Board frame with shading
  pxAt(ctx, bx, by, 0, 0, 16, 10, '#b0b0b8', s);
  pxAt(ctx, bx, by, 0, 0, 16, 1, '#c0c0c8', s); // top highlight
  pxAt(ctx, bx, by, 0, 0, 1, 10, '#c0c0c8', s); // left highlight
  pxAt(ctx, bx, by, 15, 0, 1, 10, '#9a9aa0', s); // right shadow

  // White surface
  pxAt(ctx, bx, by, 1, 1, 14, 7, '#f0f0f0', s);
  pxAt(ctx, bx, by, 1, 1, 14, 1, '#f8f8f8', s); // top surface highlight

  // Scribble lines (diagrams/text)
  pxAt(ctx, bx, by, 2, 2, 6, 1, '#d04040', s);
  pxAt(ctx, bx, by, 3, 4, 8, 1, '#3060c0', s);
  pxAt(ctx, bx, by, 2, 6, 5, 1, '#30a040', s);
  // Box diagram
  pxAt(ctx, bx, by, 10, 2, 3, 3, 'rgba(0,0,0,0)', s);
  pxAt(ctx, bx, by, 10, 2, 3, 1, '#3060c0', s);
  pxAt(ctx, bx, by, 10, 4, 3, 1, '#3060c0', s);
  pxAt(ctx, bx, by, 10, 2, 1, 3, '#3060c0', s);
  pxAt(ctx, bx, by, 12, 2, 1, 3, '#3060c0', s);

  // Marker tray
  pxAt(ctx, bx, by, 1, 8, 14, 2, '#9a9aa0', s);
  pxAt(ctx, bx, by, 1, 8, 14, 1, '#aaaab0', s); // tray highlight
  // Markers
  pxAt(ctx, bx, by, 3, 8, 2, 1, '#d04040', s);
  pxAt(ctx, bx, by, 6, 8, 2, 1, '#3060c0', s);
  pxAt(ctx, bx, by, 9, 8, 2, 1, '#30a040', s);

  // Shadow below whiteboard
  pxAt(ctx, bx, by, 1, 10, 14, 1, 'rgba(0,0,0,0.1)', s);
  pxAt(ctx, bx, by, 2, 11, 12, 1, 'rgba(0,0,0,0.05)', s);
}
