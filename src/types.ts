export type AgentActivity =
  | 'idle'
  | 'thinking'
  | 'coding'
  | 'reading'
  | 'browsing'
  | 'running-cmd'
  | 'communicating'
  | 'sleeping'
  | 'error';

export interface AgentState {
  sessionKey: string;
  label: string;
  activity: AgentActivity;
  lastActiveAt: number;
  model?: string;
  lastMessage?: string;
  runId?: string;
  // rendering
  x: number;
  y: number;
  deskIndex: number;
  color: string;
  animFrame: number;
  animTimer: number;
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
  label?: string;
  model?: string;
  state?: string;
}
