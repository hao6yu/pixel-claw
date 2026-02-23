import type { AgentState, Zone, ZoneType, Waypoint } from './types';

// Virtual canvas dimensions
const VW = 260;
const VH = 200;
const WALL_H = 28;

// Zone layout — all in virtual pixel coords
const DIVIDER_X = 100; // vertical wall between left/right
const DIVIDER_Y = 130; // horizontal wall between top/bottom

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
  // Lead office desk position
  LEAD_DESK_X: 30,
  LEAD_DESK_Y: WALL_H + 20,
  // Main floor desk grid
  MAIN_DESKS_PER_ROW: 3,
  MAIN_DESK_START_X: DIVIDER_X + 12,
  MAIN_DESK_START_Y: WALL_H + 10,
  MAIN_DESK_SPACING_X: 28,
  MAIN_DESK_SPACING_Y: 44,
  // Break room positions
  BREAK_START_X: 8,
  BREAK_START_Y: DIVIDER_Y + 10,
  BREAK_SPACING_X: 16,
  // Sub-agent zone
  SUB_START_X: DIVIDER_X + 10,
  SUB_START_Y: DIVIDER_Y + 10,
  SUB_SPACING_X: 22,
  SUB_PER_ROW: 6,
  SUB_SPACING_Y: 30,
  // Doorway in the vertical wall between lead office and main floor
  DOORWAY_Y: WALL_H + 40,
  DOORWAY_H: 20,
};

const IDLE_BREAK_THRESHOLD = 5 * 60_000; // 5 minutes
const WALK_SPEED = 30; // virtual pixels per second

export class ZoneManager {
  private leadAgentId: string | null = null;

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
      const zoneIdx = zoneCounters[newZone]++;
      const target = this.getTargetPosition(agent, newZone, zoneIdx);

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
        // Smooth snap for initial placement
        if (agent.x === 0 && agent.y === 0) {
          agent.x = target.x;
          agent.y = target.y;
        }
      }

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

  /** Simple waypoint path calculation */
  private calculatePath(agent: AgentState, target: { x: number; y: number }): Waypoint[] {
    const L = LAYOUT;
    const waypoints: Waypoint[] = [];

    // Simple corridor-based pathfinding
    const corridorY = L.DIVIDER_Y - 10;
    const corridorX = L.DIVIDER_X - 5;

    // Move to corridor first if crossing zones
    if (Math.abs(agent.y - target.y) > 20 || Math.abs(agent.x - target.x) > 40) {
      waypoints.push({ x: agent.x, y: corridorY });
      waypoints.push({ x: target.x, y: corridorY });
    }

    waypoints.push({ x: target.x, y: target.y });
    return waypoints;
  }

  resetLeadAgent(): void {
    this.leadAgentId = null;
  }
}
