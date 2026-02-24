import type { AgentActivity, FacingDirection } from '../types';
import { hashNum } from '../utils';

const FRAME_W = 16;
const FRAME_H = 32;

const PALETTE_COUNT = 6;
const CHARACTER_SHEETS = Array.from({ length: PALETTE_COUNT }, (_, i) => `/assets/pixel-agents/characters/char_${i}.png`);

const sheetCache: Array<HTMLImageElement | null> = new Array(PALETTE_COUNT).fill(null);
const loading = new Set<number>();

function ensureSheet(index: number): HTMLImageElement | null {
  if (sheetCache[index]) return sheetCache[index];
  if (loading.has(index)) return null;

  loading.add(index);
  const img = new Image();
  img.onload = () => {
    sheetCache[index] = img;
    loading.delete(index);
  };
  img.onerror = () => {
    loading.delete(index);
  };
  img.src = CHARACTER_SHEETS[index];
  return null;
}

function getPaletteIndex(agentId: string): number {
  const id = agentId.toLowerCase();
  if (id.includes('cortana') || id.includes('02-threat-hunter') || id.includes('threat-hunter')) return 4;
  if (id.includes('chief') || id.includes('01-tech-lead') || id.includes('tech-lead')) return 1;
  if (id.includes('ghost') || id.includes('03-lore-keeper') || id.includes('lore-keeper')) return 5;
  if (id.includes('max') || id.includes('main') || id === 'default') return 0;
  return Math.abs(hashNum(agentId)) % PALETTE_COUNT;
}

function getFrameX(activity: AgentActivity, globalTime: number, seated: boolean): number {
  if (seated) {
    if (activity === 'coding' || activity === 'browsing' || activity === 'running-cmd' || activity === 'communicating') {
      return (Math.floor(globalTime * 5) % 2 === 0 ? 3 : 4) * FRAME_W;
    }
    if (activity === 'thinking') return 6 * FRAME_W;
    return 1 * FRAME_W;
  }

  switch (activity) {
    case 'walking': {
      const walk = Math.floor(globalTime * 8) % 4;
      return [0, 1, 2, 1][walk] * FRAME_W;
    }
    case 'coding':
    case 'browsing':
    case 'running-cmd':
      return (Math.floor(globalTime * 5) % 2 === 0 ? 3 : 4) * FRAME_W;
    case 'reading':
      return (Math.floor(globalTime * 2.5) % 2 === 0 ? 5 : 6) * FRAME_W;
    case 'thinking':
      return 6 * FRAME_W;
    case 'sleeping':
    case 'idle':
    default:
      return 1 * FRAME_W;
  }
}

function getRowY(facing: FacingDirection): number {
  if (facing === 'up') return FRAME_H;          // row 1 = back/up view
  if (facing === 'left' || facing === 'right') return FRAME_H * 2;  // row 2 = side profile
  return 0;                                      // row 0 = front/down view
}

export function drawCharacter(
  ctx: CanvasRenderingContext2D,
  baseX: number, baseY: number,
  _color: string,
  activity: AgentActivity,
  _frame: number,
  scale: number,
  agentId: string = 'default',
  globalTime: number = 0,
  _accessoryOverride?: number,
  seated: boolean = false,
  facing: FacingDirection = 'down',
) {
  ctx.imageSmoothingEnabled = false;

  const paletteIndex = getPaletteIndex(agentId);
  const sheet = ensureSheet(paletteIndex);
  if (!sheet) return;

  const frameX = getFrameX(activity, globalTime, seated);
  const rowY = getRowY(facing);
  // facing indicator removed
  const bob = activity === 'walking' ? Math.round(Math.abs(Math.sin(globalTime * 12)) * scale) : 0;
  const drawX = Math.round(baseX);
  const drawY = Math.round(baseY - bob);

  if (facing === 'left') {
    ctx.save();
    ctx.translate(drawX + Math.round(FRAME_W * scale), 0);
    ctx.scale(-1, 1);
    ctx.drawImage(sheet, frameX, rowY, FRAME_W, FRAME_H, 0, drawY, Math.round(FRAME_W * scale), Math.round(FRAME_H * scale));
    ctx.restore();
    return;
  }

  ctx.drawImage(
    sheet,
    frameX,
    rowY,
    FRAME_W,
    FRAME_H,
    drawX,
    drawY,
    Math.round(FRAME_W * scale),
    Math.round(FRAME_H * scale),
  );
}
