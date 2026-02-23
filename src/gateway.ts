import type { WsMessage, WsResponse, ChatEventPayload, SessionInfo } from './types';
import { StateManager } from './state';

function uuid(): string {
  return crypto.randomUUID();
}

export class Gateway {
  private ws: WebSocket | null = null;
  private pendingRequests = new Map<string, (res: WsResponse) => void>();
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  state: StateManager;
  connected = false;
  onStatusChange?: (connected: boolean) => void;

  constructor(state: StateManager) {
    this.state = state;
  }

  async connect(url: string, token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(url);
      } catch (e) {
        reject(e);
        return;
      }

      const timeout = setTimeout(() => {
        this.ws?.close();
        reject(new Error('Connection timeout'));
      }, 10_000);

      this.ws.onopen = () => {
        // Wait for challenge
      };

      this.ws.onclose = () => {
        clearTimeout(timeout);
        this.connected = false;
        this.stopPolling();
        this.onStatusChange?.(false);
      };

      this.ws.onerror = () => {
        clearTimeout(timeout);
        reject(new Error('WebSocket error'));
      };

      let handshakeDone = false;

      this.ws.onmessage = (ev) => {
        let msg: WsMessage;
        try {
          msg = JSON.parse(ev.data);
        } catch {
          return;
        }

        // Handle challenge
        if (msg.type === 'event' && msg.event === 'connect.challenge') {
          this.send({
            type: 'req',
            id: uuid(),
            method: 'connect',
            params: {
              role: 'operator',
              client: { id: 'pixel-claw', mode: 'ui' },
              auth: { token },
              protocol: 3,
            },
          });
          return;
        }

        // Handle hello-ok
        if (msg.type === 'res' && !handshakeDone) {
          clearTimeout(timeout);
          if (msg.ok) {
            handshakeDone = true;
            this.connected = true;
            this.onStatusChange?.(true);
            this.startPolling();
            resolve();
          } else {
            reject(new Error(msg.error?.message || 'Auth failed'));
            this.ws?.close();
          }
          return;
        }

        // Handle events
        if (msg.type === 'event') {
          if (msg.event === 'chat') {
            this.state.handleChatEvent(msg.payload as unknown as ChatEventPayload);
          }
          return;
        }

        // Handle responses
        if (msg.type === 'res' && msg.id) {
          const cb = this.pendingRequests.get(msg.id);
          if (cb) {
            this.pendingRequests.delete(msg.id);
            cb(msg);
          }
        }
      };
    });
  }

  private send(data: unknown): void {
    this.ws?.send(JSON.stringify(data));
  }

  private async request(method: string, params?: Record<string, unknown>): Promise<WsResponse> {
    return new Promise((resolve) => {
      const id = uuid();
      this.pendingRequests.set(id, resolve);
      this.send({ type: 'req', id, method, params });
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          resolve({ type: 'res', id, ok: false, error: { code: 'timeout', message: 'Request timed out' } });
        }
      }, 10_000);
    });
  }

  private startPolling(): void {
    this.pollSessions();
    this.pollTimer = setInterval(() => this.pollSessions(), 8_000);
  }

  private stopPolling(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  private async pollSessions(): Promise<void> {
    const res = await this.request('sessions.list');
    if (res.ok && res.payload) {
      const sessions = (res.payload as unknown as { sessions?: SessionInfo[] }).sessions;
      if (Array.isArray(sessions)) {
        this.state.updateFromSessions(sessions);
      }
    }
  }

  disconnect(): void {
    this.stopPolling();
    this.ws?.close();
    this.ws = null;
    this.connected = false;
    this.state.agents.clear();
  }
}
