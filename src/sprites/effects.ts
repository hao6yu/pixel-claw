import { pxAt } from '../utils';
import { pixelFont, VS } from '../visual-system';

export function drawZzz(ctx: CanvasRenderingContext2D, bx: number, by: number, time: number, s: number) {
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
  ctx.font = pixelFont(size);
  ctx.fillText(text, Math.round(x), Math.round(y));
}

export function drawThoughtBubble(ctx: CanvasRenderingContext2D, bx: number, by: number, time: number, s: number) {
  const dx = bx + 14;
  const dy = by + 1;
  pxAt(ctx, 0, 0, dx, dy, 2, 2, 'rgba(255,255,255,0.5)', s);
  pxAt(ctx, 0, 0, dx + 2, dy - 3, 2, 2, 'rgba(255,255,255,0.6)', s);

  const bubX = (dx + 3) * s;
  const bubY = (dy - 10) * s;
  const bubW = 14 * s;
  const bubH = 8 * s;
  ctx.fillStyle = VS.palette.bubble;
  ctx.fillRect(Math.round(bubX + s), Math.round(bubY), Math.round(bubW - 2 * s), Math.round(bubH));
  ctx.fillRect(Math.round(bubX), Math.round(bubY + s), Math.round(bubW), Math.round(bubH - 2 * s));
  ctx.fillStyle = VS.palette.bubbleBorder;
  ctx.fillRect(Math.round(bubX + s), Math.round(bubY), Math.round(bubW - 2 * s), Math.round(s));
  ctx.fillRect(Math.round(bubX + s), Math.round(bubY + bubH - s), Math.round(bubW - 2 * s), Math.round(s));
  ctx.fillRect(Math.round(bubX), Math.round(bubY + s), Math.round(s), Math.round(bubH - 2 * s));
  ctx.fillRect(Math.round(bubX + bubW - s), Math.round(bubY + s), Math.round(s), Math.round(bubH - 2 * s));

  const dotCount = (Math.floor(time * 2) % 3) + 1;
  ctx.fillStyle = '#6a6050';
  for (let i = 0; i < dotCount; i++) {
    ctx.fillRect(Math.round(bubX + (3 + i * 4) * s), Math.round(bubY + 3 * s), Math.round(2 * s), Math.round(2 * s));
  }
}

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

  ctx.font = pixelFont(7 * s);
  const tw = ctx.measureText(display).width;
  const padX = 3 * s;
  const bw = tw + padX * 2;
  const bh = 8 * s;
  const bx = Math.round(x - bw / 2);
  const by = Math.round(y - bh);

  ctx.fillStyle = VS.palette.bubble;
  ctx.fillRect(bx + s, by, bw - 2 * s, bh);
  ctx.fillRect(bx, by + s, bw, bh - 2 * s);
  ctx.fillStyle = VS.palette.bubbleBorder;
  ctx.fillRect(bx + s, by, bw - 2 * s, s);
  ctx.fillRect(bx + s, by + bh - s, bw - 2 * s, s);
  ctx.fillRect(bx, by + s, s, bh - 2 * s);
  ctx.fillRect(bx + bw - s, by + s, s, bh - 2 * s);
  // Tail
  ctx.fillStyle = VS.palette.bubble;
  ctx.fillRect(Math.round(x - s), by + bh, Math.round(2 * s), Math.round(2 * s));
  ctx.fillStyle = VS.palette.bubbleBorder;
  ctx.fillRect(Math.round(x - 2 * s), by + bh, Math.round(s), Math.round(s));
  ctx.fillRect(Math.round(x + s), by + bh, Math.round(s), Math.round(s));
  ctx.fillRect(Math.round(x - s), by + bh + s, Math.round(s), Math.round(s));

  ctx.fillStyle = VS.palette.panelDark;
  ctx.textAlign = 'center';
  ctx.fillText(display, Math.round(x), Math.round(by + bh - 2 * s));
  ctx.textAlign = 'left';
}
