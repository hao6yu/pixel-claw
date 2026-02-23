import { pxAt, darken, lighten } from '../utils';

export function drawDesk(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  ctx.imageSmoothingEnabled = false;
  const bx = x / s;
  const by = y / s;

  // Chair
  pxAt(ctx, bx, by, 4, 15, 8, 2, '#5a4535', s);
  pxAt(ctx, bx, by, 4, 15, 8, 1, '#6b5545', s);
  pxAt(ctx, bx, by, 4, 11, 8, 4, '#5a4535', s);
  pxAt(ctx, bx, by, 5, 11, 6, 1, '#6b5545', s);
  pxAt(ctx, bx, by, 4, 17, 1, 3, '#3a3030', s);
  pxAt(ctx, bx, by, 11, 17, 1, 3, '#3a3030', s);
  pxAt(ctx, bx, by, 7, 17, 2, 4, '#3a3030', s);
  pxAt(ctx, bx, by, 5, 21, 2, 1, '#2a2020', s);
  pxAt(ctx, bx, by, 9, 21, 2, 1, '#2a2020', s);

  // Desk surface
  pxAt(ctx, bx, by, -3, 22, 22, 1, lighten('#8b6f47', 0.2), s);
  pxAt(ctx, bx, by, -3, 23, 22, 3, '#8b6f47', s);
  pxAt(ctx, bx, by, -3, 26, 22, 1, darken('#8b6f47', 0.15), s);
  pxAt(ctx, bx, by, -3, 27, 22, 5, '#6b5337', s);
  pxAt(ctx, bx, by, -3, 27, 22, 1, darken('#6b5337', 0.1), s);
  pxAt(ctx, bx, by, -2, 32, 2, 3, '#5a4530', s);
  pxAt(ctx, bx, by, 16, 32, 2, 3, '#5a4530', s);

  // Monitor
  pxAt(ctx, bx, by, 2, 14, 12, 8, '#3a3a44', s);
  pxAt(ctx, bx, by, 3, 15, 10, 6, '#1a3848', s);
  pxAt(ctx, bx, by, 4, 16, 5, 1, '#2a6050', s);
  pxAt(ctx, bx, by, 4, 18, 7, 1, '#2a5060', s);
  pxAt(ctx, bx, by, 4, 20, 4, 1, '#2a6050', s);
  pxAt(ctx, bx, by, 3, 15, 3, 1, 'rgba(255,255,255,0.08)', s);
  pxAt(ctx, bx, by, 6, 22, 4, 1, '#3a3a44', s);
  pxAt(ctx, bx, by, 7, 22, 2, 2, '#3a3a44', s);

  // Keyboard
  pxAt(ctx, bx, by, 2, 24, 8, 2, '#4a4a54', s);
  pxAt(ctx, bx, by, 2, 24, 8, 1, '#5a5a64', s);
  for (let kx = 0; kx < 6; kx++) {
    pxAt(ctx, bx, by, 3 + kx, 24, 1, 1, '#3a3a44', s);
  }
}

export function drawStandingDesk(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  ctx.imageSmoothingEnabled = false;
  const bx = x / s;
  const by = y / s;

  // Desk surface (narrower)
  pxAt(ctx, bx, by, 0, 10, 14, 1, lighten('#8b6f47', 0.2), s);
  pxAt(ctx, bx, by, 0, 11, 14, 2, '#8b6f47', s);
  pxAt(ctx, bx, by, 0, 13, 14, 1, darken('#8b6f47', 0.15), s);
  // Legs (taller — standing desk)
  pxAt(ctx, bx, by, 1, 14, 1, 8, '#5a5a64', s);
  pxAt(ctx, bx, by, 12, 14, 1, 8, '#5a5a64', s);

  // Laptop
  pxAt(ctx, bx, by, 3, 7, 8, 3, '#3a3a44', s);
  pxAt(ctx, bx, by, 4, 7, 6, 2, '#1a3848', s);
  pxAt(ctx, bx, by, 5, 8, 3, 1, '#2a6050', s);
  // Keyboard base
  pxAt(ctx, bx, by, 3, 10, 8, 1, '#4a4a54', s);
}

export function drawBookshelf(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  ctx.imageSmoothingEnabled = false;
  const bx = x / s;
  const by = y / s;
  const w = 20;
  const h = 18;

  pxAt(ctx, bx, by, 0, 0, w, h, '#5a4030', s);
  for (let sy = 0; sy < 3; sy++) {
    const shelfY = 1 + sy * 6;
    pxAt(ctx, bx, by, 0, shelfY + 5, w, 1, '#7a5a40', s);
    const bookColors = ['#c04040', '#4060c0', '#40a060', '#c0a040', '#8040a0', '#c06030', '#3080a0', '#a04070'];
    let bkx = 1;
    for (let b = 0; b < 5 + (sy * 2 + bx) % 3; b++) {
      const bw = 1 + ((b + sy * 3 + Math.floor(bx)) % 2);
      const bh = 3 + ((b + sy) % 3);
      const bc = bookColors[(b + sy * 3 + Math.floor(bx * 7)) % bookColors.length];
      if (bkx + bw >= w - 1) break;
      pxAt(ctx, bx, by, bkx, shelfY + 5 - bh, bw, bh, bc, s);
      pxAt(ctx, bx, by, bkx, shelfY + 5 - bh, 1, bh, lighten(bc, 0.15), s);
      bkx += bw + 1;
    }
  }
  pxAt(ctx, bx, by, 0, 0, 1, h, '#6b4a35', s);
  pxAt(ctx, bx, by, w - 1, 0, 1, h, '#4a3525', s);
  pxAt(ctx, bx, by, 0, 0, w, 1, '#6b4a35', s);
}

export function drawPottedPlant(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  ctx.imageSmoothingEnabled = false;
  const bx = x / s;
  const by = y / s;

  pxAt(ctx, bx, by, 2, 8, 6, 5, '#b06030', s);
  pxAt(ctx, bx, by, 3, 8, 4, 1, '#c07040', s);
  pxAt(ctx, bx, by, 1, 8, 1, 1, '#b06030', s);
  pxAt(ctx, bx, by, 8, 8, 1, 1, '#b06030', s);
  pxAt(ctx, bx, by, 3, 8, 4, 1, '#4a3020', s);

  const leafColor = '#3a8050';
  const leafLight = '#4a9a60';
  const leafDark = '#2a6a3a';
  pxAt(ctx, bx, by, 5, 3, 1, 5, '#2a5a30', s);
  pxAt(ctx, bx, by, 3, 2, 4, 3, leafColor, s);
  pxAt(ctx, bx, by, 2, 3, 6, 2, leafColor, s);
  pxAt(ctx, bx, by, 4, 1, 3, 1, leafColor, s);
  pxAt(ctx, bx, by, 3, 2, 2, 1, leafLight, s);
  pxAt(ctx, bx, by, 2, 3, 1, 1, leafLight, s);
  pxAt(ctx, bx, by, 7, 4, 1, 1, leafDark, s);
  pxAt(ctx, bx, by, 5, 5, 2, 1, leafDark, s);
}

export function drawClock(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, time: number) {
  ctx.imageSmoothingEnabled = false;
  const bx = x / s;
  const by = y / s;

  pxAt(ctx, bx, by, 1, 0, 6, 1, '#6a6060', s);
  pxAt(ctx, bx, by, 0, 1, 8, 6, '#e8e0d0', s);
  pxAt(ctx, bx, by, 1, 7, 6, 1, '#6a6060', s);
  pxAt(ctx, bx, by, 1, 0, 6, 1, '#5a5050', s);
  pxAt(ctx, bx, by, 0, 1, 1, 6, '#5a5050', s);
  pxAt(ctx, bx, by, 7, 1, 1, 6, '#4a4040', s);
  pxAt(ctx, bx, by, 1, 7, 6, 1, '#4a4040', s);

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
}

export function drawWaterCooler(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  ctx.imageSmoothingEnabled = false;
  const bx = x / s;
  const by = y / s;

  pxAt(ctx, bx, by, 2, 10, 6, 6, '#8a8a90', s);
  pxAt(ctx, bx, by, 2, 10, 6, 1, '#9a9aa0', s);
  pxAt(ctx, bx, by, 2, 16, 2, 2, '#7a7a80', s);
  pxAt(ctx, bx, by, 6, 16, 2, 2, '#7a7a80', s);
  pxAt(ctx, bx, by, 3, 1, 4, 9, '#a0d0e8', s);
  pxAt(ctx, bx, by, 3, 1, 1, 9, '#b0e0f0', s);
  pxAt(ctx, bx, by, 4, 0, 2, 1, '#90c0d8', s);
  pxAt(ctx, bx, by, 7, 12, 2, 1, '#7a7a80', s);
  pxAt(ctx, bx, by, 8, 12, 1, 2, '#5a5a60', s);
}

// ── NEW FURNITURE ──

export function drawVendingMachine(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  ctx.imageSmoothingEnabled = false;
  const bx = x / s;
  const by = y / s;

  // Body
  pxAt(ctx, bx, by, 0, 0, 10, 18, '#4a4a54', s);
  pxAt(ctx, bx, by, 0, 0, 10, 1, '#5a5a64', s); // top highlight
  // Base wider
  pxAt(ctx, bx, by, -1, 16, 12, 2, '#3a3a44', s);
  // Glass front
  pxAt(ctx, bx, by, 1, 2, 7, 10, '#2a3a4a', s);
  // Snack items (colored rectangles)
  const snackColors = ['#e04040', '#40a0e0', '#e0c040', '#40c060', '#e080c0', '#f0a030'];
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const ci = (row * 3 + col) % snackColors.length;
      pxAt(ctx, bx, by, 2 + col * 2, 3 + row * 3, 1, 2, snackColors[ci], s);
    }
  }
  // Coin slot
  pxAt(ctx, bx, by, 8, 6, 1, 2, '#2a2a34', s);
  pxAt(ctx, bx, by, 8, 6, 1, 1, '#6a6a74', s);
  // Dispensing slot
  pxAt(ctx, bx, by, 1, 13, 7, 2, '#1a1a24', s);
}

export function drawCoffeeMachine(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  ctx.imageSmoothingEnabled = false;
  const bx = x / s;
  const by = y / s;

  // Body
  pxAt(ctx, bx, by, 0, 0, 8, 10, '#2a2a34', s);
  pxAt(ctx, bx, by, 0, 0, 8, 1, '#3a3a44', s); // top
  // Chrome accents
  pxAt(ctx, bx, by, 1, 2, 6, 1, '#8a8a94', s);
  pxAt(ctx, bx, by, 1, 5, 6, 1, '#8a8a94', s);
  // Nozzle area
  pxAt(ctx, bx, by, 3, 3, 2, 2, '#5a5a64', s);
  // Drip tray
  pxAt(ctx, bx, by, 1, 7, 6, 2, '#4a3020', s);
  pxAt(ctx, bx, by, 1, 7, 6, 1, '#5a4030', s);
  // Power light
  pxAt(ctx, bx, by, 6, 1, 1, 1, '#e03030', s);
  // Steam (subtle)
  pxAt(ctx, bx, by, 3, -1, 1, 1, 'rgba(200,200,200,0.3)', s);
  pxAt(ctx, bx, by, 4, -2, 1, 1, 'rgba(200,200,200,0.2)', s);
}

export function drawCouch(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  ctx.imageSmoothingEnabled = false;
  const bx = x / s;
  const by = y / s;

  const couchColor = '#3a4a6a';
  const couchLight = '#4a5a7a';

  // Back rest
  pxAt(ctx, bx, by, 1, 0, 18, 4, couchColor, s);
  pxAt(ctx, bx, by, 2, 0, 16, 1, couchLight, s); // top highlight
  // Seat cushions
  pxAt(ctx, bx, by, 1, 4, 18, 4, couchColor, s);
  pxAt(ctx, bx, by, 1, 4, 18, 1, couchLight, s); // cushion top highlight
  // Cushion divider
  pxAt(ctx, bx, by, 10, 4, 1, 3, darken(couchColor, 0.15), s);
  // Armrests
  pxAt(ctx, bx, by, 0, 1, 2, 7, darken(couchColor, 0.1), s);
  pxAt(ctx, bx, by, 0, 1, 2, 1, couchLight, s);
  pxAt(ctx, bx, by, 18, 1, 2, 7, darken(couchColor, 0.15), s);
  pxAt(ctx, bx, by, 18, 1, 2, 1, couchColor, s);
  // Legs
  pxAt(ctx, bx, by, 1, 8, 2, 2, '#2a2020', s);
  pxAt(ctx, bx, by, 17, 8, 2, 2, '#2a2020', s);
}

export function drawLandscapePainting(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  ctx.imageSmoothingEnabled = false;
  const bx = x / s;
  const by = y / s;

  // Frame
  pxAt(ctx, bx, by, 0, 0, 16, 10, '#6a4a30', s);
  pxAt(ctx, bx, by, 0, 0, 16, 1, '#7a5a40', s); // top highlight

  // Interior — sky gradient
  pxAt(ctx, bx, by, 2, 2, 12, 3, '#6090c0', s);
  pxAt(ctx, bx, by, 2, 2, 12, 1, '#80b0e0', s); // lighter top sky
  // Sun
  pxAt(ctx, bx, by, 11, 2, 2, 2, '#f0e060', s);
  // Clouds
  pxAt(ctx, bx, by, 4, 2, 3, 1, '#e0e8f0', s);
  pxAt(ctx, bx, by, 3, 3, 4, 1, '#d0d8e0', s);
  // Hills
  pxAt(ctx, bx, by, 2, 5, 12, 3, '#4a8050', s);
  pxAt(ctx, bx, by, 2, 5, 5, 1, '#3a7040', s); // hill shadow
  pxAt(ctx, bx, by, 7, 5, 4, 1, '#5a9060', s); // hill highlight
  // Foreground
  pxAt(ctx, bx, by, 2, 7, 12, 1, '#3a6a38', s);

  // Inner frame border
  pxAt(ctx, bx, by, 1, 1, 14, 1, '#5a3a20', s);
  pxAt(ctx, bx, by, 1, 8, 14, 1, '#5a3a20', s);
  pxAt(ctx, bx, by, 1, 1, 1, 8, '#5a3a20', s);
  pxAt(ctx, bx, by, 14, 1, 1, 8, '#4a2a18', s);
}

export function drawWhiteboard(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  ctx.imageSmoothingEnabled = false;
  const bx = x / s;
  const by = y / s;

  // Board frame
  pxAt(ctx, bx, by, 0, 0, 16, 10, '#b0b0b8', s);
  // White surface
  pxAt(ctx, bx, by, 1, 1, 14, 7, '#f0f0f0', s);
  // Scribble lines
  pxAt(ctx, bx, by, 2, 2, 6, 1, '#d04040', s);
  pxAt(ctx, bx, by, 3, 4, 8, 1, '#3060c0', s);
  pxAt(ctx, bx, by, 2, 6, 5, 1, '#30a040', s);
  // Marker tray
  pxAt(ctx, bx, by, 1, 8, 14, 2, '#9a9aa0', s);
  pxAt(ctx, bx, by, 1, 8, 14, 1, '#aaaaB0', s);
  // Marker nubs
  pxAt(ctx, bx, by, 3, 8, 2, 1, '#d04040', s);
  pxAt(ctx, bx, by, 6, 8, 2, 1, '#3060c0', s);
  pxAt(ctx, bx, by, 9, 8, 2, 1, '#30a040', s);
}
