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
    const dpr = 1; // keep pixel-perfect
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

    // Background — dark office floor
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, w, h);

    // Tile pattern
    this.drawFloor(w, h);

    // Draw desks and characters
    const agents = Array.from(this.state.agents.values());
    for (const agent of agents) {
      const pos = this.getDeskPosition(agent.deskIndex);
      agent.x = pos.x;
      agent.y = pos.y;

      // Desk
      drawDesk(ctx, pos.x, pos.y, SCALE);

      // Character (sitting at desk, slightly offset)
      drawCharacter(
        ctx,
        pos.x + 1 * SCALE,
        pos.y - 10 * SCALE,
        agent.color,
        agent.activity,
        agent.animFrame,
        SCALE
      );

      // Name tag
      ctx.fillStyle = agent === this.selectedAgent ? '#e94560' : '#c0c0d0';
      ctx.font = `${11}px "Courier New", monospace`;
      ctx.textAlign = 'center';
      ctx.fillText(agent.label, pos.x + 8 * SCALE, pos.y + 32 * SCALE);
      ctx.textAlign = 'left';

      // Activity label
      ctx.fillStyle = '#808090';
      ctx.font = `${9}px "Courier New", monospace`;
      ctx.textAlign = 'center';
      ctx.fillText(agent.activity, pos.x + 8 * SCALE, pos.y + 35 * SCALE);
      ctx.textAlign = 'left';
    }

    // Empty state
    if (agents.length === 0) {
      ctx.fillStyle = '#404060';
      ctx.font = '16px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('No agents active — the office is empty', w / 2, h / 2);
      ctx.font = '12px "Courier New", monospace';
      ctx.fillText('🦀', w / 2, h / 2 + 30);
      ctx.textAlign = 'left';
    }
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
    // Subtle grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    for (let y = 0; y < h; y += tileS) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    for (let x = 0; x < w; x += tileS) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
  }

  private handleClick(e: MouseEvent) {
    const agents = Array.from(this.state.agents.values());
    const clickX = e.clientX;
    const clickY = e.clientY;

    for (const agent of agents) {
      const ax = agent.x;
      const ay = agent.y - 10 * SCALE;
      const aw = 16 * SCALE;
      const ah = 30 * SCALE;

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
