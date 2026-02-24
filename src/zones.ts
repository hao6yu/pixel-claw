import type { AgentState, FacingDirection, Zone, ZoneType, Waypoint } from './types';

// Virtual canvas dimensions
const VW = 320;
const VH = 256;
const WALL_H = 38;

// Legacy fallback-divider values (only used for non-Donarg fallback wall rendering)
const DIVIDER_X = 196;
const DIVIDER_Y = 142;

// Keep zone names stable for behavior logic, but anchor them to Donarg board regions.
export const ZONES: Record<ZoneType, Zone> = {
  'lead-office': {
    type: 'lead-office',
    x: 0, y: 142, w: 196, h: 114,
    floorType: 'carpet',
  },
  'main-floor': {
    type: 'main-floor',
    x: 0, y: 38, w: 196, h: 104,
    floorType: 'wood',
  },
  'break-room': {
    type: 'break-room',
    x: 196, y: 38, w: 124, h: 104,
    floorType: 'tile',
  },
  'sub-agent-zone': {
    type: 'sub-agent-zone',
    x: 196, y: 142, w: 124, h: 114,
    floorType: 'wood',
  },
};

export const LAYOUT = {
  VW,
  VH,
  WALL_H,
  DIVIDER_X,
  DIVIDER_Y,
  // Fallback-only desk layout constants (background-off mode)
  LEAD_DESK_X: 258,
  LEAD_DESK_Y: 232,
  MAIN_DESKS_PER_ROW: 3,
  MAIN_DESK_START_X: 66,
  MAIN_DESK_START_Y: 102,
  MAIN_DESK_SPACING_X: 52,
  MAIN_DESK_SPACING_Y: 38,
  BREAK_START_X: 236,
  BREAK_START_Y: 112,
  BREAK_SPACING_X: 18,
  SUB_START_X: 44,
  SUB_START_Y: 206,
  SUB_SPACING_X: 24,
  SUB_PER_ROW: 5,
  SUB_SPACING_Y: 22,
  DOORWAY_Y: WALL_H + 40,
  DOORWAY_H: 20,
};

const IDLE_BREAK_THRESHOLD = 30_000;
const WALK_SPEED = 20;
const NAV_CELL = 4;
const NAV_DEBUG = new URLSearchParams(window.location.search).has('navDebug') || localStorage.getItem('pixelclaw.navDebug') === '1';

type Cell = { cx: number; cy: number };
type Rect = { x: number; y: number; w: number; h: number };

type SeatRole = 'manager' | 'main' | 'sub' | 'break';

export type Seat = {
  id: string;
  zone: ZoneType;
  role: SeatRole;
  desk: { x: number; y: number };
  seat: { x: number; y: number; facing: FacingDirection };
};

// Donarg office board seat map (virtual 320x256 space).
// Coordinates are intentionally explicit and layout-driven for future tuning.
export const OFFICE_SEAT_MAP: Record<ZoneType, Seat[]> = {
  'lead-office': [
    {
      id: 'lead-manager-0',
      zone: 'lead-office',
      role: 'manager',
      desk: { x: 111, y: 214 },
      seat: { x: 111, y: 205, facing: 'left' },
    },
  ],

  'main-floor': [
    { id: 'main-0', zone: 'main-floor', role: 'main', desk: { x: 39, y: 76 }, seat: { x: 39, y: 85, facing: 'down' } },
    { id: 'main-1', zone: 'main-floor', role: 'main', desk: { x: 90, y: 76 }, seat: { x: 90, y: 85, facing: 'down' } },
    { id: 'main-2', zone: 'main-floor', role: 'main', desk: { x: 141, y: 76 }, seat: { x: 141, y: 85, facing: 'down' } },
    { id: 'main-3', zone: 'main-floor', role: 'main', desk: { x: 39, y: 122 }, seat: { x: 39, y: 131, facing: 'down' } },
    { id: 'main-4', zone: 'main-floor', role: 'main', desk: { x: 90, y: 122 }, seat: { x: 90, y: 131, facing: 'down' } },
    { id: 'main-5', zone: 'main-floor', role: 'main', desk: { x: 141, y: 122 }, seat: { x: 141, y: 131, facing: 'down' } },
  ],

  // Sub-agent work area has one dedicated desk/chair pair on this board.
  'sub-agent-zone': [
    {
      id: 'sub-0',
      zone: 'sub-agent-zone',
      role: 'sub',
      desk: { x: 244, y: 223 },
      seat: { x: 244, y: 232, facing: 'down' },
    },
  ],

  // Break room uses visible meeting-table chairs.
  'break-room': [
    {
      id: 'break-0',
      zone: 'break-room',
      role: 'break',
      desk: { x: 257, y: 90 },
      seat: { x: 257, y: 76, facing: 'up' },
    },
    {
      id: 'break-1',
      zone: 'break-room',
      role: 'break',
      desk: { x: 286, y: 90 },
      seat: { x: 286, y: 76, facing: 'up' },
    },
    {
      id: 'break-2',
      zone: 'break-room',
      role: 'break',
      desk: { x: 257, y: 100 },
      seat: { x: 242, y: 108, facing: 'right' },
    },
    {
      id: 'break-3',
      zone: 'break-room',
      role: 'break',
      desk: { x: 271, y: 100 },
      seat: { x: 288, y: 108, facing: 'left' },
    },
  ],
};

const ALL_SEATS: Seat[] = [
  ...OFFICE_SEAT_MAP['lead-office'],
  ...OFFICE_SEAT_MAP['main-floor'],
  ...OFFICE_SEAT_MAP['sub-agent-zone'],
  ...OFFICE_SEAT_MAP['break-room'],
];

const SEAT_MAP = new Map(ALL_SEATS.map((seat) => [seat.id, seat] as const));

class NavigationGrid {
  readonly cellSize = NAV_CELL;
  readonly width = Math.ceil(VW / NAV_CELL);
  readonly height = Math.ceil(VH / NAV_CELL);
  private walkable: boolean[] = new Array(this.width * this.height).fill(false);

  constructor() {
    this.rebuild();
  }

  rebuild(): void {
    this.walkable.fill(false);

    // Interior floor region of board; keep hard boundary so agents cannot leave board.
    this.fillRect(6, 6, VW - 12, VH - 12, true);

    const blockers: Rect[] = [
      // Top wall fixtures
      { x: 8, y: 10, w: 146, h: 20 },
      { x: 196, y: 10, w: 118, h: 20 },

      // Main-floor 6 desks
      { x: 25, y: 58, w: 28, h: 18 },
      { x: 76, y: 58, w: 28, h: 18 },
      { x: 127, y: 58, w: 28, h: 18 },
      { x: 25, y: 104, w: 28, h: 18 },
      { x: 76, y: 104, w: 28, h: 18 },
      { x: 127, y: 104, w: 28, h: 18 },

      // Break-room tables
      { x: 247, y: 80, w: 48, h: 18 },
      { x: 250, y: 100, w: 40, h: 18 },

      // Lead-office desk
      { x: 102, y: 206, w: 46, h: 18 },

      // Lounge + decor
      { x: 18, y: 186, w: 40, h: 10 },
      { x: 157, y: 182, w: 40, h: 14 },
      { x: 130, y: 242, w: 40, h: 10 },

      // Sub-agent desk and lower-right fixtures
      { x: 229, y: 214, w: 28, h: 18 },
      { x: 203, y: 152, w: 108, h: 20 },
      { x: 282, y: 236, w: 30, h: 16 },
    ];

    for (const block of blockers) {
      this.blockRect(block.x, block.y, block.w, block.h);
    }

    // Ensure every seat tile is valid walk target.
    for (const seat of ALL_SEATS) {
      this.fillRect(seat.seat.x - 1, seat.seat.y - 1, 3, 3, true);
    }
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
    return {
      x: Math.round(cell.cx * this.cellSize + this.cellSize / 2),
      y: Math.round(cell.cy * this.cellSize + this.cellSize / 2),
    };
  }

  clampToNearestWalkable(x: number, y: number): Waypoint {
    const start = this.toCell(x, y);
    if (this.isWalkableCell(start.cx, start.cy)) return this.toPoint(start);

    const q: Cell[] = [start];
    const seen = new Set([`${start.cx},${start.cy}`]);
    while (q.length > 0) {
      const cur = q.shift()!;
      for (const next of [
        { cx: cur.cx + 1, cy: cur.cy },
        { cx: cur.cx - 1, cy: cur.cy },
        { cx: cur.cx, cy: cur.cy + 1 },
        { cx: cur.cx, cy: cur.cy - 1 },
      ]) {
        if (next.cx < 0 || next.cx >= this.width || next.cy < 0 || next.cy >= this.height) continue;
        const key = `${next.cx},${next.cy}`;
        if (seen.has(key)) continue;
        if (this.isWalkableCell(next.cx, next.cy)) return this.toPoint(next);
        seen.add(key);
        q.push(next);
      }
    }

    return {
      x: Math.max(0, Math.min(VW - 1, Math.round(x))),
      y: Math.max(0, Math.min(VH - 1, Math.round(y))),
    };
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

    while (q.length > 0) {
      const cur = q.shift()!;
      if (cur.cx === goal.cx && cur.cy === goal.cy) break;

      for (const next of [
        { cx: cur.cx + 1, cy: cur.cy },
        { cx: cur.cx - 1, cy: cur.cy },
        { cx: cur.cx, cy: cur.cy + 1 },
        { cx: cur.cx, cy: cur.cy - 1 },
      ]) {
        if (!this.isWalkableCell(next.cx, next.cy)) continue;
        const nextKey = `${next.cx},${next.cy}`;
        if (seen.has(nextKey)) continue;
        seen.add(nextKey);
        parent.set(nextKey, `${cur.cx},${cur.cy}`);
        q.push(next);
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
    const points = pathCells.map((cell) => this.toPoint(cell));
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
        ctx.fillRect(
          Math.round(cx * this.cellSize * s),
          Math.round(cy * this.cellSize * s),
          Math.ceil(this.cellSize * s),
          Math.ceil(this.cellSize * s),
        );
      }
    }
    ctx.restore();
  }

  private fillRect(x: number, y: number, w: number, h: number, value: boolean): void {
    const c0 = this.toCell(x, y);
    const c1 = this.toCell(x + Math.max(0, w - 1), y + Math.max(0, h - 1));
    for (let cy = c0.cy; cy <= c1.cy; cy++) {
      for (let cx = c0.cx; cx <= c1.cx; cx++) {
        this.walkable[cy * this.width + cx] = value;
      }
    }
  }

  private blockRect(x: number, y: number, w: number, h: number): void {
    this.fillRect(x, y, w, h, false);
  }
}

export class ZoneManager {
  private leadAgentId: string | null = null;
  private nav = new NavigationGrid();

  assignZone(agent: AgentState, allMainAgents: AgentState[]): ZoneType {
    if (agent.isSubAgent) return 'sub-agent-zone';

    const now = Date.now();
    if (agent.activity === 'sleeping' || (agent.activity === 'idle' && now - agent.lastActiveAt > IDLE_BREAK_THRESHOLD)) {
      return 'break-room';
    }

    if (this.isLeadAgent(agent, allMainAgents)) return 'lead-office';
    return 'main-floor';
  }

  private isLeadAgent(agent: AgentState, allMainAgents: AgentState[]): boolean {
    if (agent.isSubAgent) return false;
    if (agent.agentId.toLowerCase().includes('max') || agent.agentId.toLowerCase().includes('main')) return true;

    if (!this.leadAgentId) {
      this.leadAgentId =
        allMainAgents.find((a) => a.agentId.toLowerCase().includes('main'))?.agentId ||
        allMainAgents[0]?.agentId ||
        null;
    }

    return agent.agentId === this.leadAgentId;
  }

  private seatsForZone(zone: ZoneType): Seat[] {
    return OFFICE_SEAT_MAP[zone];
  }

  private chooseSeat(agent: AgentState, zone: ZoneType, occupied: Set<string>): Seat {
    const seats = this.seatsForZone(zone);
    const previous = agent.assignedSeatId ? SEAT_MAP.get(agent.assignedSeatId) : undefined;

    if (previous && previous.zone === zone && !occupied.has(previous.id)) {
      occupied.add(previous.id);
      return previous;
    }

    const freeSeats = seats.filter((seat) => !occupied.has(seat.id));
    const pool = freeSeats.length > 0 ? freeSeats : seats;

    // deterministic assignment by agent key hash (stable baseline)
    const seed = `${agent.agentId}:${agent.sessionKey}`;
    const hash = Math.abs(seed.split('').reduce((acc, ch) => ((acc * 33) ^ ch.charCodeAt(0)) | 0, 5381));
    const chosen = pool[hash % pool.length];

    occupied.add(chosen.id);
    return chosen;
  }

  update(agents: Map<string, AgentState>, dt: number): void {
    const allAgents = Array.from(agents.values());
    const mainAgents = allAgents.filter((agent) => !agent.isSubAgent);
    const occupied = new Set<string>();

    for (const agent of allAgents) {
      const newZone = this.assignZone(agent, mainAgents);
      const seat = this.chooseSeat(agent, newZone, occupied);
      const target = this.nav.clampToNearestWalkable(seat.seat.x, seat.seat.y);

      const changedTarget =
        agent.targetX === undefined ||
        agent.targetY === undefined ||
        Math.abs(agent.targetX - target.x) > 0.5 ||
        Math.abs(agent.targetY - target.y) > 0.5;

      agent.assignedSeatId = seat.id;
      agent.targetX = target.x;
      agent.targetY = target.y;

      if (!agent.zone) {
        agent.zone = newZone;
      }

      // First spawn: place directly at seat and avoid spawn jitter.
      if (agent.x === 0 && agent.y === 0) {
        agent.x = target.x;
        agent.y = target.y;
        agent.zone = newZone;
      }

      const shouldWalk =
        agent.activity !== 'walking' &&
        (agent.zone !== newZone || changedTarget || Math.hypot(agent.x - target.x, agent.y - target.y) > 2);

      if (shouldWalk) {
        agent.targetZone = newZone;
        agent.previousActivity = agent.activity;
        agent.activity = 'walking';
        agent.seated = false;
        agent.walkPath = this.nav.findPath(agent.x, agent.y, target.x, target.y);
        agent.walkIndex = 0;
      }

      if (agent.activity === 'walking' && agent.walkPath && agent.walkIndex !== undefined) {
        const waypoint = agent.walkPath[agent.walkIndex];
        if (waypoint) {
          const dx = waypoint.x - agent.x;
          const dy = waypoint.y - agent.y;
          const dist = Math.hypot(dx, dy);
          const step = WALK_SPEED * dt;

          if (Math.abs(dx) > Math.abs(dy)) {
            agent.facing = dx >= 0 ? 'right' : 'left';
          } else if (Math.abs(dy) > 0.1) {
            agent.facing = dy >= 0 ? 'down' : 'up';
          }

          if (dist <= step || dist < 0.001) {
            agent.x = waypoint.x;
            agent.y = waypoint.y;
            agent.walkIndex += 1;

            if (agent.walkIndex >= agent.walkPath.length) {
              agent.zone = agent.targetZone || newZone;
              agent.activity = agent.previousActivity || 'idle';
              agent.walkPath = undefined;
              agent.walkIndex = undefined;
              agent.previousActivity = undefined;
              agent.targetZone = undefined;
            }
          } else {
            agent.x += (dx / dist) * step;
            agent.y += (dy / dist) * step;
          }
        }
      }

      const corrected = this.nav.clampToNearestWalkable(agent.x, agent.y);
      agent.x = corrected.x;
      agent.y = corrected.y;

      agent.seated = agent.activity !== 'walking' && agent.activity !== 'sleeping' && agent.zone !== 'break-room';
      if (agent.seated) {
        // while seated, face exactly with chair orientation
        agent.facing = seat.seat.facing;
      }

      agent.renderLayerY = agent.seated ? agent.y - 2 : agent.y + 20;

      if (agent.isSubAgent && agent.spawnAlpha === undefined) {
        agent.spawnAlpha = 0;
      }
      if (agent.isSubAgent && agent.spawnAlpha !== undefined && agent.spawnAlpha < 1) {
        agent.spawnAlpha = Math.min(1, agent.spawnAlpha + dt * 2);
      }
    }
  }

  drawNavDebug(ctx: CanvasRenderingContext2D, s: number): void {
    this.nav.debugDraw(ctx, s);
  }

  resetLeadAgent(): void {
    this.leadAgentId = null;
  }
}
