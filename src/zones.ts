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
    x: 196, y: 142, w: 124, h: 114,
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
    x: 0, y: 142, w: 196, h: 114,
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

// Points of interest in the break room for idle wandering
const BREAK_ROOM_POIS: Array<{ x: number; y: number; name: string }> = [
  { x: 220, y: 55, name: 'coffee-machine' },    // top-right appliances
  { x: 250, y: 55, name: 'microwave' },          // near microwave
  { x: 290, y: 55, name: 'fridge' },             // fridge area
  { x: 210, y: 90, name: 'meeting-table' },      // meeting table
  { x: 270, y: 110, name: 'couch' },             // couch/lounge
  { x: 210, y: 65, name: 'water-cooler' },       // near water cooler/door
  { x: 260, y: 80, name: 'wander-center' },      // open floor
];
// Points of interest in the lead office for occasional wandering
const LEAD_OFFICE_POIS: Array<{ x: number; y: number; name: string }> = [
  { x: 220, y: 180, name: 'bookshelf' },
  { x: 290, y: 180, name: 'window' },
  { x: 260, y: 192, name: 'pacing' },
  { x: 280, y: 200, name: 'plant' },
  { x: 220, y: 238, name: 'couch' },
];
const WALK_SPEED = 40;
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
      desk: { x: 244, y: 214 },
      seat: { x: 244, y: 196, facing: 'up' },
    },
  ],

  'main-floor': [
    { id: 'main-0', zone: 'main-floor', role: 'main', desk: { x: 39, y: 76 }, seat: { x: 39, y: 64, facing: 'down' } },
    { id: 'main-1', zone: 'main-floor', role: 'main', desk: { x: 90, y: 76 }, seat: { x: 90, y: 64, facing: 'down' } },
    { id: 'main-2', zone: 'main-floor', role: 'main', desk: { x: 141, y: 76 }, seat: { x: 141, y: 64, facing: 'down' } },
    { id: 'main-3', zone: 'main-floor', role: 'main', desk: { x: 39, y: 122 }, seat: { x: 39, y: 110, facing: 'down' } },
    { id: 'main-4', zone: 'main-floor', role: 'main', desk: { x: 90, y: 122 }, seat: { x: 90, y: 110, facing: 'down' } },
    { id: 'main-5', zone: 'main-floor', role: 'main', desk: { x: 141, y: 122 }, seat: { x: 141, y: 110, facing: 'down' } },
  ],

  // Sub-agent work area has one dedicated desk/chair pair on this board.
  'sub-agent-zone': [
    {
      id: 'sub-0',
      zone: 'sub-agent-zone',
      role: 'sub',
      desk: { x: 111, y: 214 },
      seat: { x: 111, y: 196, facing: 'down' },
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
  private imageReady = false;

  constructor() {
    // Start with everything walkable until the image loads.
    this.walkable.fill(true);
  }

  /**
   * Build the walkability grid by sampling the background image pixels.
   * Renders the board region onto an offscreen canvas at exactly 320×256
   * so pixel positions match the virtual coordinate system perfectly.
   */
  rebuildFromImage(img: HTMLImageElement, srcRect: { x: number; y: number; w: number; h: number }): void {
    // Draw the board region at virtual resolution onto an offscreen canvas.
    const offscreen = document.createElement('canvas');
    offscreen.width = VW;
    offscreen.height = VH;
    const octx = offscreen.getContext('2d')!;
    octx.imageSmoothingEnabled = false;
    octx.drawImage(img, srcRect.x, srcRect.y, srcRect.w, srcRect.h, 0, 0, VW, VH);
    const imageData = octx.getImageData(0, 0, VW, VH);
    const px = imageData.data; // RGBA flat array, 4 bytes per pixel

    this.walkable.fill(false);

    // For each nav cell, sample a small area and classify as floor or obstacle.
    for (let cy = 0; cy < this.height; cy++) {
      for (let cx = 0; cx < this.width; cx++) {
        // Sample 4 points within the cell for robustness
        let floorVotes = 0;
        const samples = [
          { x: cx * NAV_CELL + 1, y: cy * NAV_CELL + 1 },
          { x: cx * NAV_CELL + 2, y: cy * NAV_CELL + 1 },
          { x: cx * NAV_CELL + 1, y: cy * NAV_CELL + 2 },
          { x: cx * NAV_CELL + 2, y: cy * NAV_CELL + 2 },
        ];

        for (const s of samples) {
          const px0 = Math.min(s.x, VW - 1);
          const py0 = Math.min(s.y, VH - 1);
          const idx = (py0 * VW + px0) * 4;
          const r = px[idx], g = px[idx + 1], b = px[idx + 2];
          if (this.isFloorColor(r, g, b)) floorVotes++;
        }

        // Cell is walkable if majority of samples are floor
        this.walkable[cy * this.width + cx] = floorVotes >= 2;
      }
    }

    // Hard boundary — agents must stay on the board
    for (let cy = 0; cy < this.height; cy++) {
      for (let cx = 0; cx < this.width; cx++) {
        if (cx < 1 || cx >= this.width - 1 || cy < 1 || cy >= this.height - 1) {
          this.walkable[cy * this.width + cx] = false;
        }
      }
    }

    // Structural wall blockers — walls that use floor-colored pixels and are
    // invisible to the color-based detection.  Added on top of the image grid.
    this.addStructuralWalls();

    // Ensure every seat tile is walkable and reachable from open floor.
    this.ensureSeatAccess();

    this.imageReady = true;
    this.validateConnectivity();
    console.log('[NavGrid] Rebuilt from background image');
  }

  /** Classify a pixel as walkable floor based on the Donarg office palette. */
  private isFloorColor(r: number, g: number, b: number): boolean {
    // Teal/cyan floor tiles: green and blue channels dominate over red.
    // Main floor, break room, and lead office all use variations of this palette.
    // The diamond-pattern floor tiles have these characteristics:
    //   - G >= R + 10 (distinctly more green than red)
    //   - B >= R + 10 (distinctly more blue than red)
    //   - Not too bright (walls are near-white: r>220, g>220, b>220)
    //   - Not too dark (furniture shadows: all channels < 50)
    const isTeal = g >= r + 10 && b >= r + 10 && g > 80 && b > 80 && r < 200;
    return isTeal;
  }

  /**
   * Add wall blockers for structural walls whose pixels are teal (floor-colored)
   * and therefore invisible to the image-based color detection.
   *
   * Pixel analysis findings:
   *   - Vertical wall body (x=196-204) is teal rgb(121,169,174).
   *     Dark edge at x=205 + white face at x=206-209 are caught by image scan.
   *     The teal body (cells 49-50) is NOT caught → needs structural blockers.
   *     The wall's dark edge only appears from y=79 downward.
   *     Above y=79 there is NO wall (= the doorway between main-floor ↔ break-room).
   *
   *   - Horizontal wall left side (y≈142, x=0..196) is entirely teal.
   *     Horizontal wall right side is caught by image scan (non-teal pixels at y≥141)
   *     with a natural doorway at x=264-279 (cells 66-69) for y=141-144.
   */
  private addStructuralWalls(): void {
    const vWallCx = Math.floor(DIVIDER_X / NAV_CELL); // cell 49

    // --- Vertical divider wall (teal body at cells 49-50) ---
    // Wall starts at y=79 where the dark edge appears in the art.
    // Above y=79 is the doorway opening (all teal, no wall visible).
    // The wall runs continuously from y=79 to the bottom of the board.
    // A narrow lower doorway at y≈168-184 provides sub-agent-zone ↔ lead-office access.
    for (let cy = Math.floor(79 / NAV_CELL); cy < this.height; cy++) {
      const yPx = cy * NAV_CELL;
      if (yPx >= 168 && yPx < 184) continue; // lower doorway
      for (let dx = 0; dx < 2; dx++) {
        this.walkable[cy * this.width + vWallCx + dx] = false;
      }
    }
    // Force-clear the image-detected dark edge (cell 51) inside the lower doorway
    // so agents have a full 3-cell-wide passage matching the upper doorway.
    for (let cy = Math.floor(168 / NAV_CELL); cy < Math.floor(184 / NAV_CELL); cy++) {
      this.walkable[cy * this.width + vWallCx + 2] = true;
    }

    // --- Horizontal divider walls ---
    // LEFT side: The visual wall is at y≈157 (dark edge + white/beige face), NOT at
    // DIVIDER_Y=142.  The image scan already catches it (non-teal pixels) with a
    // natural teal doorway at x≈155-190.  No structural blocker needed.
    //
    // RIGHT side: Also caught by image scan (non-teal at y≥141) with a natural
    // teal doorway at x=264-279 for y=141-144.  No structural blocker needed.

    // --- Top wall at y ≈ 38 (WALL_H) ---
    // Reinforce — image scan usually catches it but some teal pixels leak through.
    const topWallCy = Math.floor(WALL_H / NAV_CELL);
    for (let cx = 0; cx < this.width; cx++) {
      for (let dy = -1; dy <= 0; dy++) {
        const cy = topWallCy + dy;
        if (cy >= 0 && cy < this.height) this.walkable[cy * this.width + cx] = false;
      }
    }
  }

  /** Punch seat cells walkable and carve approach corridors to open floor. */
  private ensureSeatAccess(): void {
    const preSeats = this.walkable.slice();

    for (const seat of ALL_SEATS) {
      // Punch the seat cell itself
      this.fillRect(seat.seat.x - 2, seat.seat.y - 2, 5, 5, true);

      // Carve a corridor from the seat outward in the approach direction
      // (opposite of facing) until it reaches original walkable floor.
      const dir = seat.seat.facing;
      const dcx = dir === 'right' ? -1 : dir === 'left' ? 1 : 0;
      const dcy = dir === 'down' ? -1 : dir === 'up' ? 1 : 0;

      const startCell = this.toCell(seat.seat.x, seat.seat.y);
      let ccx = startCell.cx + dcx;
      let ccy = startCell.cy + dcy;

      for (let i = 0; i < 12; i++) {
        if (ccx < 0 || ccx >= this.width || ccy < 0 || ccy >= this.height) break;
        if (preSeats[ccy * this.width + ccx]) break;
        this.walkable[ccy * this.width + ccx] = true;
        ccx += dcx;
        ccy += dcy;
      }
    }
  }

  /** Log whether all seats are reachable via BFS from open floor. */
  private validateConnectivity(): void {
    const origin = this.toCell(100, 90);
    if (!this.isWalkableCell(origin.cx, origin.cy)) {
      // Find a nearby walkable cell as origin
      const alt = this.clampToNearestWalkable(100, 90);
      origin.cx = this.toCell(alt.x, alt.y).cx;
      origin.cy = this.toCell(alt.x, alt.y).cy;
    }
    const reachable = new Set<string>();
    const q: Cell[] = [origin];
    reachable.add(`${origin.cx},${origin.cy}`);
    while (q.length > 0) {
      const cur = q.shift()!;
      for (const next of [
        { cx: cur.cx + 1, cy: cur.cy },
        { cx: cur.cx - 1, cy: cur.cy },
        { cx: cur.cx, cy: cur.cy + 1 },
        { cx: cur.cx, cy: cur.cy - 1 },
      ]) {
        const key = `${next.cx},${next.cy}`;
        if (reachable.has(key)) continue;
        if (!this.isWalkableCell(next.cx, next.cy)) continue;
        reachable.add(key);
        q.push(next);
      }
    }

    console.log(`[NavGrid] Reachable cells: ${reachable.size} / ${this.walkable.filter(Boolean).length} walkable`);
    for (const seat of ALL_SEATS) {
      const cell = this.toCell(seat.seat.x, seat.seat.y);
      const key = `${cell.cx},${cell.cy}`;
      if (!reachable.has(key)) {
        console.warn(`[NavGrid] UNREACHABLE seat ${seat.id} at (${seat.seat.x},${seat.seat.y}) cell (${cell.cx},${cell.cy})`);
      }
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
    if (!seen.has(goalKey)) {
      console.warn(`[NavGrid] BFS FAILED from (${start.cx},${start.cy}) to (${goal.cx},${goal.cy}) — falling back to direct line`);
      return [endPt];
    }

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
        ctx.fillStyle = ok ? 'rgba(80,220,120,0.25)' : 'rgba(220,70,70,0.25)';
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

  /** Call once after the Donarg background image loads to build accurate nav grid. */
  setBackgroundImage(img: HTMLImageElement, srcRect: { x: number; y: number; w: number; h: number }): void {
    this.nav.rebuildFromImage(img, srcRect);
  }

  assignZone(agent: AgentState, allMainAgents: AgentState[]): ZoneType {
    if (agent.isSubAgent) return 'sub-agent-zone';

    const now = Date.now();
    if (agent.activity === 'sleeping' || (agent.activity === 'idle' && now - agent.lastActiveAt > 10_000)) {
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
      // Follow waypoint path — navigate around obstacles
      if (agent.activity === 'walking' && agent.walkPath && agent.walkPath.length > 0) {
        const wi = agent.walkIndex ?? 0;
        const wp = agent.walkPath[wi];
        const dx = wp.x - agent.x;
        const dy = wp.y - agent.y;
        const dist = Math.hypot(dx, dy);
        const step = WALK_SPEED * dt;

        if (dist > 1) {
          if (Math.abs(dx) >= Math.abs(dy)) {
            agent.facing = dx > 0 ? 'right' : 'left';
          } else {
            agent.facing = dy > 0 ? 'down' : 'up';
          }
        }

        if (dist <= step || dist < 0.5) {
          agent.x = wp.x;
          agent.y = wp.y;

          // Advance to next waypoint or finish
          if (wi + 1 < agent.walkPath.length) {
            agent.walkIndex = wi + 1;
          } else {
            // Reached final waypoint
            agent.walkPath = undefined;
            agent.walkIndex = undefined;
            agent.zone = agent.targetZone || agent.zone;
            agent.activity = agent.previousActivity || 'idle';
            agent.previousActivity = undefined;
            agent.targetZone = undefined;
          }
        } else {
          agent.x += (dx / dist) * step;
          agent.y += (dy / dist) * step;
        }

        agent.seated = false;
        agent.renderLayerY = agent.y + 20;
        continue;
      }
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

      const alreadyInBreakRoom = agent.zone === 'break-room' && newZone === 'break-room';
      const alreadyInLeadOffice = agent.zone === 'lead-office' && newZone === 'lead-office';
      const shouldWalk =
        agent.activity !== 'walking' &&
        !alreadyInBreakRoom &&
        !alreadyInLeadOffice &&
        (agent.zone !== newZone || changedTarget || Math.hypot(agent.x - target.x, agent.y - target.y) > 2);

      if (shouldWalk) {
        agent.targetZone = newZone;
        agent.targetX = target.x;
        agent.targetY = target.y;
        agent.previousActivity = agent.activity;
        agent.activity = 'walking';
        agent.seated = false;
        agent.walkPath = this.nav.findPath(agent.x, agent.y, target.x, target.y);
        agent.walkIndex = 0;
      }

      // No position clamping — direct movement handles positioning

      // Break-room idle wandering
      const inBreakIdle = agent.zone === 'break-room' && agent.activity !== 'walking' && agent.activity !== 'sleeping';
      if (inBreakIdle && agent.wanderTimer !== undefined && agent.wanderTimer < 0.1 && agent.wanderTimer > -0.1) {
      }
      if (inBreakIdle) {
        if (agent.wanderTimer === undefined) {
          agent.wanderTimer = 2 + Math.random() * 3; // 2-5 seconds before first wander
        }
        agent.wanderTimer -= dt;
        if (agent.wanderTimer <= 0) {
          // Pick a random POI
          const poi = BREAK_ROOM_POIS[Math.floor(Math.random() * BREAK_ROOM_POIS.length)];
          const dist = Math.hypot(poi.x - agent.x, poi.y - agent.y);
          if (dist > 8) {
            agent.previousActivity = agent.activity;
            agent.activity = 'walking';
            agent.seated = false;
            agent.targetX = poi.x;
            agent.targetY = poi.y;
            agent.walkPath = this.nav.findPath(agent.x, agent.y, poi.x, poi.y);
            agent.walkIndex = 0;
          }
          agent.wanderTimer = 3 + Math.random() * 6; // 3-9 seconds until next wander
        }
      } else if (agent.zone !== 'break-room' && agent.zone !== 'lead-office') {
        agent.wanderTimer = undefined;
      }

      // Lead-office occasional wandering (stretch legs, grab coffee from desk, look out window)
      const inLeadIdle = agent.zone === 'lead-office' && agent.activity !== 'walking' && agent.activity !== 'sleeping';
      if (inLeadIdle) {
        if (agent.wanderTimer === undefined) {
          agent.wanderTimer = 8 + Math.random() * 12; // 8-20s before first wander
        }
        agent.wanderTimer -= dt;
        if (agent.wanderTimer <= 0) {
          // 50% chance to wander to a POI, 50% chance to return to seat
          const atSeat = Math.hypot(agent.x - target.x, agent.y - target.y) < 8;
          if (atSeat) {
            const poi = LEAD_OFFICE_POIS[Math.floor(Math.random() * LEAD_OFFICE_POIS.length)];
            const dist = Math.hypot(poi.x - agent.x, poi.y - agent.y);
            if (dist > 8) {
              agent.previousActivity = agent.activity;
              agent.activity = 'walking';
              agent.seated = false;
              agent.targetX = poi.x;
              agent.targetY = poi.y;
              agent.walkPath = this.nav.findPath(agent.x, agent.y, poi.x, poi.y);
              agent.walkIndex = 0;
            }
          } else {
            // Walk back to seat
            agent.previousActivity = agent.activity;
            agent.activity = 'walking';
            agent.seated = false;
            agent.targetX = target.x;
            agent.targetY = target.y;
            agent.walkPath = this.nav.findPath(agent.x, agent.y, target.x, target.y);
            agent.walkIndex = 0;
          }
          agent.wanderTimer = 6 + Math.random() * 10; // 6-16s until next action
        }
      }

      agent.seated = agent.activity !== 'walking' && agent.activity !== 'sleeping' && agent.zone !== 'break-room' && !(agent.zone === 'lead-office' && Math.hypot(agent.x - target.x, agent.y - target.y) > 8);
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

  drawNavDebug(ctx: CanvasRenderingContext2D, s: number, agents?: Map<string, AgentState>): void {
    this.nav.debugDraw(ctx, s);

    // Draw active walk paths for all agents
    if (NAV_DEBUG && agents) {
      ctx.save();
      const colors = ['#ff0000', '#00ff00', '#0088ff', '#ff00ff', '#ffaa00', '#00ffff'];
      let ci = 0;
      for (const agent of agents.values()) {
        if (!agent.walkPath || agent.walkPath.length === 0) continue;
        const wi = agent.walkIndex ?? 0;
        const color = colors[ci++ % colors.length];

        // Draw path line
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(Math.round(agent.x * s), Math.round(agent.y * s));
        for (let i = wi; i < agent.walkPath.length; i++) {
          ctx.lineTo(Math.round(agent.walkPath[i].x * s), Math.round(agent.walkPath[i].y * s));
        }
        ctx.stroke();

        // Draw waypoint dots
        ctx.fillStyle = color;
        for (let i = wi; i < agent.walkPath.length; i++) {
          ctx.beginPath();
          ctx.arc(
            Math.round(agent.walkPath[i].x * s),
            Math.round(agent.walkPath[i].y * s),
            3, 0, Math.PI * 2,
          );
          ctx.fill();
        }
      }
      ctx.restore();
    }
  }

  resetLeadAgent(): void {
    this.leadAgentId = null;
  }
}
