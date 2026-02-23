import type { AgentActivity } from './types';

// All drawing is procedural pixel art — no external assets needed

const CHAR_W = 16;
const CHAR_H = 20;

interface DrawCtx {
  ctx: CanvasRenderingContext2D;
  x: number;
  y: number;
  color: string;
  frame: number;
  scale: number;
}

function px(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string, scale: number) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w * scale), Math.round(h * scale));
}

// Draw a charming pixel character
export function drawCharacter(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  color: string,
  activity: AgentActivity,
  frame: number,
  scale: number
) {
  const s = scale;
  const cx = x;
  const cy = y;

  // Body bob for active states
  const bob = (activity !== 'idle' && activity !== 'sleeping') ? Math.sin(frame * Math.PI / 2) * s : 0;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath();
  ctx.ellipse(cx + 8 * s, cy + 20 * s, 6 * s, 2 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body
  px(ctx, cx + 4 * s, cy + 10 * s + bob, 8, 8, color, s);

  // Head
  px(ctx, cx + 3 * s, cy + 2 * s + bob, 10, 8, darken(color, 0.1), s);

  // Eyes — depend on activity
  const eyeY = cy + 5 * s + bob;
  if (activity === 'sleeping') {
    // Closed eyes (lines)
    px(ctx, cx + 5 * s, eyeY, 2, 1, '#222', s);
    px(ctx, cx + 9 * s, eyeY, 2, 1, '#222', s);
    // Z's
    drawZzz(ctx, cx + 14 * s, cy - 2 * s, frame, s);
  } else if (activity === 'error') {
    // X eyes
    px(ctx, cx + 5 * s, eyeY - s, 1, 1, '#ff3333', s);
    px(ctx, cx + 6 * s, eyeY, 1, 1, '#ff3333', s);
    px(ctx, cx + 5 * s, eyeY + s, 1, 1, '#ff3333', s);
    px(ctx, cx + 9 * s, eyeY - s, 1, 1, '#ff3333', s);
    px(ctx, cx + 10 * s, eyeY, 1, 1, '#ff3333', s);
    px(ctx, cx + 9 * s, eyeY + s, 1, 1, '#ff3333', s);
  } else if (activity === 'thinking') {
    // Looking up
    px(ctx, cx + 5 * s, eyeY - s, 2, 2, '#222', s);
    px(ctx, cx + 9 * s, eyeY - s, 2, 2, '#222', s);
    // Thought bubble
    drawThoughtBubble(ctx, cx + 15 * s, cy - 4 * s, frame, s);
  } else {
    // Normal eyes with blink
    const blink = frame % 4 === 3;
    if (blink) {
      px(ctx, cx + 5 * s, eyeY + s, 2, 1, '#222', s);
      px(ctx, cx + 9 * s, eyeY + s, 2, 1, '#222', s);
    } else {
      px(ctx, cx + 5 * s, eyeY, 2, 2, '#222', s);
      px(ctx, cx + 9 * s, eyeY, 2, 2, '#222', s);
      // Pupil highlight
      px(ctx, cx + 5 * s, eyeY, 1, 1, '#fff', s);
      px(ctx, cx + 9 * s, eyeY, 1, 1, '#fff', s);
    }
  }

  // Mouth
  if (activity === 'communicating') {
    // Open mouth (talking)
    const mouthOpen = frame % 2 === 0;
    px(ctx, cx + 6 * s, cy + 8 * s + bob, 4, mouthOpen ? 2 : 1, '#c04050', s);
  } else if (activity === 'error') {
    px(ctx, cx + 6 * s, cy + 8 * s + bob, 4, 1, '#ff5555', s);
  } else {
    px(ctx, cx + 7 * s, cy + 8 * s + bob, 2, 1, darken(color, 0.3), s);
  }

  // Arms
  if (activity === 'coding' || activity === 'browsing' || activity === 'reading') {
    // Arms forward (typing)
    const armBob = frame % 2 === 0 ? 0 : s;
    px(ctx, cx + 2 * s, cy + 12 * s + bob, 2, 4, darken(color, 0.2), s);
    px(ctx, cx + 12 * s, cy + 12 * s + bob + armBob, 2, 4, darken(color, 0.2), s);
  } else {
    // Arms at sides
    px(ctx, cx + 2 * s, cy + 11 * s + bob, 2, 6, darken(color, 0.2), s);
    px(ctx, cx + 12 * s, cy + 11 * s + bob, 2, 6, darken(color, 0.2), s);
  }

  // Legs
  const legFrame = (activity !== 'idle' && activity !== 'sleeping') ? frame % 2 : 0;
  px(ctx, cx + 5 * s, cy + 18 * s, 2, 2, darken(color, 0.3), s);
  px(ctx, cx + 9 * s, cy + 18 * s, 2, 2, darken(color, 0.3), s);

  // Activity indicator icon above head
  drawActivityIcon(ctx, cx + 8 * s, cy - 4 * s + bob, activity, frame, s);
}

function drawThoughtBubble(ctx: CanvasRenderingContext2D, x: number, y: number, frame: number, s: number) {
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  // Small dots leading to bubble
  ctx.beginPath();
  ctx.arc(x - 2 * s, y + 4 * s, 1.5 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + s, y + s, 2 * s, 0, Math.PI * 2);
  ctx.fill();
  // Main bubble
  ctx.beginPath();
  ctx.arc(x + 4 * s, y - 2 * s, 4 * s, 0, Math.PI * 2);
  ctx.fill();
  // Dots inside
  const dotCount = (frame % 3) + 1;
  ctx.fillStyle = '#888';
  for (let i = 0; i < dotCount; i++) {
    ctx.beginPath();
    ctx.arc(x + (2 + i * 2) * s, y - 2 * s, 0.8 * s, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawZzz(ctx: CanvasRenderingContext2D, x: number, y: number, frame: number, s: number) {
  ctx.fillStyle = 'rgba(150,180,255,0.7)';
  ctx.font = `${Math.round(8 * s)}px monospace`;
  const zCount = (frame % 3) + 1;
  for (let i = 0; i < zCount; i++) {
    ctx.fillText('z', x + i * 4 * s, y - i * 5 * s);
  }
}

function drawActivityIcon(ctx: CanvasRenderingContext2D, x: number, y: number, activity: AgentActivity, frame: number, s: number) {
  ctx.font = `${Math.round(7 * s)}px monospace`;
  ctx.textAlign = 'center';

  switch (activity) {
    case 'coding':
      ctx.fillStyle = '#4ecca3';
      ctx.fillText('</>', x, y);
      break;
    case 'reading':
      ctx.fillStyle = '#f0c040';
      ctx.fillText('📖', x, y);
      break;
    case 'browsing':
      ctx.fillStyle = '#60a0f0';
      ctx.fillText('🌐', x, y);
      break;
    case 'running-cmd':
      ctx.fillStyle = '#4ecca3';
      ctx.fillText(frame % 2 === 0 ? '>_' : '>_|', x, y);
      break;
    case 'communicating':
      ctx.fillStyle = '#f070b0';
      ctx.fillText('💬', x, y);
      break;
    case 'error':
      ctx.fillStyle = '#ff3333';
      ctx.fillText('⚠', x, y);
      break;
    default:
      break;
  }
  ctx.textAlign = 'left';
}

// Draw a pixel-art desk
export function drawDesk(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  // Desk top
  ctx.fillStyle = '#8b6f47';
  ctx.fillRect(Math.round(x - 2 * s), Math.round(y + 14 * s), Math.round(20 * s), Math.round(4 * s));
  // Desk front
  ctx.fillStyle = '#6b5337';
  ctx.fillRect(Math.round(x - 2 * s), Math.round(y + 18 * s), Math.round(20 * s), Math.round(6 * s));
  // Legs
  ctx.fillStyle = '#5a4530';
  ctx.fillRect(Math.round(x - 1 * s), Math.round(y + 24 * s), Math.round(2 * s), Math.round(4 * s));
  ctx.fillRect(Math.round(x + 15 * s), Math.round(y + 24 * s), Math.round(2 * s), Math.round(4 * s));

  // Monitor on desk
  ctx.fillStyle = '#2a2a3e';
  ctx.fillRect(Math.round(x + 3 * s), Math.round(y + 6 * s), Math.round(10 * s), Math.round(8 * s));
  // Screen
  ctx.fillStyle = '#1a3a5a';
  ctx.fillRect(Math.round(x + 4 * s), Math.round(y + 7 * s), Math.round(8 * s), Math.round(6 * s));
  // Monitor stand
  ctx.fillStyle = '#2a2a3e';
  ctx.fillRect(Math.round(x + 7 * s), Math.round(y + 14 * s), Math.round(2 * s), Math.round(1 * s));
}

function darken(hex: string, amount: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const f = 1 - amount;
  return `rgb(${Math.round(r * f)},${Math.round(g * f)},${Math.round(b * f)})`;
}
