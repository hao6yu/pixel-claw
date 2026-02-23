import { darken, lighten } from '../utils';
import type { Zone } from '../types';
import { getSheets } from '../sprite-loader';
import { FURNITURE_ATLAS } from '../atlas';

/** Tile a floor sprite across a zone */
function tileFloorSprite(ctx: CanvasRenderingContext2D, zone: Zone, s: number, spriteKey: string): boolean {
  const sheets = getSheets();
  if (!sheets) return false;
  const rect = FURNITURE_ATLAS[spriteKey];
  if (!rect) return false;

  ctx.imageSmoothingEnabled = false;
  const x0 = Math.round(zone.x * s);
  const y0 = Math.round(zone.y * s);
  const w = Math.round(zone.w * s);
  const h = Math.round(zone.h * s);
  // Each tile sprite is ~152x138 in the sheet. Render as tileSize in virtual px.
  const tilePx = Math.round(24 * s); // tile size on screen

  ctx.save();
  ctx.beginPath();
  ctx.rect(x0, y0, w, h);
  ctx.clip();

  for (let y = y0; y < y0 + h; y += tilePx) {
    for (let x = x0; x < x0 + w; x += tilePx) {
      ctx.drawImage(sheets.furniture, rect.x, rect.y, rect.w, rect.h, x, y, tilePx, tilePx);
    }
  }
  ctx.restore();
  return true;
}

export function drawWoodFloor(ctx: CanvasRenderingContext2D, zone: Zone, s: number) {
  if (tileFloorSprite(ctx, zone, s, 'floor-wood-light')) return;
  ctx.imageSmoothingEnabled = false;
  const plankW = 12 * s;
  const plankH = 4 * s;
  const baseColors = ['#8a6f4e', '#7d6545', '#96785a', '#87694a'];
  const x0 = Math.round(zone.x * s);
  const y0 = Math.round(zone.y * s);
  const w = Math.round(zone.w * s);
  const h = Math.round(zone.h * s);

  ctx.save();
  ctx.beginPath();
  ctx.rect(x0, y0, w, h);
  ctx.clip();

  for (let y = y0; y < y0 + h; y += plankH) {
    const rowOffset = (Math.floor((y - y0) / plankH) % 2) * (plankW / 2);
    for (let x = x0 - plankW; x < x0 + w + plankW; x += plankW) {
      const px = Math.round(x + rowOffset);
      const py = Math.round(y);
      const colorIdx = (Math.floor((x + rowOffset) / plankW) * 3 + Math.floor(y / plankH) * 7) & 3;
      const base = baseColors[colorIdx];

      ctx.fillStyle = base;
      ctx.fillRect(px, py, plankW, plankH);
      // Top edge highlight (light from top-left)
      ctx.fillStyle = lighten(base, 0.08);
      ctx.fillRect(px, py, plankW, Math.round(s * 0.5));
      // Grain lines
      ctx.fillStyle = darken(base, 0.06);
      ctx.fillRect(px, py + Math.round(s), plankW, Math.round(s));
      ctx.fillRect(px, py + Math.round(3 * s), plankW, Math.round(s * 0.5));
      // Additional fine grain
      ctx.fillStyle = darken(base, 0.03);
      ctx.fillRect(px + Math.round(2 * s), py + Math.round(2 * s), Math.round(3 * s), Math.round(s * 0.5));
      ctx.fillRect(px + Math.round(7 * s), py + Math.round(s), Math.round(2 * s), Math.round(s * 0.5));
      // Right edge shadow (gap between planks)
      ctx.fillStyle = darken(base, 0.2);
      ctx.fillRect(px + plankW - Math.round(s * 0.5), py, Math.round(s * 0.5), plankH);
      // Bottom edge shadow
      ctx.fillStyle = darken(base, 0.12);
      ctx.fillRect(px, py + plankH - Math.round(s * 0.5), plankW, Math.round(s * 0.5));
    }
  }
  ctx.restore();
}

export function drawCarpetFloor(ctx: CanvasRenderingContext2D, zone: Zone, s: number) {
  if (tileFloorSprite(ctx, zone, s, 'floor-carpet')) return;
  ctx.imageSmoothingEnabled = false;
  const x0 = Math.round(zone.x * s);
  const y0 = Math.round(zone.y * s);
  const w = Math.round(zone.w * s);
  const h = Math.round(zone.h * s);

  // Base fill
  ctx.fillStyle = '#3a6068';
  ctx.fillRect(x0, y0, w, h);

  // Dither texture — subtle lighter dots in 4px grid
  ctx.fillStyle = 'rgba(255,255,255,0.04)';
  for (let y = y0; y < y0 + h; y += Math.round(4 * s)) {
    for (let x = x0; x < x0 + w; x += Math.round(4 * s)) {
      ctx.fillRect(x, y, Math.round(s), Math.round(s));
    }
  }
  // Additional offset dither
  ctx.fillStyle = 'rgba(255,255,255,0.03)';
  for (let y = y0 + Math.round(2 * s); y < y0 + h; y += Math.round(4 * s)) {
    for (let x = x0 + Math.round(2 * s); x < x0 + w; x += Math.round(4 * s)) {
      ctx.fillRect(x, y, Math.round(s), Math.round(s));
    }
  }

  // Darker border at edges — multi-pixel gradient for depth
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.fillRect(x0, y0, w, Math.round(s));
  ctx.fillRect(x0, y0 + h - Math.round(s), w, Math.round(s));
  ctx.fillRect(x0, y0, Math.round(s), h);
  ctx.fillRect(x0 + w - Math.round(s), y0, Math.round(s), h);
  ctx.fillStyle = 'rgba(0,0,0,0.08)';
  ctx.fillRect(x0 + Math.round(s), y0 + Math.round(s), w - Math.round(2 * s), Math.round(s));
  ctx.fillRect(x0 + Math.round(s), y0 + h - Math.round(2 * s), w - Math.round(2 * s), Math.round(s));
  ctx.fillRect(x0 + Math.round(s), y0 + Math.round(s), Math.round(s), h - Math.round(2 * s));
  ctx.fillRect(x0 + w - Math.round(2 * s), y0 + Math.round(s), Math.round(s), h - Math.round(2 * s));
  ctx.fillStyle = 'rgba(0,0,0,0.04)';
  ctx.fillRect(x0 + Math.round(2 * s), y0 + Math.round(2 * s), w - Math.round(4 * s), Math.round(s));
  ctx.fillRect(x0 + Math.round(2 * s), y0 + h - Math.round(3 * s), w - Math.round(4 * s), Math.round(s));
  ctx.fillRect(x0 + Math.round(2 * s), y0 + Math.round(2 * s), Math.round(s), h - Math.round(4 * s));
  ctx.fillRect(x0 + w - Math.round(3 * s), y0 + Math.round(2 * s), Math.round(s), h - Math.round(4 * s));
}

export function drawTileFloor(ctx: CanvasRenderingContext2D, zone: Zone, s: number) {
  if (tileFloorSprite(ctx, zone, s, 'floor-tile-beige')) return;
  ctx.imageSmoothingEnabled = false;
  const x0 = Math.round(zone.x * s);
  const y0 = Math.round(zone.y * s);
  const w = Math.round(zone.w * s);
  const h = Math.round(zone.h * s);
  const tileSize = Math.round(8 * s);

  ctx.save();
  ctx.beginPath();
  ctx.rect(x0, y0, w, h);
  ctx.clip();

  // Base
  ctx.fillStyle = '#e8e0d0';
  ctx.fillRect(x0, y0, w, h);

  // Grout lines with shadow
  ctx.fillStyle = '#c8c0b0';
  for (let y = y0; y < y0 + h; y += tileSize) {
    ctx.fillRect(x0, y + Math.round(s), w, Math.round(s * 0.5)); // shadow below grout
  }
  for (let x = x0; x < x0 + w; x += tileSize) {
    ctx.fillRect(x + Math.round(s), y0, Math.round(s * 0.5), h); // shadow right of grout
  }
  ctx.fillStyle = '#d0c8b8';
  for (let y = y0; y < y0 + h; y += tileSize) {
    ctx.fillRect(x0, y, w, Math.round(s));
  }
  for (let x = x0; x < x0 + w; x += tileSize) {
    ctx.fillRect(x, y0, Math.round(s), h);
  }

  // Diamond accent dots at intersections
  ctx.fillStyle = '#c8c0b0';
  for (let y = y0; y < y0 + h; y += tileSize) {
    for (let x = x0; x < x0 + w; x += tileSize) {
      ctx.fillRect(x - Math.round(s * 0.5), y, Math.round(s * 2), Math.round(s));
      ctx.fillRect(x, y - Math.round(s * 0.5), Math.round(s), Math.round(s * 2));
    }
  }

  ctx.restore();
}

export function drawWall(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, wallH: number, s: number) {
  ctx.imageSmoothingEnabled = false;
  const px = Math.round(x * s);
  const py = Math.round(y * s);
  const pw = Math.round(w * s);
  const ph = Math.round(wallH * s);

  // Main wall
  ctx.fillStyle = '#4a4450';
  ctx.fillRect(px, py, pw, ph);
  // Darker top
  ctx.fillStyle = '#3a3440';
  ctx.fillRect(px, py, pw, Math.round(4 * s));
  // Baseboard
  ctx.fillStyle = '#5a4535';
  ctx.fillRect(px, py + ph - Math.round(3 * s), pw, Math.round(3 * s));
  ctx.fillStyle = '#6b5545';
  ctx.fillRect(px, py + ph - Math.round(3 * s), pw, Math.round(s));
  // Shadow below wall
  const grad = ctx.createLinearGradient(px, py + ph, px, py + ph + Math.round(2 * s));
  grad.addColorStop(0, 'rgba(0,0,0,0.15)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(px, py + ph, pw, Math.round(2 * s));
}

export function drawInteriorWall(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, s: number, doorwayX?: number, doorwayW?: number) {
  ctx.imageSmoothingEnabled = false;
  const px = Math.round(x * s);
  const py = Math.round(y * s);
  const pw = Math.round(w * s);
  const ph = Math.round(h * s);

  if (doorwayX !== undefined && doorwayW !== undefined) {
    const doorPx = Math.round(doorwayX * s);
    const doorPw = Math.round(doorwayW * s);

    // Left section
    drawWallSection(ctx, px, py, doorPx - px, ph, s);
    // Right section
    drawWallSection(ctx, doorPx + doorPw, py, px + pw - (doorPx + doorPw), ph, s);
  } else {
    drawWallSection(ctx, px, py, pw, ph, s);
  }
}

function drawWallSection(ctx: CanvasRenderingContext2D, px: number, py: number, pw: number, ph: number, s: number) {
  if (pw <= 0) return;
  ctx.fillStyle = '#4a4450';
  ctx.fillRect(px, py, pw, ph);
  ctx.fillStyle = '#3a3440';
  ctx.fillRect(px, py, pw, Math.round(2 * s));
  ctx.fillStyle = '#5a4535';
  ctx.fillRect(px, py + ph - Math.round(2 * s), pw, Math.round(2 * s));
  ctx.fillStyle = '#6b5545';
  ctx.fillRect(px, py + ph - Math.round(2 * s), pw, Math.round(s));
  // Shadow
  const grad = ctx.createLinearGradient(px, py + ph, px, py + ph + Math.round(2 * s));
  grad.addColorStop(0, 'rgba(0,0,0,0.15)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(px, py + ph, pw, Math.round(2 * s));
}

export function drawFloorForZone(ctx: CanvasRenderingContext2D, zone: Zone, s: number) {
  switch (zone.floorType) {
    case 'wood': drawWoodFloor(ctx, zone, s); break;
    case 'carpet': drawCarpetFloor(ctx, zone, s); break;
    case 'tile': drawTileFloor(ctx, zone, s); break;
  }
}
