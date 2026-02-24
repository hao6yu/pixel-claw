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

  // ── Projects popup ──
  const projectsPopup = document.getElementById('projects-popup')!;
  const projectsList = document.getElementById('projects-list')!;
  const projectsClose = document.getElementById('projects-close')!;

  const PROJECTS = [
    { name: 'HowAI Agent', type: 'Flutter', desc: 'AI chat app — voice, images, web search', url: 'https://github.com/hao6yu/howai-agent' },
    { name: 'HowAI Agent Web', type: 'Next.js', desc: 'Web companion — real-time chat & sync', url: 'https://github.com/hao6yu/howai-agent-web' },
    { name: 'M&M Learning Lab', type: 'Flutter', desc: 'Kids education — math, phonics, puzzles', url: 'https://github.com/hao6yu/mm-learning-lab' },
    { name: 'M&M Property Tycoon', type: 'Flutter', desc: 'Family board game — Monopoly-style', url: '' },
    { name: 'Pixel Claw', type: 'Vite+TS', desc: 'This app! Agent office visualization', url: '' },
    { name: 'claw-dash 🦞', type: 'Web', desc: 'OpenClaw monitoring dashboard', url: 'https://github.com/hao6yu/claw-dash' },
    { name: 'peon-ping-win', type: 'PowerShell', desc: 'Claude Code notification sounds (Windows)', url: 'https://github.com/hao6yu/peon-ping-win' },
    { name: 'ISW Technologies', type: 'Astro', desc: 'ISW business website', url: 'https://github.com/hao6yu/isw-website-v2' },
    { name: 'Hao Yu Site', type: 'Astro', desc: 'Personal website', url: 'https://github.com/hao6yu/haoyu-website-v2' },
    { name: 'IMS AI Gateway', type: 'FastAPI', desc: 'AI backend for work requests', url: '' },
    { name: 'IMS TheBotGuy', type: 'Teams Bot', desc: 'Self-service work request bot', url: '' },
  ];

  function showProjects(screenX: number, screenY: number) {
    projectsList.innerHTML = '';
    for (const p of PROJECTS) {
      const el = document.createElement(p.url ? 'a' : 'div');
      el.className = 'project-item';
      if (p.url) {
        (el as HTMLAnchorElement).href = p.url;
        (el as HTMLAnchorElement).target = '_blank';
      }
      el.innerHTML = `<div><span class="project-name">${p.name}</span><span class="project-type">${p.type}</span></div><div class="project-desc">${p.desc}</div>`;
      projectsList.appendChild(el);
    }
    // Position near click but keep on screen
    const popW = 300;
    const popH = 340;
    let left = Math.min(screenX, window.innerWidth - popW - 10);
    let top = Math.min(screenY - 20, window.innerHeight - popH - 10);
    left = Math.max(10, left);
    top = Math.max(40, top);
    projectsPopup.style.left = left + 'px';
    projectsPopup.style.top = top + 'px';
    projectsPopup.style.display = 'block';
  }

  projectsClose.addEventListener('click', () => {
    projectsPopup.style.display = 'none';
  });

  renderer.onDeskClick = (desk) => {
    showProjects(desk.screenX, desk.screenY);
  };

  renderer.onAgentClick = (agent: AgentState | null) => {
    projectsPopup.style.display = 'none';
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
