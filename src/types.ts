export type AgentActivity =
  | 'idle'
  | 'thinking'
  | 'coding'
  | 'reading'
  | 'browsing'
  | 'running-cmd'
  | 'communicating'
  | 'sleeping'
  | 'error'
  | 'walking';

export type ZoneType = 'lead-office' | 'main-floor' | 'break-room' | 'sub-agent-zone';

export interface Zone {
  type: ZoneType;
  x: number;
  y: number;
  w: number;
  h: number;
  floorType: 'carpet' | 'wood' | 'tile';
}

export interface Waypoint {
  x: number;
  y: number;
}

export interface AgentIdentity {
  agentId: string;
  name?: string;
  emoji?: string;
  avatar?: string;
}

export type FacingDirection = 'up' | 'down' | 'left' | 'right';

export interface AgentState {
  sessionKey: string;
  agentId: string;
  label: string;
  activity: AgentActivity;
  lastActiveAt: number;
  model?: string;
  lastMessage?: string;
  runId?: string;
  spawnedBy?: string;       // parent session key
  isSubAgent: boolean;
  identity?: AgentIdentity; // cached identity info
  // rendering
  x: number;
  y: number;
  deskIndex: number;
  color: string;
  animFrame: number;
  animTimer: number;
  // zone system
  zone?: ZoneType;
  targetZone?: ZoneType;
  targetX?: number;
  targetY?: number;
  walkPath?: Waypoint[];
  walkIndex?: number;
  previousActivity?: AgentActivity;
  accessory?: number; // 0=none, 1=glasses, 2=headphones, 3=hat
  spawnAlpha?: number; // for sub-agent fade in/out
  facing?: FacingDirection;
  assignedSeatId?: string;
  seated?: boolean;
  renderLayerY?: number;
  wanderTimer?: number;       // countdown until next wander
  wanderTarget?: Waypoint;    // current wander destination
}

export interface WsRequest {
  type: 'req';
  id: string;
  method: string;
  params?: Record<string, unknown>;
}

export interface WsResponse {
  type: 'res';
  id: string;
  ok: boolean;
  payload?: Record<string, unknown>;
  error?: { code: string; message: string };
}

export interface WsEvent {
  type: 'event';
  event: string;
  payload: Record<string, unknown>;
}

export type WsMessage = WsRequest | WsResponse | WsEvent;

export interface ChatEventPayload {
  runId: string;
  sessionKey: string;
  seq: number;
  state: 'delta' | 'final' | 'aborted' | 'error';
  message?: {
    role: string;
    content: unknown;
    model?: string;
  };
  usage?: Record<string, unknown>;
}

export interface SessionInfo {
  key: string;
  agentId?: string;
  label?: string;
  displayName?: string;
  model?: string;
  state?: string;
  spawnedBy?: string;
  lastMessage?: string;
  kind?: string;
}
