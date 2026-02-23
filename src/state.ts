import type { AgentState, AgentActivity, AgentIdentity, ChatEventPayload, SessionInfo } from './types';

// Curated palette — visually distinct, pleasant colors
const PALETTE = [
  '#e94560', '#4ecca3', '#f0c040', '#60a0f0',
  '#c060e0', '#f08050', '#50d0d0', '#d0d050',
  '#a070f0', '#70f0a0', '#f070b0', '#70b0f0',
  '#e07070', '#70e0b0', '#b0a0f0', '#f0b070',
];

// Deterministic color from agentId — same agent always gets same color
function hashColor(agentId: string): string {
  let hash = 0;
  for (let i = 0; i < agentId.length; i++) {
    hash = ((hash << 5) - hash + agentId.charCodeAt(i)) | 0;
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

// Extract agentId from session key like "agent:01-tech-lead:xxx"
function extractAgentId(sessionKey: string): string {
  const parts = sessionKey.split(':');
  if (parts.length >= 2 && parts[0] === 'agent') return parts[1];
  return sessionKey;
}

export class StateManager {
  agents: Map<string, AgentState> = new Map();
  identityCache: Map<string, AgentIdentity> = new Map();
  private deskCounter = 0;
  onIdentityNeeded?: (agentId: string) => void;

  getOrCreateAgent(sessionKey: string, agentId?: string, spawnedBy?: string): AgentState {
    let agent = this.agents.get(sessionKey);
    if (!agent) {
      const resolvedAgentId = agentId || extractAgentId(sessionKey);
      const isSubAgent = !!spawnedBy;
      const deskIndex = this.deskCounter++;
      agent = {
        sessionKey,
        agentId: resolvedAgentId,
        label: resolvedAgentId,
        activity: 'idle',
        lastActiveAt: Date.now(),
        spawnedBy,
        isSubAgent,
        x: 0,
        y: 0,
        deskIndex,
        color: hashColor(resolvedAgentId),
        animFrame: 0,
        animTimer: 0,
      };
      this.agents.set(sessionKey, agent);

      // Apply cached identity if available
      const identity = this.identityCache.get(resolvedAgentId);
      if (identity) {
        agent.identity = identity;
        if (identity.name) agent.label = identity.name;
      } else {
        this.onIdentityNeeded?.(resolvedAgentId);
      }
    }
    return agent;
  }

  applyIdentity(identity: AgentIdentity): void {
    this.identityCache.set(identity.agentId, identity);
    for (const agent of this.agents.values()) {
      if (agent.agentId === identity.agentId) {
        agent.identity = identity;
        if (identity.name) agent.label = identity.name;
      }
    }
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
          if (b.type === 'tool_result') return;
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
      const agent = this.getOrCreateAgent(s.key, s.agentId, s.spawnedBy);
      if (s.label) agent.label = s.label;
      if (s.model) agent.model = s.model;
      if (s.spawnedBy) agent.spawnedBy = s.spawnedBy;
      if (s.lastMessage) agent.lastMessage = s.lastMessage;
      // Update agentId if provided and different
      if (s.agentId && s.agentId !== agent.agentId) {
        agent.agentId = s.agentId;
        agent.color = hashColor(s.agentId);
        const identity = this.identityCache.get(s.agentId);
        if (identity) {
          agent.identity = identity;
          if (identity.name) agent.label = identity.name;
        } else {
          this.onIdentityNeeded?.(s.agentId);
        }
      }
      // Restore label from identity if not overridden by session label
      if (!s.label && agent.identity?.name) {
        agent.label = agent.identity.name;
      }
    }
    // Remove stale agents
    for (const [key, agent] of this.agents) {
      if (!seen.has(key) && Date.now() - agent.lastActiveAt > 60_000) {
        this.agents.delete(key);
      }
    }
  }

  // Get main agents (not sub-agents)
  getMainAgents(): AgentState[] {
    return Array.from(this.agents.values()).filter(a => !a.isSubAgent);
  }

  // Get sub-agents for a given parent session key
  getSubAgents(parentKey: string): AgentState[] {
    return Array.from(this.agents.values()).filter(a => a.spawnedBy === parentKey);
  }

  tick(dt: number): void {
    const now = Date.now();
    for (const agent of this.agents.values()) {
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
  return 'coding';
}
