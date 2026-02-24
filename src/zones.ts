import type { AgentState, Zone, ZoneType, Waypoint } from './types';

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

// Layout constants
export const LAYOUT = {
  VW,
  VH,
  WALL_H,
  DIVIDER_X,
  DIVIDER_Y,
  // Manager office (Max) — right-side private office
  LEAD_DESK_X: 252,
  LEAD_DESK_Y: 206,
  // Open office workspace — center-left desk cluster
  MAIN_DESKS_PER_ROW: 3,
  MAIN_DESK_START_X: 44,
  MAIN_DESK_START_Y: 74,
  MAIN_DESK_SPACING_X: 52,
  MAIN_DESK_SPACING_Y: 38,
  // Break room/lounge — right upper pantry/table area
  BREAK_START_X: 226,
  BREAK_START_Y: 64,
  BREAK_SPACING_X: 18,
  // Meeting area — lower-left open room (per request)
  SUB_START_X: 40,
  SUB_START_Y: 188,
  SUB_SPACING_X: 24,
  SUB_PER_ROW: 5,
  SUB_SPACING_Y: 24,
  // Doorway in the vertical wall between lead office and main floor
  DOORWAY_Y: WALL_H + 40,
  DOORWAY_H: 20,
};

const IDLE_BREAK_THRESHOLD = 30_000; // 30 seconds (for testing, bump to 5*60_000 for prod)
const WALK_SPEED = 20; // virtual pixels per second (slower for smoother retro movement)
const NAV_CELL = 4;
const NAV_DEBUG = new URLSearchParams(window.location.search).has('navDebug') || localStorage.getItem('pixelclaw.navDebug') === '1';

type Cell = { cx: number; cy: number };
type Rect = { x: number; y: number; w: number; h: number };

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

    // 1) Only zone floor space is initially walkable (outside-office void remains blocked).
    for (const zone of Object.values(ZONES)) {
      this.fillRect(zone.x, zone.y, zone.w, zone.h, true);
    }

    // 2) Explicit structural walls and non-walkable features.
    this.blockRect(0, 0, VW, WALL_H); // top wall band
    this.blockRect(DIVIDER_X, WALL_H, 2, LAYOUT.DOORWAY_Y - WALL_H); // divider upper segment
    this.blockRect(DIVIDER_X, LAYOUT.DOORWAY_Y + LAYOUT.DOORWAY_H, 2, DIVIDER_Y - (LAYOUT.DOORWAY_Y + LAYOUT.DOORWAY_H)); // divider lower segment
    this.blockRect(0, DIVIDER_Y, VW, 2); // horizontal interior wall line

    // Furniture blockers (tunable rectangles in virtual board coordinates).
    const blockers: Rect[] = [];

    // Main desks (leave front edge open so agents can stand near desks).
    for (let i = 0; i < 12; i++) {
      const col = i % LAYOUT.MAIN_DESKS_PER_ROW;
      const row = Math.floor(i / LAYOUT.MAIN_DESKS_PER_ROW);
      const x = LAYOUT.MAIN_DESK_START_X + col * LAYOUT.MAIN_DESK_SPACING_X;
      const y = LAYOUT.MAIN_DESK_START_Y + row * LAYOUT.MAIN_DESK_SPACING_Y;
      blockers.push({ x: x + 2, y: y + 6, w: 28, h: 14 });
    }

    // Lead desk
    blockers.push({ x: LAYOUT.LEAD_DESK_X + 2, y: LAYOUT.LEAD_DESK_Y + 6, w: 28, h: 14 });

    // Break-room props
    const breakY = LAYOUT.DIVIDER_Y + 8;
    blockers.push({ x: LAYOUT.BREAK_START_X + 8, y: breakY + 2, w: 16, h: 30 }); // water cooler
    blockers.push({ x: LAYOUT.BREAK_START_X + 28, y: breakY + 2, w: 20, h: 34 }); // vending
    blockers.push({ x: LAYOUT.BREAK_START_X + 58, y: breakY + 10, w: 20, h: 24 }); // coffee
    blockers.push({ x: LAYOUT.BREAK_START_X + 92, y: breakY + 26, w: 30, h: 14 }); // couch footprint

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

    while (q.length) {
      const cur = q.shift()!;
      const dirs: Cell[] = [
        { cx: cur.cx + 1, cy: cur.cy },
        { cx: cur.cx - 1, cy: cur.cy },
        { cx: cur.cx, cy: cur.cy + 1 },
        { cx: cur.cx, cy: cur.cy - 1 },
      ];
      for (const n of dirs) {
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

      const dirs: Cell[] = [
        { cx: cur.cx + 1, cy: cur.cy },
        { cx: cur.cx - 1, cy: cur.cy },
        { cx: cur.cx, cy: cur.cy + 1 },
        { cx: cur.cx, cy: cur.cy - 1 },
      ];

      for (const n of dirs) {
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

    // Path compression: keep corners and destination only.
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
        const x = cx * this.cellSize;
        const y = cy * this.cellSize;
        const ok = this.isWalkableCell(cx, cy);
        ctx.fillStyle = ok ? 'rgba(80,220,120,0.18)' : 'rgba(220,70,70,0.10)';
        ctx.fillRect(Math.round(x * s), Math.round(y * s), Math.ceil(this.cellSize * s), Math.ceil(this.cellSize * s));
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

  /** Determine which zone an agent belongs to */
  assignZone(agent: AgentState, allAgents: AgentState[]): ZoneType {
    // Sub-agents always go to sub-agent zone
    if (agent.isSubAgent) return 'sub-agent-zone';

    // Sleeping or long-idle → break room
    const now = Date.now();
    if (agent.activity === 'sleeping' || (agent.activity === 'idle' && now - agent.lastActiveAt > IDLE_BREAK_THRESHOLD)) {
      return 'break-room';
    }

    // First main agent (or one with "main" in id) → lead office
    if (this.isLeadAgent(agent, allAgents)) {
      return 'lead-office';
    }

    return 'main-floor';
  }

  private isLeadAgent(agent: AgentState, allAgents: AgentState[]): boolean {
    if (agent.isSubAgent) return false;

    // Cache the lead agent ID
    if (!this.leadAgentId) {
      const mainAgents = allAgents.filter(a => !a.isSubAgent);
      // Prefer agent with "main" in the id
      const mainAgent = mainAgents.find(a => a.agentId.toLowerCase().includes('main'));
      this.leadAgentId = mainAgent?.agentId || mainAgents[0]?.agentId || null;
    }

    return agent.agentId === this.leadAgentId;
  }

  /** Get the target position for an agent in its assigned zone */
  getTargetPosition(agent: AgentState, zone: ZoneType, zoneIndex: number): { x: number; y: number } {
    const L = LAYOUT;
    switch (zone) {
      case 'lead-office':
        return { x: L.LEAD_DESK_X, y: L.LEAD_DESK_Y };
      case 'main-floor': {
        const col = zoneIndex % L.MAIN_DESKS_PER_ROW;
        const row = Math.floor(zoneIndex / L.MAIN_DESKS_PER_ROW);
        return {
          x: L.MAIN_DESK_START_X + col * L.MAIN_DESK_SPACING_X,
          y: L.MAIN_DESK_START_Y + row * L.MAIN_DESK_SPACING_Y,
        };
      }
      case 'break-room':
        return {
          x: L.BREAK_START_X + zoneIndex * L.BREAK_SPACING_X,
          y: L.BREAK_START_Y + 10,
        };
      case 'sub-agent-zone': {
        const col = zoneIndex % L.SUB_PER_ROW;
        const row = Math.floor(zoneIndex / L.SUB_PER_ROW);
        return {
          x: L.SUB_START_X + col * L.SUB_SPACING_X,
          y: L.SUB_START_Y + row * L.SUB_SPACING_Y,
        };
      }
    }
  }

  /** Update all agents — assign zones, compute positions, handle walking */
  update(agents: Map<string, AgentState>, dt: number): void {
    const allAgents = Array.from(agents.values());
    const mainAgents = allAgents.filter(a => !a.isSubAgent);

    // Zone-specific counters for positioning
    const zoneCounters: Record<ZoneType, number> = {
      'lead-office': 0,
      'main-floor': 0,
      'break-room': 0,
      'sub-agent-zone': 0,
    };

    for (const agent of allAgents) {
      const newZone = this.assignZone(agent, mainAgents);
      const rawTarget = this.getTargetPosition(agent, newZone, zoneCounters[newZone]++);
      const target = this.nav.clampToNearestWalkable(rawTarget.x, rawTarget.y);

      // If zone changed, start walking
      if (agent.zone && agent.zone !== newZone && agent.activity !== 'walking') {
        agent.targetZone = newZone;
        agent.targetX = target.x;
        agent.targetY = target.y;
        agent.previousActivity = agent.activity;
        agent.activity = 'walking';
        agent.walkPath = this.calculatePath(agent, target);
        agent.walkIndex = 0;
      } else if (!agent.zone || (agent.activity !== 'walking')) {
        // First assignment or not walking — snap to position
        agent.zone = newZone;
        agent.targetX = target.x;
        agent.targetY = target.y;

        // Initial placement: seat agents directly at their assigned chair/desk.
        if (agent.x === 0 && agent.y === 0) {
          agent.x = target.x;
          agent.y = target.y;
        }
      }

      // Keep active coordinates valid and in bounds.
      const corrected = this.nav.clampToNearestWalkable(agent.x, agent.y);
      agent.x = corrected.x;
      agent.y = corrected.y;

      // Process walking
      if (agent.activity === 'walking' && agent.walkPath && agent.walkIndex !== undefined) {
        const wp = agent.walkPath[agent.walkIndex];
        if (wp) {
          const dx = wp.x - agent.x;
          const dy = wp.y - agent.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const step = WALK_SPEED * dt;

          if (dist <= step) {
            agent.x = wp.x;
            agent.y = wp.y;
            agent.walkIndex!++;
            if (agent.walkIndex! >= agent.walkPath.length) {
              // Arrived
              agent.zone = agent.targetZone!;
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

      // Sub-agent spawn alpha
      if (agent.isSubAgent && agent.spawnAlpha === undefined) {
        agent.spawnAlpha = 0;
      }
      if (agent.isSubAgent && agent.spawnAlpha !== undefined && agent.spawnAlpha < 1) {
        agent.spawnAlpha = Math.min(1, agent.spawnAlpha + dt * 2);
      }
    }
  }

  /** Grid-constrained path calculation */
  private calculatePath(agent: AgentState, target: { x: number; y: number }): Waypoint[] {
    return this.nav.findPath(agent.x, agent.y, target.x, target.y);
  }

  drawNavDebug(ctx: CanvasRenderingContext2D, s: number): void {
    this.nav.debugDraw(ctx, s);
  }

  resetLeadAgent(): void {
    this.leadAgentId = null;
  }
}
