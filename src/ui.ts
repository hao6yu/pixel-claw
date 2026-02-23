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

  // Update session count periodically
  setInterval(() => {
    const count = state.agents.size;
    sessionCount.textContent = `${count} agent${count !== 1 ? 's' : ''}`;
  }, 1000);

  // Agent detail panel
  renderer.onAgentClick = (agent: AgentState | null) => {
    if (!agent) {
      detailPanel.style.display = 'none';
      return;
    }
    detailPanel.style.display = 'block';
    detailName.textContent = agent.label;
    detailSession.textContent = agent.sessionKey;
    detailActivity.textContent = agent.activity;
    detailModel.textContent = agent.model || 'unknown';
    detailPreview.textContent = agent.lastMessage || '(no recent output)';
  };

  // Keep detail panel updated
  setInterval(() => {
    if (renderer.selectedAgent && detailPanel.style.display === 'block') {
      const a = renderer.selectedAgent;
      detailActivity.textContent = a.activity;
      detailModel.textContent = a.model || 'unknown';
      detailPreview.textContent = a.lastMessage || '(no recent output)';
    }
  }, 500);
}
