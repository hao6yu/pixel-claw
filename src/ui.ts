import type { AgentState } from './types';
import { Gateway } from './gateway';
import { StateManager } from './state';
import { Renderer } from './renderer';

export function initUI(state: StateManager, gateway: Gateway, renderer: Renderer) {
  const panel = document.getElementById('connection-panel')!;
  const urlInput = document.getElementById('gateway-url') as HTMLInputElement;
  const tokenInput = document.getElementById('gateway-token') as HTMLInputElement;
  const connectBtn = document.getElementById('connect-btn') as HTMLButtonElement;
  const connError = document.getElementById('conn-error')!;
  const statusBar = document.getElementById('status-bar')!;
  const statusDot = document.getElementById('status-dot')!;
  const statusText = document.getElementById('status-text')!;
  const sessionCount = document.getElementById('session-count')!;
  const disconnectBtn = document.getElementById('disconnect-btn')!;
  const detailPanel = document.getElementById('detail-panel')!;
  const detailName = document.getElementById('detail-name')!;
  const detailSession = document.getElementById('detail-session')!;
  const detailActivity = document.getElementById('detail-activity')!;
  const detailModel = document.getElementById('detail-model')!;
  const detailPreview = document.getElementById('detail-preview')!;
  const detailSpawnedBy = document.getElementById('detail-spawned-by')!;
  const detailAgentId = document.getElementById('detail-agent-id')!;
  const spawnedByRow = document.getElementById('spawned-by-row')!;

  // Load saved values
  const params = new URLSearchParams(window.location.search);
  urlInput.value = params.get('gatewayUrl') || localStorage.getItem('pc-gateway-url') || 'ws://localhost:18789';
  tokenInput.value = params.get('token') || localStorage.getItem('pc-gateway-token') || '';

  connectBtn.addEventListener('click', async () => {
    connError.textContent = '';
    connectBtn.disabled = true;
    connectBtn.textContent = 'CONNECTING...';

    try {
      const url = urlInput.value.trim();
      const token = tokenInput.value.trim();
      localStorage.setItem('pc-gateway-url', url);
      localStorage.setItem('pc-gateway-token', token);

      await gateway.connect(url, token);
      panel.classList.add('hidden');
      statusBar.style.display = 'flex';
    } catch (e) {
      connError.textContent = (e as Error).message;
    } finally {
      connectBtn.disabled = false;
      connectBtn.textContent = 'CONNECT';
    }
  });

  disconnectBtn.addEventListener('click', () => {
    gateway.disconnect();
    panel.classList.remove('hidden');
    statusBar.style.display = 'none';
    detailPanel.style.display = 'none';
  });

  gateway.onStatusChange = (connected) => {
    if (connected) {
      statusDot.classList.add('connected');
      statusText.textContent = 'Connected';
    } else {
      statusDot.classList.remove('connected');
      statusText.textContent = 'Disconnected';
      panel.classList.remove('hidden');
      statusBar.style.display = 'none';
    }
  };

  setInterval(() => {
    const count = state.agents.size;
    sessionCount.textContent = `${count} agent${count !== 1 ? 's' : ''}`;
  }, 1000);

  function updateDetailPanel(agent: AgentState) {
    const emoji = agent.identity?.emoji || '';
    const name = agent.identity?.name || agent.label;
    detailName.textContent = emoji ? `${emoji} ${name}` : name;
    detailAgentId.textContent = agent.agentId;
    detailSession.textContent = agent.sessionKey;
    detailActivity.textContent = agent.activity;
    detailModel.textContent = agent.model || 'unknown';
    detailPreview.textContent = agent.lastMessage || '(no recent output)';

    if (agent.spawnedBy) {
      spawnedByRow.style.display = 'block';
      // Try to find parent's display name
      const parent = state.agents.get(agent.spawnedBy);
      const parentLabel = parent?.identity?.name || parent?.label || agent.spawnedBy;
      detailSpawnedBy.textContent = parentLabel;
    } else {
      spawnedByRow.style.display = 'none';
    }
  }

  renderer.onAgentClick = (agent: AgentState | null) => {
    if (!agent) {
      detailPanel.style.display = 'none';
      return;
    }
    detailPanel.style.display = 'block';
    updateDetailPanel(agent);
  };

  setInterval(() => {
    if (renderer.selectedAgent && detailPanel.style.display === 'block') {
      updateDetailPanel(renderer.selectedAgent);
    }
  }, 500);
}
