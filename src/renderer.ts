import type { AgentState } from './types';
import { StateManager } from './state';
import { drawCharacter, drawDesk } from './sprites';

const TILE_SIZE = 16;
const SCALE = 3;
const DESK_SPACING_X = 28;
const DESK_SPACING_Y = 36;
const DESKS_PER_ROW = 5;
const OFFICE_PADDING_X = 6;
const OFFICE_PADDING_Y = 24;

const SUB_SCALE = 2;          // sub-agents are smaller
const SUB_OFFSET_X = 22;      // offset from parent desk
const SUB_OFFSET_Y = 8;
const SUB_STACK_Y = 26;       // vertical spacing between sub-agents

export class Renderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private state: StateManager;
  private lastTime = 0;
  private running = false;
  selectedAgent: AgentState | null = null;
  onAgentClick?: (agent: AgentState | null) => void;

  constructor(canvas: HTMLCanvasElement, state: StateManager) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.state = state;
    this.resize();
    window.addEventListener('resize', () => this.resize());
    canvas.addEventListener('click', (e) => this.handleClick(e));
  }

  private resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  }

  stop() {
    this.running = false;
  }

  private loop(time: number) {
    if (!this.running) return;
    const dt = (time - this.lastTime) / 1000;
    this.lastTime = time;
    this.state.tick(dt);
    this.render();
    requestAnimationFrame((t) => this.loop(t));
  }

  private getDeskPosition(index: number): { x: number; y: number } {
    const col = index % DESKS_PER_ROW;
    const row = Math.floor(index / DESKS_PER_ROW);
    const totalW = DESKS_PER_ROW * DESK_SPACING_X * SCALE;
    const offsetX = (this.canvas.width - totalW) / 2;
    return {
      x: offsetX + (OFFICE_PADDING_X + col * DESK_SPACING_X) * SCALE,
      y: (OFFICE_PADDING_Y + row * DESK_SPACING_Y) * SCALE + 60,
    };
  }

  private render() {
    const { ctx, canvas } = this;
    const w = canvas.width;
    const h = canvas.height;

    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, w, h);
    this.drawFloor(w, h);

    // Separate main agents and sub-agents
    const mainAgents = this.state.getMainAgents();
    const allAgents = Array.from(this.state.agents.values());

    // Assign desk positions to main agents
    mainAgents.forEach((agent, i) => {
      agent.deskIndex = i;
      const pos = this.getDeskPosition(i);
      agent.x = pos.x;
      agent.y = pos.y;
    });

    // Position sub-agents near their parents
    for (const agent of allAgents) {
      if (!agent.isSubAgent) continue;
      const parent = agent.spawnedBy ? this.state.agents.get(agent.spawnedBy) : null;
      if (parent) {
        const siblings = this.state.getSubAgents(parent.sessionKey);
        const sibIdx = siblings.indexOf(agent);
        agent.x = parent.x + SUB_OFFSET_X * SCALE;
        agent.y = parent.y + (SUB_OFFSET_Y + sibIdx * SUB_STACK_Y) * SUB_SCALE;
      } else {
        // Orphan sub-agent — give it a regular desk
        const pos = this.getDeskPosition(mainAgents.length + agent.deskIndex);
        agent.x = pos.x;
        agent.y = pos.y;
      }
    }

    // Draw connection lines from sub-agents to parents
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    for (const agent of allAgents) {
      if (!agent.isSubAgent || !agent.spawnedBy) continue;
      const parent = this.state.agents.get(agent.spawnedBy);
      if (!parent) continue;
      const px = parent.x + 8 * SCALE;
      const py = parent.y + 5 * SCALE;
      const ax = agent.x + 8 * (agent.isSubAgent && parent ? SUB_SCALE : SCALE);
      const ay = agent.y + 5 * (agent.isSubAgent && parent ? SUB_SCALE : SCALE);
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(ax, ay);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Draw main agents with desks
    for (const agent of mainAgents) {
      drawDesk(ctx, agent.x, agent.y, SCALE);
      drawCharacter(ctx, agent.x + 1 * SCALE, agent.y - 10 * SCALE, agent.color, agent.activity, agent.animFrame, SCALE);
      this.drawLabel(agent, SCALE);
    }

    // Draw sub-agents (smaller, no desk — just a small side table)
    for (const agent of allAgents) {
      if (!agent.isSubAgent) continue;
      const parent = agent.spawnedBy ? this.state.agents.get(agent.spawnedBy) : null;
      const s = parent ? SUB_SCALE : SCALE;

      // Mini side table
      ctx.fillStyle = '#6b5337';
      ctx.fillRect(Math.round(agent.x), Math.round(agent.y + 14 * s), Math.round(14 * s), Math.round(3 * s));

      drawCharacter(ctx, agent.x + 1 * s, agent.y - 10 * s, agent.color, agent.activity, agent.animFrame, s);
      this.drawLabel(agent, s);
    }

    // Empty state
    if (allAgents.length === 0) {
      ctx.fillStyle = '#404060';
      ctx.font = '16px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('No agents active — the office is empty', w / 2, h / 2);
      ctx.font = '12px "Courier New", monospace';
      ctx.fillText('🦀', w / 2, h / 2 + 30);
      ctx.textAlign = 'left';
    }
  }

  private drawLabel(agent: AgentState, scale: number) {
    const { ctx } = this;
    const cx = agent.x + 8 * scale;
    const baseY = agent.y + 32 * scale;

    // Emoji + name
    const emoji = agent.identity?.emoji || '';
    const displayName = emoji ? `${emoji} ${agent.label}` : agent.label;

    const isSelected = agent === this.selectedAgent;
    ctx.fillStyle = isSelected ? '#e94560' : (agent.isSubAgent ? '#909098' : '#c0c0d0');
    ctx.font = `${scale === SCALE ? 11 : 9}px "Courier New", monospace`;
    ctx.textAlign = 'center';
    ctx.fillText(displayName, cx, baseY);

    // Activity
    ctx.fillStyle = '#808090';
    ctx.font = `${scale === SCALE ? 9 : 7}px "Courier New", monospace`;
    ctx.fillText(agent.activity, cx, baseY + (scale === SCALE ? 12 : 9));
    ctx.textAlign = 'left';
  }

  private drawFloor(w: number, h: number) {
    const ctx = this.ctx;
    const tileS = TILE_SIZE * SCALE;
    for (let y = 0; y < h; y += tileS) {
      for (let x = 0; x < w; x += tileS) {
        const isAlt = ((x / tileS) + (y / tileS)) % 2 === 0;
        ctx.fillStyle = isAlt ? '#1e1e34' : '#1a1a2e';
        ctx.fillRect(x, y, tileS, tileS);
      }
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    for (let y = 0; y < h; y += tileS) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }
    for (let x = 0; x < w; x += tileS) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
  }

  private handleClick(e: MouseEvent) {
    const agents = Array.from(this.state.agents.values());
    const clickX = e.clientX;
    const clickY = e.clientY;

    for (const agent of agents) {
      const s = (agent.isSubAgent && agent.spawnedBy && this.state.agents.has(agent.spawnedBy)) ? SUB_SCALE : SCALE;
      const ax = agent.x;
      const ay = agent.y - 10 * s;
      const aw = 16 * s;
      const ah = 30 * s;

      if (clickX >= ax && clickX <= ax + aw && clickY >= ay && clickY <= ay + ah) {
        this.selectedAgent = agent;
        this.onAgentClick?.(agent);
        return;
      }
    }

    this.selectedAgent = null;
    this.onAgentClick?.(null);
  }
}
