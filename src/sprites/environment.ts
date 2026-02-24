import { darken, lighten } from '../utils';
import type { Zone } from '../types';
import { VS } from '../visual-system';

export function drawWoodFloor(ctx: CanvasRenderingContext2D, zone: Zone, s: number) {
  ctx.imageSmoothingEnabled = false;
  const plankW = 12 * s;
  const plankH = 4 * s;
  const baseColors = ['#8f6b47', '#7f5f3f', '#9b7652', '#74573b'];
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
      const base = baseColors[(Math.floor(x / plankW) + Math.floor(y / plankH)) & 3];
      ctx.fillStyle = base;
      ctx.fillRect(px, y, plankW, plankH);
      ctx.fillStyle = lighten(base, 0.08);
      ctx.fillRect(px, y, plankW, Math.round(s));
      ctx.fillStyle = darken(base, 0.16);
      ctx.fillRect(px + plankW - Math.round(s), y, Math.round(s), plankH);
    }
  }
  ctx.restore();
}

export function drawCarpetFloor(ctx: CanvasRenderingContext2D, zone: Zone, s: number) {
  const x0 = Math.round(zone.x * s);
  const y0 = Math.round(zone.y * s);
  const w = Math.round(zone.w * s);
  const h = Math.round(zone.h * s);
  ctx.fillStyle = '#355362';
  ctx.fillRect(x0, y0, w, h);
  ctx.fillStyle = 'rgba(255,255,255,0.05)';
  for (let y = y0; y < y0 + h; y += Math.round(4 * s)) {
    for (let x = x0 + ((y / Math.max(1, Math.round(2 * s))) % 2 ? Math.round(2 * s) : 0); x < x0 + w; x += Math.round(4 * s)) {
      ctx.fillRect(x, y, Math.round(s), Math.round(s));
    }
  }
}

export function drawTileFloor(ctx: CanvasRenderingContext2D, zone: Zone, s: number) {
  const x0 = Math.round(zone.x * s);
  const y0 = Math.round(zone.y * s);
  const w = Math.round(zone.w * s);
  const h = Math.round(zone.h * s);
  const tile = Math.round(8 * s);
  ctx.fillStyle = '#dfd5c2';
  ctx.fillRect(x0, y0, w, h);
  ctx.fillStyle = '#bfb6a4';
  for (let y = y0; y < y0 + h; y += tile) ctx.fillRect(x0, y, w, Math.max(1, Math.round(s)));
  for (let x = x0; x < x0 + w; x += tile) ctx.fillRect(x, y0, Math.max(1, Math.round(s)), h);
}

export function drawWall(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, wallH: number, s: number) {
  const px = Math.round(x * s), py = Math.round(y * s), pw = Math.round(w * s), ph = Math.round(wallH * s);
  ctx.fillStyle = VS.palette.wall;
  ctx.fillRect(px, py, pw, ph);
  ctx.fillStyle = VS.palette.wallTop;
  ctx.fillRect(px, py, pw, Math.round(3 * s));
  ctx.fillStyle = VS.palette.trim;
  ctx.fillRect(px, py + ph - Math.round(3 * s), pw, Math.round(3 * s));
  ctx.fillStyle = VS.palette.trimLight;
  ctx.fillRect(px, py + ph - Math.round(3 * s), pw, Math.round(s));
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
  ctx.fillStyle = VS.palette.wallTop;
  ctx.fillRect(px, py, pw, Math.round(s));
  ctx.fillStyle = VS.palette.trim;
  ctx.fillRect(px, py + ph - Math.round(s), pw, Math.round(s));
}

export function drawFloorForZone(ctx: CanvasRenderingContext2D, zone: Zone, s: number) {
  switch (zone.floorType) {
    case 'wood': return drawWoodFloor(ctx, zone, s);
    case 'carpet': return drawCarpetFloor(ctx, zone, s);
    case 'tile': return drawTileFloor(ctx, zone, s);
  }
}
