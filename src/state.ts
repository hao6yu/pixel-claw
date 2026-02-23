import type { AgentState, AgentActivity, ChatEventPayload, SessionInfo } from './types';

const AGENT_COLORS = [
  '#e94560', '#4ecca3', '#f0c040', '#60a0f0',
  '#c060e0', '#f08050', '#50d0d0', '#d0d050',
  '#a070f0', '#70f0a0', '#f070b0', '#70b0f0',
];

let colorIndex = 0;

export class StateManager {
  agents: Map<string, AgentState> = new Map();
  private deskCounter = 0;

  getOrCreateAgent(sessionKey: string): AgentState {
    let agent = this.agents.get(sessionKey);
    if (!agent) {
      const deskIndex = this.deskCounter++;
      agent = {
        sessionKey,
        label: sessionKey.split(':').pop() || sessionKey,
        activity: 'idle',
        lastActiveAt: Date.now(),
        x: 0,
        y: 0,
        deskIndex,
        color: AGENT_COLORS[colorIndex++ % AGENT_COLORS.length],
        animFrame: 0,
        animTimer: 0,
      };
      this.agents.set(sessionKey, agent);
    }
    return agent;
  }

  handleChatEvent(payload: ChatEventPayload): void {
    const agent = this.getOrCreateAgent(payload.sessionKey);
    agent.runId = payload.runId;
    agent.lastActiveAt = Date.now();

    if (payload.state === 'final' || payload.state === 'aborted') {
      agent.activity = 'idle';
      return;
    }
    if (payload.state === 'error') {
      agent.activity = 'error';
      return;
    }

    // delta — figure out what kind
    const msg = payload.message;
    if (!msg) {
      agent.activity = 'thinking';
      return;
    }

    if (msg.model) agent.model = msg.model;

    const content = msg.content;
    if (Array.isArray(content)) {
      for (const block of content) {
        if (block && typeof block === 'object' && 'type' in block) {
          const b = block as Record<string, unknown>;
          if (b.type === 'tool_use') {
            agent.activity = classifyTool(b.name as string);
            agent.lastMessage = `Using ${b.name}`;
            return;
          }
          if (b.type === 'tool_result') {
            // keep current activity
            return;
          }
          if (b.type === 'text' && typeof b.text === 'string') {
            agent.lastMessage = b.text.slice(0, 200);
          }
        }
      }
    }
    if (typeof content === 'string') {
      agent.lastMessage = content.slice(0, 200);
    }

    if (agent.activity === 'idle' || agent.activity === 'sleeping') {
      agent.activity = 'thinking';
    }
  }

  updateFromSessions(sessions: SessionInfo[]): void {
    const seen = new Set<string>();
    for (const s of sessions) {
      seen.add(s.key);
      const agent = this.getOrCreateAgent(s.key);
      if (s.label) agent.label = s.label;
      if (s.model) agent.model = s.model;
    }
    // Remove agents whose sessions are gone (keep for 60s grace)
    for (const [key, agent] of this.agents) {
      if (!seen.has(key) && Date.now() - agent.lastActiveAt > 60_000) {
        this.agents.delete(key);
      }
    }
  }

  tick(dt: number): void {
    const now = Date.now();
    for (const agent of this.agents.values()) {
      // Sleeping detection
      if (agent.activity === 'idle' && now - agent.lastActiveAt > 30 * 60_000) {
        agent.activity = 'sleeping';
      }
      agent.animTimer += dt;
      if (agent.animTimer > 0.3) {
        agent.animTimer = 0;
        agent.animFrame = (agent.animFrame + 1) % 4;
      }
    }
  }
}

function classifyTool(name: string): AgentActivity {
  if (!name) return 'thinking';
  const n = name.toLowerCase();
  if (['read', 'memory_search', 'memory_get'].some(t => n.includes(t))) return 'reading';
  if (['write', 'edit'].some(t => n === t.toLowerCase())) return 'coding';
  if (['exec', 'process'].some(t => n === t.toLowerCase())) return 'running-cmd';
  if (['web_search', 'web_fetch', 'browser'].some(t => n.includes(t))) return 'browsing';
  if (['message', 'tts'].some(t => n === t.toLowerCase())) return 'communicating';
  return 'coding'; // generic working
}
