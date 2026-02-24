import type { Zone } from '../types';
import { VS } from '../visual-system';
import { getSheets } from '../sprite-loader';

const TILE = 17; // 16px tile + 1px spacing in kenney tiny-town packed sheet
const COLS = 12;

function drawTile(ctx: CanvasRenderingContext2D, index: number, dx: number, dy: number, size: number) {
  const sheets = getSheets();
  if (!sheets) return false;
  const sx = (index % COLS) * TILE;
  const sy = Math.floor(index / COLS) * TILE;
  ctx.drawImage(sheets.tilemap, sx, sy, 16, 16, dx, dy, size, size);
  return true;
}

function drawPattern(ctx: CanvasRenderingContext2D, zone: Zone, s: number, palette: number[]) {
  const x0 = Math.round(zone.x * s);
  const y0 = Math.round(zone.y * s);
  const w = Math.round(zone.w * s);
  const h = Math.round(zone.h * s);
  const step = 8 * s;
  for (let y = y0; y < y0 + h; y += step) {
    for (let x = x0; x < x0 + w; x += step) {
      const i = (Math.floor((x - x0) / step) + Math.floor((y - y0) / step)) % palette.length;
      drawTile(ctx, palette[i], x, y, step);
    }
  }
}

export function drawWoodFloor(ctx: CanvasRenderingContext2D, zone: Zone, s: number) {
  ctx.imageSmoothingEnabled = false;
  if (getSheets()) return drawPattern(ctx, zone, s, [60, 61, 72, 73]);
  const x0 = Math.round(zone.x * s);
  const y0 = Math.round(zone.y * s);
  ctx.fillStyle = '#8f6b47';
  ctx.fillRect(x0, y0, Math.round(zone.w * s), Math.round(zone.h * s));
}

export function drawCarpetFloor(ctx: CanvasRenderingContext2D, zone: Zone, s: number) {
  ctx.imageSmoothingEnabled = false;
  if (getSheets()) return drawPattern(ctx, zone, s, [108, 109, 120, 121]);
  const x0 = Math.round(zone.x * s);
  const y0 = Math.round(zone.y * s);
  ctx.fillStyle = '#355362';
  ctx.fillRect(x0, y0, Math.round(zone.w * s), Math.round(zone.h * s));
}

export function drawTileFloor(ctx: CanvasRenderingContext2D, zone: Zone, s: number) {
  ctx.imageSmoothingEnabled = false;
  if (getSheets()) return drawPattern(ctx, zone, s, [84, 85, 96, 97]);
  const x0 = Math.round(zone.x * s);
  const y0 = Math.round(zone.y * s);
  ctx.fillStyle = '#dfd5c2';
  ctx.fillRect(x0, y0, Math.round(zone.w * s), Math.round(zone.h * s));
}

export function drawWall(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, wallH: number, s: number) {
  const px = Math.round(x * s), py = Math.round(y * s), pw = Math.round(w * s), ph = Math.round(wallH * s);
  ctx.fillStyle = VS.palette.wall;
  ctx.fillRect(px, py, pw, ph);
  if (getSheets()) {
    for (let xx = px; xx < px + pw; xx += 8 * s) drawTile(ctx, 6, xx, py, 8 * s);
    for (let xx = px; xx < px + pw; xx += 8 * s) drawTile(ctx, 18, xx, py + ph - 8 * s, 8 * s);
  }
}

export function drawInteriorWall(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, s: number, doorwayX?: number, doorwayW?: number) {
  const px = Math.round(x * s), py = Math.round(y * s), pw = Math.round(w * s), ph = Math.round(h * s);
  if (doorwayX !== undefined && doorwayW !== undefined) {
    const dx = Math.round(doorwayX * s);
    const dw = Math.round(doorwayW * s);
    drawWallSection(ctx, px, py, dx - px, ph, s);
    drawWallSection(ctx, dx + dw, py, px + pw - (dx + dw), ph, s);
    return;
  }
  drawWallSection(ctx, px, py, pw, ph, s);
}

function drawWallSection(ctx: CanvasRenderingContext2D, px: number, py: number, pw: number, ph: number, s: number) {
  if (pw <= 0) return;
  ctx.fillStyle = VS.palette.wall;
  ctx.fillRect(px, py, pw, ph);
  if (getSheets()) {
    for (let xx = px; xx < px + pw; xx += 8 * s) drawTile(ctx, 30, xx, py, 8 * s);
  }
}

export function drawFloorForZone(ctx: CanvasRenderingContext2D, zone: Zone, s: number) {
  switch (zone.floorType) {
    case 'wood': return drawWoodFloor(ctx, zone, s);
    case 'carpet': return drawCarpetFloor(ctx, zone, s);
    case 'tile': return drawTileFloor(ctx, zone, s);
  }
}
