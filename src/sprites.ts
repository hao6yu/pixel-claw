import type { AgentActivity } from './types';

// All drawing is procedural pixel art — no external assets needed

// ── Helpers ──────────────────────────────────────────────────────────

function px(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string, s: number) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x * s), Math.round(y * s), Math.round(w * s), Math.round(h * s));
}

function pxAt(ctx: CanvasRenderingContext2D, bx: number, by: number, x: number, y: number, w: number, h: number, color: string, s: number) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round((bx + x) * s), Math.round((by + y) * s), Math.round(w * s), Math.round(h * s));
}

function darken(hex: string, amount: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const f = 1 - amount;
  return `rgb(${Math.round(r * f)},${Math.round(g * f)},${Math.round(b * f)})`;
}

function lighten(hex: string, amount: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${Math.min(255, Math.round(r + (255 - r) * amount))},${Math.min(255, Math.round(g + (255 - g) * amount))},${Math.min(255, Math.round(b + (255 - b) * amount))})`;
}

function hashNum(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

// ── Skin / Hair / Feature generation from agentId ──────────────────

const SKIN_TONES = ['#f5d0a9', '#e8b88a', '#d4a574', '#c68c5b', '#a0704a', '#7a5435'];
const HAIR_COLORS = ['#2a1a0a', '#4a2a10', '#8b6040', '#c0a060', '#e0c080', '#d04030', '#303030', '#f0e0c0'];

interface AgentAppearance {
  skinColor: string;
  skinShadow: string;
  hairColor: string;
  hairShadow: string;
  hairStyle: number; // 0-5
  shirtColor: string;
  shirtShadow: string;
  pantsColor: string;
  pantsShadow: string;
  eyeColor: string;
}

function getAppearance(agentId: string, shirtColor: string): AgentAppearance {
  const h = hashNum(agentId);
  const skinColor = SKIN_TONES[h % SKIN_TONES.length];
  const hairColor = HAIR_COLORS[(h >> 4) % HAIR_COLORS.length];
  const hairStyle = (h >> 8) % 6;
  const pantsColor = '#3a4a6a';
  return {
    skinColor,
    skinShadow: darken(skinColor, 0.15),
    hairColor,
    hairShadow: darken(hairColor, 0.2),
    hairStyle,
    shirtColor,
    shirtShadow: darken(shirtColor, 0.25),
    pantsColor,
    pantsShadow: darken(pantsColor, 0.2),
    eyeColor: '#1a1a1a',
  };
}

// ── Character Drawing (16x24 base) ─────────────────────────────────

export function drawCharacter(
  ctx: CanvasRenderingContext2D,
  baseX: number, baseY: number,
  color: string,
  activity: AgentActivity,
  frame: number,
  scale: number,
  agentId: string = 'default',
  globalTime: number = 0,
) {
  ctx.imageSmoothingEnabled = false;
  const s = scale;
  const a = getAppearance(agentId, color);
  // Convert baseX/baseY from pixel coords to "unit" coords for pxAt
  const bx = baseX / s;
  const by = baseY / s;

  // Animation offsets
  const isSitting = activity !== 'idle' || true; // always at desk except break area
  const breathe = activity === 'idle' ? Math.sin(globalTime * 2) * 0.5 : 0;
  const typeBob = (activity === 'coding' || activity === 'browsing' || activity === 'running-cmd')
    ? Math.sin(globalTime * 8) * 0.5 : 0;
  const thinkBob = activity === 'thinking' ? Math.sin(globalTime * 1.5) * 0.3 : 0;
  const bob = Math.round(breathe + typeBob + thinkBob);

  // Blink cycle: eyes open most of the time, blink briefly
  const blinkCycle = Math.floor(globalTime * 2) % 20;
  const isBlinking = blinkCycle === 0;

  // ── Hair (back layer for some styles) ──
  if (a.hairStyle === 2 || a.hairStyle === 5) {
    // Long hair back
    pxAt(ctx, bx, by, 3, 1 + bob, 10, 10, a.hairShadow, s);
  }

  // ── Head ──
  pxAt(ctx, bx, by, 4, 2 + bob, 8, 8, a.skinColor, s);
  // Head shadow (right side - light from top-left)
  pxAt(ctx, bx, by, 10, 3 + bob, 2, 6, a.skinShadow, s);
  pxAt(ctx, bx, by, 4, 8 + bob, 8, 2, a.skinShadow, s);

  // ── Hair styles ──
  drawHair(ctx, bx, by + bob, a, s);

  // ── Eyes ──
  const eyeY = 5 + bob;
  if (activity === 'sleeping') {
    // Closed eyes
    pxAt(ctx, bx, by, 5, eyeY + 1, 2, 1, a.eyeColor, s);
    pxAt(ctx, bx, by, 9, eyeY + 1, 2, 1, a.eyeColor, s);
  } else if (activity === 'error') {
    // X eyes
    pxAt(ctx, bx, by, 5, eyeY, 1, 1, '#e03030', s);
    pxAt(ctx, bx, by, 6, eyeY + 1, 1, 1, '#e03030', s);
    pxAt(ctx, bx, by, 5, eyeY + 2, 1, 1, '#e03030', s);
    pxAt(ctx, bx, by, 9, eyeY, 1, 1, '#e03030', s);
    pxAt(ctx, bx, by, 10, eyeY + 1, 1, 1, '#e03030', s);
    pxAt(ctx, bx, by, 9, eyeY + 2, 1, 1, '#e03030', s);
  } else if (activity === 'reading') {
    // Looking down
    if (isBlinking) {
      pxAt(ctx, bx, by, 5, eyeY + 2, 2, 1, a.eyeColor, s);
      pxAt(ctx, bx, by, 9, eyeY + 2, 2, 1, a.eyeColor, s);
    } else {
      pxAt(ctx, bx, by, 5, eyeY + 1, 2, 2, a.eyeColor, s);
      pxAt(ctx, bx, by, 9, eyeY + 1, 2, 2, a.eyeColor, s);
      pxAt(ctx, bx, by, 6, eyeY + 1, 1, 1, '#fff', s);
      pxAt(ctx, bx, by, 10, eyeY + 1, 1, 1, '#fff', s);
    }
  } else if (activity === 'thinking') {
    // Looking up-right
    if (isBlinking) {
      pxAt(ctx, bx, by, 6, eyeY, 2, 1, a.eyeColor, s);
      pxAt(ctx, bx, by, 10, eyeY, 2, 1, a.eyeColor, s);
    } else {
      pxAt(ctx, bx, by, 5, eyeY, 2, 2, a.eyeColor, s);
      pxAt(ctx, bx, by, 9, eyeY, 2, 2, a.eyeColor, s);
      pxAt(ctx, bx, by, 6, eyeY, 1, 1, '#fff', s);
      pxAt(ctx, bx, by, 10, eyeY, 1, 1, '#fff', s);
    }
  } else {
    // Normal eyes
    if (isBlinking) {
      pxAt(ctx, bx, by, 5, eyeY + 1, 2, 1, a.eyeColor, s);
      pxAt(ctx, bx, by, 9, eyeY + 1, 2, 1, a.eyeColor, s);
    } else {
      pxAt(ctx, bx, by, 5, eyeY, 2, 2, a.eyeColor, s);
      pxAt(ctx, bx, by, 9, eyeY, 2, 2, a.eyeColor, s);
      // Highlight
      pxAt(ctx, bx, by, 5, eyeY, 1, 1, '#fff', s);
      pxAt(ctx, bx, by, 9, eyeY, 1, 1, '#fff', s);
    }
  }

  // ── Mouth ──
  if (activity === 'communicating') {
    const open = Math.floor(globalTime * 6) % 2 === 0;
    pxAt(ctx, bx, by, 7, 8 + bob, 2, open ? 2 : 1, '#c04050', s);
  } else if (activity === 'error') {
    // Frown
    pxAt(ctx, bx, by, 6, 9 + bob, 1, 1, '#c04050', s);
    pxAt(ctx, bx, by, 7, 8 + bob, 2, 1, '#c04050', s);
    pxAt(ctx, bx, by, 9, 9 + bob, 1, 1, '#c04050', s);
  } else {
    // Neutral
    pxAt(ctx, bx, by, 7, 8 + bob, 2, 1, darken(a.skinColor, 0.3), s);
  }

  // ── Body / Shirt ──
  pxAt(ctx, bx, by, 4, 10 + bob, 8, 6, a.shirtColor, s);
  // Shirt shadow
  pxAt(ctx, bx, by, 10, 10 + bob, 2, 6, a.shirtShadow, s);
  // Collar
  pxAt(ctx, bx, by, 6, 10 + bob, 4, 1, lighten(a.shirtColor, 0.15), s);

  // ── Arms ──
  if (activity === 'coding' || activity === 'browsing' || activity === 'running-cmd') {
    // Arms forward (typing)
    const armAnim = Math.floor(globalTime * 6) % 2;
    pxAt(ctx, bx, by, 2, 11 + bob, 2, 3, a.shirtColor, s);
    pxAt(ctx, bx, by, 1, 14 + bob, 2, 1, a.skinColor, s); // hand
    pxAt(ctx, bx, by, 12, 11 + bob, 2, 3, a.shirtColor, s);
    pxAt(ctx, bx, by, 13, 14 + bob - armAnim, 2, 1, a.skinColor, s); // hand
  } else if (activity === 'thinking') {
    // One hand on chin
    pxAt(ctx, bx, by, 2, 11 + bob, 2, 5, a.shirtColor, s);
    pxAt(ctx, bx, by, 12, 11 + bob, 2, 2, a.shirtColor, s);
    pxAt(ctx, bx, by, 10, 8 + bob, 2, 1, a.skinColor, s); // hand on chin
    pxAt(ctx, bx, by, 11, 9 + bob, 2, 2, a.shirtColor, s); // forearm
  } else {
    // Arms at sides
    pxAt(ctx, bx, by, 2, 11 + bob, 2, 5, a.shirtColor, s);
    pxAt(ctx, bx, by, 2, 16 + bob, 2, 1, a.skinColor, s);
    pxAt(ctx, bx, by, 12, 11 + bob, 2, 5, a.shirtShadow, s);
    pxAt(ctx, bx, by, 12, 16 + bob, 2, 1, a.skinShadow, s);
  }

  // ── Pants / Legs ──
  pxAt(ctx, bx, by, 4, 16, 8, 3, a.pantsColor, s);
  pxAt(ctx, bx, by, 4, 16, 3, 3, a.pantsColor, s);
  pxAt(ctx, bx, by, 9, 16, 3, 3, a.pantsShadow, s);
  // Gap between legs
  pxAt(ctx, bx, by, 7, 18, 2, 1, '#00000000', s); // actually let's just overwrite
  // Shoes
  pxAt(ctx, bx, by, 3, 19, 4, 1, '#2a2020', s);
  pxAt(ctx, bx, by, 9, 19, 4, 1, '#2a2020', s);

  // ── Sleeping Zzz ──
  if (activity === 'sleeping') {
    drawZzz(ctx, bx, by, globalTime, s);
  }

  // ── Thought bubble for thinking ──
  if (activity === 'thinking') {
    drawThoughtBubble(ctx, bx, by, globalTime, s);
  }
}

function drawHair(ctx: CanvasRenderingContext2D, bx: number, by: number, a: AgentAppearance, s: number) {
  switch (a.hairStyle) {
    case 0: // Short spiky
      pxAt(ctx, bx, by, 4, 1, 8, 3, a.hairColor, s);
      pxAt(ctx, bx, by, 3, 2, 1, 3, a.hairColor, s);
      pxAt(ctx, bx, by, 12, 2, 1, 3, a.hairColor, s);
      // Spikes
      pxAt(ctx, bx, by, 5, 0, 2, 1, a.hairColor, s);
      pxAt(ctx, bx, by, 8, 0, 2, 1, a.hairColor, s);
      break;
    case 1: // Neat/parted
      pxAt(ctx, bx, by, 4, 1, 8, 3, a.hairColor, s);
      pxAt(ctx, bx, by, 3, 2, 1, 4, a.hairColor, s);
      pxAt(ctx, bx, by, 12, 2, 1, 4, a.hairColor, s);
      // Part line
      pxAt(ctx, bx, by, 7, 1, 1, 2, a.hairShadow, s);
      break;
    case 2: // Long flowing
      pxAt(ctx, bx, by, 3, 1, 10, 3, a.hairColor, s);
      pxAt(ctx, bx, by, 2, 3, 2, 8, a.hairColor, s);
      pxAt(ctx, bx, by, 12, 3, 2, 8, a.hairColor, s);
      break;
    case 3: // Buzz cut
      pxAt(ctx, bx, by, 4, 1, 8, 2, a.hairColor, s);
      pxAt(ctx, bx, by, 3, 2, 1, 2, a.hairColor, s);
      pxAt(ctx, bx, by, 12, 2, 1, 2, a.hairColor, s);
      break;
    case 4: // Mohawk
      pxAt(ctx, bx, by, 6, -1, 4, 4, a.hairColor, s);
      pxAt(ctx, bx, by, 7, -2, 2, 1, a.hairColor, s);
      pxAt(ctx, bx, by, 3, 2, 1, 2, a.hairShadow, s);
      pxAt(ctx, bx, by, 12, 2, 1, 2, a.hairShadow, s);
      break;
    case 5: // Curly/afro
      pxAt(ctx, bx, by, 3, 0, 10, 4, a.hairColor, s);
      pxAt(ctx, bx, by, 2, 1, 1, 4, a.hairColor, s);
      pxAt(ctx, bx, by, 13, 1, 1, 4, a.hairColor, s);
      pxAt(ctx, bx, by, 4, -1, 8, 1, a.hairColor, s);
      // Texture dots
      pxAt(ctx, bx, by, 5, 0, 1, 1, a.hairShadow, s);
      pxAt(ctx, bx, by, 8, 0, 1, 1, a.hairShadow, s);
      pxAt(ctx, bx, by, 11, 1, 1, 1, a.hairShadow, s);
      break;
  }
}

function drawZzz(ctx: CanvasRenderingContext2D, bx: number, by: number, time: number, s: number) {
  const phase = time % 3;
  const alpha1 = Math.min(1, phase);
  const alpha2 = Math.max(0, Math.min(1, phase - 0.8));
  const alpha3 = Math.max(0, Math.min(1, phase - 1.6));

  ctx.fillStyle = `rgba(140,170,255,${alpha1 * 0.8})`;
  fillPixelText(ctx, 'z', (bx + 14) * s, (by - 1) * s, 5 * s);
  if (alpha2 > 0) {
    ctx.fillStyle = `rgba(140,170,255,${alpha2 * 0.6})`;
    fillPixelText(ctx, 'Z', (bx + 16) * s, (by - 5) * s, 6 * s);
  }
  if (alpha3 > 0) {
    ctx.fillStyle = `rgba(140,170,255,${alpha3 * 0.4})`;
    fillPixelText(ctx, 'Z', (bx + 18) * s, (by - 9) * s, 7 * s);
  }
}

function fillPixelText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size: number) {
  ctx.font = `${Math.round(size)}px monospace`;
  ctx.fillText(text, Math.round(x), Math.round(y));
}

function drawThoughtBubble(ctx: CanvasRenderingContext2D, bx: number, by: number, time: number, s: number) {
  // Small dots leading up
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  const dx = bx + 14;
  const dy = by + 1;
  pxAt(ctx, 0, 0, dx, dy, 2, 2, 'rgba(255,255,255,0.5)', s);
  pxAt(ctx, 0, 0, dx + 2, dy - 3, 2, 2, 'rgba(255,255,255,0.6)', s);

  // Main bubble
  const bubX = (dx + 3) * s;
  const bubY = (dy - 10) * s;
  const bubW = 14 * s;
  const bubH = 8 * s;
  ctx.fillStyle = '#f0ece4';
  ctx.fillRect(Math.round(bubX + s), Math.round(bubY), Math.round(bubW - 2 * s), Math.round(bubH));
  ctx.fillRect(Math.round(bubX), Math.round(bubY + s), Math.round(bubW), Math.round(bubH - 2 * s));
  // Border
  ctx.fillStyle = '#8a8070';
  ctx.fillRect(Math.round(bubX + s), Math.round(bubY), Math.round(bubW - 2 * s), Math.round(s));
  ctx.fillRect(Math.round(bubX + s), Math.round(bubY + bubH - s), Math.round(bubW - 2 * s), Math.round(s));
  ctx.fillRect(Math.round(bubX), Math.round(bubY + s), Math.round(s), Math.round(bubH - 2 * s));
  ctx.fillRect(Math.round(bubX + bubW - s), Math.round(bubY + s), Math.round(s), Math.round(bubH - 2 * s));

  // Animated dots
  const dotCount = (Math.floor(time * 2) % 3) + 1;
  ctx.fillStyle = '#6a6050';
  for (let i = 0; i < dotCount; i++) {
    ctx.fillRect(Math.round(bubX + (3 + i * 4) * s), Math.round(bubY + 3 * s), Math.round(2 * s), Math.round(2 * s));
  }
}

// ── Speech/Status Bubble ────────────────────────────────────────────

export function drawStatusBubble(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  text: string,
  scale: number,
) {
  if (!text) return;
  ctx.imageSmoothingEnabled = false;
  const s = scale;
  const maxChars = 18;
  const display = text.length > maxChars ? text.slice(0, maxChars - 2) + '..' : text;

  ctx.font = `${Math.round(7 * s)}px "Courier New", monospace`;
  const tw = ctx.measureText(display).width;
  const padX = 3 * s;
  const padY = 2 * s;
  const bw = tw + padX * 2;
  const bh = 8 * s;
  const bx = Math.round(x - bw / 2);
  const by = Math.round(y - bh);

  // Bubble fill
  ctx.fillStyle = '#f0ece4';
  ctx.fillRect(bx + s, by, bw - 2 * s, bh);
  ctx.fillRect(bx, by + s, bw, bh - 2 * s);
  // Border
  ctx.fillStyle = '#8a8070';
  ctx.fillRect(bx + s, by, bw - 2 * s, s);
  ctx.fillRect(bx + s, by + bh - s, bw - 2 * s, s);
  ctx.fillRect(bx, by + s, s, bh - 2 * s);
  ctx.fillRect(bx + bw - s, by + s, s, bh - 2 * s);
  // Tail
  ctx.fillStyle = '#f0ece4';
  ctx.fillRect(Math.round(x - s), by + bh, Math.round(2 * s), Math.round(2 * s));
  ctx.fillStyle = '#8a8070';
  ctx.fillRect(Math.round(x - 2 * s), by + bh, Math.round(s), Math.round(s));
  ctx.fillRect(Math.round(x + s), by + bh, Math.round(s), Math.round(s));
  ctx.fillRect(Math.round(x - s), by + bh + s, Math.round(s), Math.round(s));

  // Text
  ctx.fillStyle = '#3a3020';
  ctx.textAlign = 'center';
  ctx.fillText(display, Math.round(x), Math.round(by + bh - padY));
  ctx.textAlign = 'left';
}

// ── Office Furniture ────────────────────────────────────────────────

export function drawDesk(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  ctx.imageSmoothingEnabled = false;
  const bx = x / s;
  const by = y / s;

  // ── Chair (behind desk, draw first) ──
  // Seat
  pxAt(ctx, bx, by, 4, 15, 8, 2, '#5a4535', s);
  pxAt(ctx, bx, by, 4, 15, 8, 1, '#6b5545', s);
  // Back rest
  pxAt(ctx, bx, by, 4, 11, 8, 4, '#5a4535', s);
  pxAt(ctx, bx, by, 5, 11, 6, 1, '#6b5545', s);
  // Chair legs
  pxAt(ctx, bx, by, 4, 17, 1, 3, '#3a3030', s);
  pxAt(ctx, bx, by, 11, 17, 1, 3, '#3a3030', s);
  pxAt(ctx, bx, by, 7, 17, 2, 4, '#3a3030', s); // center post
  // Wheels
  pxAt(ctx, bx, by, 5, 21, 2, 1, '#2a2020', s);
  pxAt(ctx, bx, by, 9, 21, 2, 1, '#2a2020', s);

  // ── Desk surface ──
  // Top highlight
  pxAt(ctx, bx, by, -3, 22, 22, 1, lighten('#8b6f47', 0.2), s);
  // Main surface
  pxAt(ctx, bx, by, -3, 23, 22, 3, '#8b6f47', s);
  // Shadow edge
  pxAt(ctx, bx, by, -3, 26, 22, 1, darken('#8b6f47', 0.15), s);
  // Front panel
  pxAt(ctx, bx, by, -3, 27, 22, 5, '#6b5337', s);
  pxAt(ctx, bx, by, -3, 27, 22, 1, darken('#6b5337', 0.1), s);
  // Desk legs
  pxAt(ctx, bx, by, -2, 32, 2, 3, '#5a4530', s);
  pxAt(ctx, bx, by, 16, 32, 2, 3, '#5a4530', s);

  // ── Monitor ──
  // Monitor body
  pxAt(ctx, bx, by, 2, 14, 12, 8, '#3a3a44', s);
  // Screen bezel
  pxAt(ctx, bx, by, 3, 15, 10, 6, '#2a2a34', s);
  // Screen content (glowing)
  pxAt(ctx, bx, by, 3, 15, 10, 6, '#1a3848', s);
  // Screen glow lines (code-like)
  pxAt(ctx, bx, by, 4, 16, 5, 1, '#2a6050', s);
  pxAt(ctx, bx, by, 4, 18, 7, 1, '#2a5060', s);
  pxAt(ctx, bx, by, 4, 20, 4, 1, '#2a6050', s);
  // Screen highlight (top-left light reflection)
  pxAt(ctx, bx, by, 3, 15, 3, 1, 'rgba(255,255,255,0.08)', s);
  // Monitor stand
  pxAt(ctx, bx, by, 6, 22, 4, 1, '#3a3a44', s);
  pxAt(ctx, bx, by, 7, 22, 2, 2, '#3a3a44', s);

  // ── Keyboard ──
  pxAt(ctx, bx, by, 2, 24, 8, 2, '#4a4a54', s);
  pxAt(ctx, bx, by, 2, 24, 8, 1, '#5a5a64', s);
  // Key dots
  for (let kx = 0; kx < 6; kx++) {
    pxAt(ctx, bx, by, 3 + kx, 24, 1, 1, '#3a3a44', s);
  }
}

// ── Environment Drawing ─────────────────────────────────────────────

export function drawWoodFloor(ctx: CanvasRenderingContext2D, w: number, h: number, s: number) {
  ctx.imageSmoothingEnabled = false;
  const plankW = 12 * s;
  const plankH = 4 * s;
  const baseColors = ['#8a6f4e', '#7d6545', '#96785a', '#87694a'];

  for (let y = 0; y < h; y += plankH) {
    const rowOffset = (Math.floor(y / plankH) % 2) * (plankW / 2);
    for (let x = -plankW; x < w + plankW; x += plankW) {
      const px = Math.round(x + rowOffset);
      const py = Math.round(y);
      const colorIdx = (Math.floor((x + rowOffset) / plankW) * 3 + Math.floor(y / plankH) * 7) & 3;
      const base = baseColors[colorIdx];

      ctx.fillStyle = base;
      ctx.fillRect(px, py, plankW, plankH);

      // Subtle grain lines
      ctx.fillStyle = darken(base, 0.06);
      ctx.fillRect(px, py + Math.round(s), plankW, Math.round(s));
      ctx.fillRect(px, py + Math.round(3 * s), plankW, Math.round(s * 0.5));

      // Plank edge (gap)
      ctx.fillStyle = darken(base, 0.2);
      ctx.fillRect(px + plankW - Math.round(s * 0.5), py, Math.round(s * 0.5), plankH);
      ctx.fillStyle = darken(base, 0.12);
      ctx.fillRect(px, py + plankH - Math.round(s * 0.5), plankW, Math.round(s * 0.5));
    }
  }
}

export function drawWall(ctx: CanvasRenderingContext2D, w: number, wallH: number, s: number) {
  ctx.imageSmoothingEnabled = false;
  // Main wall
  ctx.fillStyle = '#4a4450';
  ctx.fillRect(0, 0, w, wallH);
  // Darker top
  ctx.fillStyle = '#3a3440';
  ctx.fillRect(0, 0, w, Math.round(4 * s));
  // Baseboard
  ctx.fillStyle = '#5a4535';
  ctx.fillRect(0, wallH - Math.round(3 * s), w, Math.round(3 * s));
  ctx.fillStyle = '#6b5545';
  ctx.fillRect(0, wallH - Math.round(3 * s), w, Math.round(s));
}

export function drawBookshelf(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  ctx.imageSmoothingEnabled = false;
  const bx = x / s;
  const by = y / s;
  const w = 20;
  const h = 18;

  // Back panel
  pxAt(ctx, bx, by, 0, 0, w, h, '#5a4030', s);
  // Shelves
  for (let sy = 0; sy < 3; sy++) {
    const shelfY = 1 + sy * 6;
    pxAt(ctx, bx, by, 0, shelfY + 5, w, 1, '#7a5a40', s);
    // Books on shelf
    const bookColors = ['#c04040', '#4060c0', '#40a060', '#c0a040', '#8040a0', '#c06030', '#3080a0', '#a04070'];
    let bkx = 1;
    for (let b = 0; b < 5 + (sy * 2 + bx) % 3; b++) {
      const bw = 1 + ((b + sy * 3 + Math.floor(bx)) % 2);
      const bh = 3 + ((b + sy) % 3);
      const bc = bookColors[(b + sy * 3 + Math.floor(bx * 7)) % bookColors.length];
      if (bkx + bw >= w - 1) break;
      pxAt(ctx, bx, by, bkx, shelfY + 5 - bh, bw, bh, bc, s);
      // Spine highlight
      pxAt(ctx, bx, by, bkx, shelfY + 5 - bh, 1, bh, lighten(bc, 0.15), s);
      bkx += bw + 1;
    }
  }
  // Frame
  pxAt(ctx, bx, by, 0, 0, 1, h, '#6b4a35', s);
  pxAt(ctx, bx, by, w - 1, 0, 1, h, '#4a3525', s);
  pxAt(ctx, bx, by, 0, 0, w, 1, '#6b4a35', s);
}

export function drawPottedPlant(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  ctx.imageSmoothingEnabled = false;
  const bx = x / s;
  const by = y / s;

  // Pot
  pxAt(ctx, bx, by, 2, 8, 6, 5, '#b06030', s);
  pxAt(ctx, bx, by, 3, 8, 4, 1, '#c07040', s); // rim highlight
  pxAt(ctx, bx, by, 1, 8, 1, 1, '#b06030', s); // rim wide
  pxAt(ctx, bx, by, 8, 8, 1, 1, '#b06030', s);

  // Soil
  pxAt(ctx, bx, by, 3, 8, 4, 1, '#4a3020', s);

  // Leaves
  const leafColor = '#3a8050';
  const leafLight = '#4a9a60';
  const leafDark = '#2a6a3a';
  // Center stem
  pxAt(ctx, bx, by, 5, 3, 1, 5, '#2a5a30', s);
  // Leaf clusters
  pxAt(ctx, bx, by, 3, 2, 4, 3, leafColor, s);
  pxAt(ctx, bx, by, 2, 3, 6, 2, leafColor, s);
  pxAt(ctx, bx, by, 4, 1, 3, 1, leafColor, s);
  // Highlights
  pxAt(ctx, bx, by, 3, 2, 2, 1, leafLight, s);
  pxAt(ctx, bx, by, 2, 3, 1, 1, leafLight, s);
  // Shadow
  pxAt(ctx, bx, by, 7, 4, 1, 1, leafDark, s);
  pxAt(ctx, bx, by, 5, 5, 2, 1, leafDark, s);
}

export function drawClock(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, time: number) {
  ctx.imageSmoothingEnabled = false;
  const bx = x / s;
  const by = y / s;

  // Clock body (round-ish)
  pxAt(ctx, bx, by, 1, 0, 6, 1, '#6a6060', s);
  pxAt(ctx, bx, by, 0, 1, 8, 6, '#e8e0d0', s);
  pxAt(ctx, bx, by, 1, 7, 6, 1, '#6a6060', s);
  // Frame
  pxAt(ctx, bx, by, 1, 0, 6, 1, '#5a5050', s);
  pxAt(ctx, bx, by, 0, 1, 1, 6, '#5a5050', s);
  pxAt(ctx, bx, by, 7, 1, 1, 6, '#4a4040', s);
  pxAt(ctx, bx, by, 1, 7, 6, 1, '#4a4040', s);

  // Hour markers
  pxAt(ctx, bx, by, 4, 1, 1, 1, '#3a3030', s);
  pxAt(ctx, bx, by, 6, 4, 1, 1, '#3a3030', s);
  pxAt(ctx, bx, by, 4, 6, 1, 1, '#3a3030', s);
  pxAt(ctx, bx, by, 1, 4, 1, 1, '#3a3030', s);

  // Hands (rotate with time)
  const h = (time * 0.05) % 12;
  const m = (time * 0.8) % 60;
  // Simple: just show hour hand pointing in a direction
  const hDir = Math.floor(h / 3) % 4;
  const handPositions = [[4, 2], [5, 4], [4, 5], [2, 4]]; // N, E, S, W
  pxAt(ctx, bx, by, 4, 4, 1, 1, '#2a2020', s); // center
  pxAt(ctx, bx, by, handPositions[hDir][0], handPositions[hDir][1], 1, 1, '#2a2020', s);
  // Minute hand
  const mDir = Math.floor(m / 15) % 4;
  const mPositions = [[4, 1], [6, 4], [4, 6], [1, 4]];
  pxAt(ctx, bx, by, mPositions[mDir][0], mPositions[mDir][1], 1, 1, '#c04040', s);
}

export function drawWaterCooler(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  ctx.imageSmoothingEnabled = false;
  const bx = x / s;
  const by = y / s;

  // Stand
  pxAt(ctx, bx, by, 2, 10, 6, 6, '#8a8a90', s);
  pxAt(ctx, bx, by, 2, 10, 6, 1, '#9a9aa0', s);
  // Legs
  pxAt(ctx, bx, by, 2, 16, 2, 2, '#7a7a80', s);
  pxAt(ctx, bx, by, 6, 16, 2, 2, '#7a7a80', s);
  // Bottle
  pxAt(ctx, bx, by, 3, 1, 4, 9, '#a0d0e8', s);
  pxAt(ctx, bx, by, 3, 1, 1, 9, '#b0e0f0', s); // highlight
  pxAt(ctx, bx, by, 4, 0, 2, 1, '#90c0d8', s); // cap
  // Tap
  pxAt(ctx, bx, by, 7, 12, 2, 1, '#7a7a80', s);
  pxAt(ctx, bx, by, 8, 12, 1, 2, '#5a5a60', s);
}
