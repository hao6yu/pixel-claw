import type { AgentState, FacingDirection, Zone, ZoneType, Waypoint } from './types';

// Virtual canvas dimensions
const VW = 320;
const VH = 256;
const WALL_H = 38;

// Zone layout tuned to curated Donarg crop composition
const DIVIDER_X = 196;
const DIVIDER_Y = 142;

export const ZONES: Record<ZoneType, Zone> = {
  'lead-office': {
    type: 'lead-office',
    x: 0, y: WALL_H, w: DIVIDER_X, h: DIVIDER_Y - WALL_H,
    floorType: 'carpet',
  },
  'main-floor': {
    type: 'main-floor',
    x: DIVIDER_X + 2, y: WALL_H, w: VW - DIVIDER_X - 2, h: DIVIDER_Y - WALL_H,
    floorType: 'wood',
  },
  'break-room': {
    type: 'break-room',
    x: 0, y: DIVIDER_Y + 2, w: DIVIDER_X, h: VH - DIVIDER_Y - 2,
    floorType: 'tile',
  },
  'sub-agent-zone': {
    type: 'sub-agent-zone',
    x: DIVIDER_X + 2, y: DIVIDER_Y + 2, w: VW - DIVIDER_X - 2, h: VH - DIVIDER_Y - 2,
    floorType: 'wood',
  },
};

export const LAYOUT = {
  VW,
  VH,
  WALL_H,
  DIVIDER_X,
  DIVIDER_Y,
  LEAD_DESK_X: 252,
  LEAD_DESK_Y: 206,
  MAIN_DESKS_PER_ROW: 3,
  MAIN_DESK_START_X: 44,
  MAIN_DESK_START_Y: 74,
  MAIN_DESK_SPACING_X: 52,
  MAIN_DESK_SPACING_Y: 38,
  BREAK_START_X: 226,
  BREAK_START_Y: 64,
  BREAK_SPACING_X: 18,
  SUB_START_X: 40,
  SUB_START_Y: 188,
  SUB_SPACING_X: 24,
  SUB_PER_ROW: 5,
  SUB_SPACING_Y: 24,
  DOORWAY_Y: WALL_H + 40,
  DOORWAY_H: 20,
};

const IDLE_BREAK_THRESHOLD = 30_000;
const WALK_SPEED = 20;
const NAV_CELL = 4;
const NAV_DEBUG = new URLSearchParams(window.location.search).has('navDebug') || localStorage.getItem('pixelclaw.navDebug') === '1';

type Cell = { cx: number; cy: number };
type Rect = { x: number; y: number; w: number; h: number };

type Seat = {
  id: string;
  zone: ZoneType;
  x: number;
  y: number;
  facing: FacingDirection;
  role?: 'manager' | 'main' | 'sub' | 'break';
};

const LEAD_SEAT: Seat = {
  id: 'lead-manager-seat',
  zone: 'lead-office',
  x: LAYOUT.LEAD_DESK_X,
  y: LAYOUT.LEAD_DESK_Y,
  facing: 'up',
  role: 'manager',
};

const MAIN_SEATS: Seat[] = Array.from({ length: 12 }, (_, i) => {
  const col = i % LAYOUT.MAIN_DESKS_PER_ROW;
  const row = Math.floor(i / LAYOUT.MAIN_DESKS_PER_ROW);
  return {
    id: `main-seat-${i}`,
    zone: 'main-floor' as const,
    x: LAYOUT.MAIN_DESK_START_X + col * LAYOUT.MAIN_DESK_SPACING_X,
    y: LAYOUT.MAIN_DESK_START_Y + row * LAYOUT.MAIN_DESK_SPACING_Y,
    facing: 'up' as const,
    role: 'main' as const,
  };
});

const SUB_SEATS: Seat[] = Array.from({ length: 12 }, (_, i) => {
  const col = i % LAYOUT.SUB_PER_ROW;
  const row = Math.floor(i / LAYOUT.SUB_PER_ROW);
  return {
    id: `sub-seat-${i}`,
    zone: 'sub-agent-zone' as const,
    x: LAYOUT.SUB_START_X + col * LAYOUT.SUB_SPACING_X,
    y: LAYOUT.SUB_START_Y + row * LAYOUT.SUB_SPACING_Y,
    facing: 'up' as const,
    role: 'sub' as const,
  };
});

const BREAK_SEATS: Seat[] = [
  { id: 'break-seat-0', zone: 'break-room', x: LAYOUT.BREAK_START_X, y: LAYOUT.BREAK_START_Y + 10, facing: 'down', role: 'break' },
  { id: 'break-seat-1', zone: 'break-room', x: LAYOUT.BREAK_START_X + LAYOUT.BREAK_SPACING_X, y: LAYOUT.BREAK_START_Y + 10, facing: 'down', role: 'break' },
  { id: 'break-seat-2', zone: 'break-room', x: LAYOUT.BREAK_START_X + LAYOUT.BREAK_SPACING_X * 2, y: LAYOUT.BREAK_START_Y + 10, facing: 'left', role: 'break' },
  { id: 'break-seat-3', zone: 'break-room', x: LAYOUT.BREAK_START_X + LAYOUT.BREAK_SPACING_X * 3, y: LAYOUT.BREAK_START_Y + 10, facing: 'right', role: 'break' },
];

const ALL_SEATS: Seat[] = [LEAD_SEAT, ...MAIN_SEATS, ...SUB_SEATS, ...BREAK_SEATS];
const SEAT_MAP = new Map(ALL_SEATS.map(s => [s.id, s] as const));

class NavigationGrid {
  readonly cellSize = NAV_CELL;
  readonly width = Math.ceil(VW / NAV_CELL);
  readonly height = Math.ceil(VH / NAV_CELL);
  private walkable: boolean[] = new Array(this.width * this.height).fill(false);

  constructor() { this.rebuild(); }

  rebuild(): void {
    this.walkable.fill(false);
    for (const zone of Object.values(ZONES)) this.fillRect(zone.x, zone.y, zone.w, zone.h, true);

    this.blockRect(0, 0, VW, WALL_H);
    this.blockRect(DIVIDER_X, WALL_H, 2, LAYOUT.DOORWAY_Y - WALL_H);
    this.blockRect(DIVIDER_X, LAYOUT.DOORWAY_Y + LAYOUT.DOORWAY_H, 2, DIVIDER_Y - (LAYOUT.DOORWAY_Y + LAYOUT.DOORWAY_H));
    this.blockRect(0, DIVIDER_Y, VW, 2);

    const blockers: Rect[] = [];
    for (const seat of MAIN_SEATS) blockers.push({ x: seat.x + 2, y: seat.y + 6, w: 28, h: 14 });
    blockers.push({ x: LEAD_SEAT.x + 2, y: LEAD_SEAT.y + 6, w: 28, h: 14 });

    const breakY = LAYOUT.DIVIDER_Y + 8;
    blockers.push({ x: LAYOUT.BREAK_START_X + 8, y: breakY + 2, w: 16, h: 30 });
    blockers.push({ x: LAYOUT.BREAK_START_X + 28, y: breakY + 2, w: 20, h: 34 });
    blockers.push({ x: LAYOUT.BREAK_START_X + 58, y: breakY + 10, w: 20, h: 24 });
    blockers.push({ x: LAYOUT.BREAK_START_X + 92, y: breakY + 26, w: 30, h: 14 });

    for (const b of blockers) this.blockRect(b.x, b.y, b.w, b.h);
  }

  isWalkableCell(cx: number, cy: number): boolean {
    return cx >= 0 && cx < this.width && cy >= 0 && cy < this.height && this.walkable[cy * this.width + cx];
  }

  toCell(x: number, y: number): Cell {
    return {
      cx: Math.max(0, Math.min(this.width - 1, Math.floor(x / this.cellSize))),
      cy: Math.max(0, Math.min(this.height - 1, Math.floor(y / this.cellSize))),
    };
  }

  toPoint(cell: Cell): Waypoint {
    return { x: Math.round(cell.cx * this.cellSize + this.cellSize / 2), y: Math.round(cell.cy * this.cellSize + this.cellSize / 2) };
  }

  clampToNearestWalkable(x: number, y: number): Waypoint {
    const start = this.toCell(x, y);
    if (this.isWalkableCell(start.cx, start.cy)) return this.toPoint(start);

    const q: Cell[] = [start];
    const seen = new Set([`${start.cx},${start.cy}`]);
    while (q.length) {
      const cur = q.shift()!;
      for (const n of [{ cx: cur.cx + 1, cy: cur.cy }, { cx: cur.cx - 1, cy: cur.cy }, { cx: cur.cx, cy: cur.cy + 1 }, { cx: cur.cx, cy: cur.cy - 1 }]) {
        if (n.cx < 0 || n.cx >= this.width || n.cy < 0 || n.cy >= this.height) continue;
        const key = `${n.cx},${n.cy}`;
        if (seen.has(key)) continue;
        if (this.isWalkableCell(n.cx, n.cy)) return this.toPoint(n);
        seen.add(key);
        q.push(n);
      }
    }
    return { x: Math.round(x), y: Math.round(y) };
  }

  findPath(startX: number, startY: number, endX: number, endY: number): Waypoint[] {
    const startPt = this.clampToNearestWalkable(startX, startY);
    const endPt = this.clampToNearestWalkable(endX, endY);
    const start = this.toCell(startPt.x, startPt.y);
    const goal = this.toCell(endPt.x, endPt.y);
    if (start.cx === goal.cx && start.cy === goal.cy) return [endPt];

    const q: Cell[] = [start];
    const parent = new Map<string, string>();
    const seen = new Set([`${start.cx},${start.cy}`]);

    while (q.length) {
      const cur = q.shift()!;
      if (cur.cx === goal.cx && cur.cy === goal.cy) break;
      for (const n of [{ cx: cur.cx + 1, cy: cur.cy }, { cx: cur.cx - 1, cy: cur.cy }, { cx: cur.cx, cy: cur.cy + 1 }, { cx: cur.cx, cy: cur.cy - 1 }]) {
        if (!this.isWalkableCell(n.cx, n.cy)) continue;
        const nKey = `${n.cx},${n.cy}`;
        if (seen.has(nKey)) continue;
        seen.add(nKey);
        parent.set(nKey, `${cur.cx},${cur.cy}`);
        q.push(n);
      }
    }

    const goalKey = `${goal.cx},${goal.cy}`;
    if (!seen.has(goalKey)) return [endPt];

    const pathCells: Cell[] = [];
    let curKey: string | undefined = goalKey;
    while (curKey) {
      const [cx, cy] = curKey.split(',').map(Number);
      pathCells.push({ cx, cy });
      if (curKey === `${start.cx},${start.cy}`) break;
      curKey = parent.get(curKey);
    }
    pathCells.reverse();
    const points = pathCells.map(c => this.toPoint(c));
    points[points.length - 1] = endPt;

    const simplified: Waypoint[] = [];
    for (let i = 0; i < points.length; i++) {
      if (i === 0 || i === points.length - 1) {
        simplified.push(points[i]);
        continue;
      }
      const a = points[i - 1];
      const b = points[i];
      const c = points[i + 1];
      const dx1 = Math.sign(b.x - a.x);
      const dy1 = Math.sign(b.y - a.y);
      const dx2 = Math.sign(c.x - b.x);
      const dy2 = Math.sign(c.y - b.y);
      if (dx1 !== dx2 || dy1 !== dy2) simplified.push(b);
    }
    return simplified;
  }

  debugDraw(ctx: CanvasRenderingContext2D, s: number): void {
    if (!NAV_DEBUG) return;
    ctx.save();
    for (let cy = 0; cy < this.height; cy++) {
      for (let cx = 0; cx < this.width; cx++) {
        const ok = this.isWalkableCell(cx, cy);
        ctx.fillStyle = ok ? 'rgba(80,220,120,0.18)' : 'rgba(220,70,70,0.10)';
        ctx.fillRect(Math.round(cx * this.cellSize * s), Math.round(cy * this.cellSize * s), Math.ceil(this.cellSize * s), Math.ceil(this.cellSize * s));
      }
    }
    ctx.restore();
  }

  private fillRect(x: number, y: number, w: number, h: number, value: boolean): void {
    const c0 = this.toCell(x, y);
    const c1 = this.toCell(x + Math.max(0, w - 1), y + Math.max(0, h - 1));
    for (let cy = c0.cy; cy <= c1.cy; cy++) {
      for (let cx = c0.cx; cx <= c1.cx; cx++) this.walkable[cy * this.width + cx] = value;
    }
  }
  private blockRect(x: number, y: number, w: number, h: number): void { this.fillRect(x, y, w, h, false); }
}

export class ZoneManager {
  private leadAgentId: string | null = null;
  private nav = new NavigationGrid();

  assignZone(agent: AgentState, allAgents: AgentState[]): ZoneType {
    if (agent.isSubAgent) return 'sub-agent-zone';
    const now = Date.now();
    if (agent.activity === 'sleeping' || (agent.activity === 'idle' && now - agent.lastActiveAt > IDLE_BREAK_THRESHOLD)) return 'break-room';
    if (this.isLeadAgent(agent, allAgents)) return 'lead-office';
    return 'main-floor';
  }

  private isLeadAgent(agent: AgentState, allAgents: AgentState[]): boolean {
    if (agent.isSubAgent) return false;
    if (agent.agentId.toLowerCase().includes('max') || agent.agentId.toLowerCase().includes('main')) return true;

    if (!this.leadAgentId) {
      const mainAgents = allAgents.filter(a => !a.isSubAgent);
      this.leadAgentId = mainAgents.find(a => a.agentId.toLowerCase().includes('main'))?.agentId || mainAgents[0]?.agentId || null;
    }
    return agent.agentId === this.leadAgentId;
  }

  private seatsForZone(zone: ZoneType): Seat[] {
    switch (zone) {
      case 'lead-office': return [LEAD_SEAT];
      case 'main-floor': return MAIN_SEATS;
      case 'sub-agent-zone': return SUB_SEATS;
      case 'break-room': return BREAK_SEATS;
    }
  }

  private chooseSeat(agent: AgentState, zone: ZoneType, occupied: Set<string>): Seat {
    const zoneSeats = this.seatsForZone(zone);
    const current = agent.assignedSeatId ? SEAT_MAP.get(agent.assignedSeatId) : undefined;
    if (current && current.zone === zone && !occupied.has(current.id)) {
      occupied.add(current.id);
      return current;
    }

    const free = zoneSeats.filter(s => !occupied.has(s.id));
    const pool = free.length ? free : zoneSeats;

    let chosen = pool[0];
    if (zone === 'lead-office') {
      chosen = LEAD_SEAT;
    } else if (zone === 'sub-agent-zone') {
      const hint = Math.abs(agent.agentId.split('').reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7));
      chosen = pool[hint % pool.length];
    }

    occupied.add(chosen.id);
    return chosen;
  }

  update(agents: Map<string, AgentState>, dt: number): void {
    const allAgents = Array.from(agents.values());
    const mainAgents = allAgents.filter(a => !a.isSubAgent);
    const occupied = new Set<string>();

    for (const agent of allAgents) {
      const newZone = this.assignZone(agent, mainAgents);
      const seat = this.chooseSeat(agent, newZone, occupied);
      const target = this.nav.clampToNearestWalkable(seat.x, seat.y);

      agent.assignedSeatId = seat.id;
      agent.targetX = target.x;
      agent.targetY = target.y;
      agent.facing = seat.facing;

      if (agent.zone && (agent.zone !== newZone || agent.activity === 'walking' && (Math.abs(agent.targetX - target.x) > 0.5 || Math.abs(agent.targetY - target.y) > 0.5)) && agent.activity !== 'walking') {
        agent.targetZone = newZone;
        agent.previousActivity = agent.activity;
        agent.activity = 'walking';
        agent.seated = false;
        agent.walkPath = this.calculatePath(agent, target);
        agent.walkIndex = 0;
      } else if (!agent.zone || agent.activity !== 'walking') {
        agent.zone = newZone;
        if (agent.x === 0 && agent.y === 0) {
          agent.x = target.x;
          agent.y = target.y;
        }
      }

      const corrected = this.nav.clampToNearestWalkable(agent.x, agent.y);
      agent.x = corrected.x;
      agent.y = corrected.y;

      if (agent.activity === 'walking' && agent.walkPath && agent.walkIndex !== undefined) {
        const wp = agent.walkPath[agent.walkIndex];
        if (wp) {
          const dx = wp.x - agent.x;
          const dy = wp.y - agent.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const step = WALK_SPEED * dt;

          if (Math.abs(dx) > Math.abs(dy)) agent.facing = dx >= 0 ? 'right' : 'left';
          else if (Math.abs(dy) > 0.1) agent.facing = dy >= 0 ? 'down' : 'up';

          if (dist <= step) {
            agent.x = wp.x;
            agent.y = wp.y;
            agent.walkIndex++;
            if (agent.walkIndex >= agent.walkPath.length) {
              agent.zone = agent.targetZone!;
              agent.activity = agent.previousActivity || 'idle';
              agent.walkPath = undefined;
              agent.walkIndex = undefined;
              agent.previousActivity = undefined;
              agent.targetZone = undefined;
              agent.facing = seat.facing;
            }
          } else {
            agent.x += (dx / dist) * step;
            agent.y += (dy / dist) * step;
          }
        }
      }

      agent.seated = agent.activity !== 'walking' && agent.activity !== 'sleeping' && agent.zone !== 'break-room';
      agent.renderLayerY = agent.seated ? agent.y - 2 : agent.y + 20;

      if (agent.isSubAgent && agent.spawnAlpha === undefined) agent.spawnAlpha = 0;
      if (agent.isSubAgent && agent.spawnAlpha !== undefined && agent.spawnAlpha < 1) {
        agent.spawnAlpha = Math.min(1, agent.spawnAlpha + dt * 2);
      }
    }
  }

  private calculatePath(agent: AgentState, target: { x: number; y: number }): Waypoint[] {
    return this.nav.findPath(agent.x, agent.y, target.x, target.y);
  }

  drawNavDebug(ctx: CanvasRenderingContext2D, s: number): void { this.nav.debugDraw(ctx, s); }
  resetLeadAgent(): void { this.leadAgentId = null; }
}
