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
  configuredAgentIds: Set<string> = new Set();
  identityCache: Map<string, AgentIdentity> = new Map();
  private deskCounter = 0;
  onIdentityNeeded?: (agentId: string) => void;

  // Add a configured agent as a permanent character (always visible)
  addConfiguredAgent(agentId: string): void {
    this.configuredAgentIds.add(agentId);
    // Create a permanent agent keyed by agentId
    const permanentKey = `configured:${agentId}`;
    if (!this.agents.has(permanentKey)) {
      const deskIndex = this.deskCounter++;
      this.agents.set(permanentKey, {
        sessionKey: permanentKey,
        agentId,
        label: agentId,
        activity: 'idle',
        lastActiveAt: Date.now(),
        isSubAgent: false,
        x: 0, y: 0,
        deskIndex,
        color: hashColor(agentId),
        animFrame: 0,
        animTimer: 0,
      });
    }
  }

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
    // Try to find the agent by session key (could be a configured agent or sub-agent)
    let agent = this.findAgentBySessionKey(payload.sessionKey);
    if (!agent) {
      // Check if it belongs to a configured agent
      const agentId = extractAgentId(payload.sessionKey);
      if (this.configuredAgentIds.has(agentId)) {
        agent = this.agents.get(`configured:${agentId}`);
      }
    }
    if (!agent) {
      // Unknown session — might be a sub-agent, create temporarily
      agent = this.getOrCreateAgent(payload.sessionKey);
    }
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
    const activeSubKeys = new Set<string>();

    for (const s of sessions) {
      const agentId = s.agentId || extractAgentId(s.key);

      // If this session belongs to a configured agent, map activity onto the permanent character
      if (this.configuredAgentIds.has(agentId)) {
        const permanentKey = `configured:${agentId}`;
        const agent = this.agents.get(permanentKey);
        if (agent) {
          agent.lastActiveAt = Date.now();
          if (s.model) agent.model = s.model;
          if (s.lastMessage) agent.lastMessage = s.lastMessage;
          // Map the real session key so chat events can find it
          agent.sessionKey = s.key;
        }
        continue;
      }

      // Otherwise it's a sub-agent — show temporarily
      if (s.spawnedBy || s.key.includes(':subagent:')) {
        activeSubKeys.add(s.key);
        const agent = this.getOrCreateAgent(s.key, agentId, s.spawnedBy);
        agent.isSubAgent = true;
        if (s.label) agent.label = s.label;
        else if (s.displayName) agent.label = s.displayName;
        if (s.model) agent.model = s.model;
        if (s.lastMessage) agent.lastMessage = s.lastMessage;
        agent.lastActiveAt = Date.now();
      }
    }

    // Remove stale sub-agents not in the session list
    for (const [key] of this.agents) {
      if (key.startsWith('configured:')) continue; // never remove permanent agents
      if (!activeSubKeys.has(key)) {
        this.agents.delete(key);
      }
    }
  }

  private findAgentBySessionKey(sessionKey: string): AgentState | undefined {
    // Direct match
    const direct = this.agents.get(sessionKey);
    if (direct) return direct;
    // Check configured agents whose sessionKey was mapped
    for (const agent of this.agents.values()) {
      if (agent.sessionKey === sessionKey) return agent;
    }
    return undefined;
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
