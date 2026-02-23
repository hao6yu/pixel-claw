import type { AgentState } from './types';
import { StateManager } from './state';
import {
  drawCharacter, drawDesk, drawStatusBubble,
  drawWoodFloor, drawWall, drawBookshelf,
  drawPottedPlant, drawClock, drawWaterCooler,
} from './sprites';

const SCALE = 3;
const DESK_SPACING_X = 30;
const DESK_SPACING_Y = 48;
const DESKS_PER_ROW = 4;
const OFFICE_PADDING_X = 8;
const WALL_HEIGHT = 28; // in pixels before scale

const SUB_SCALE = 2;
const SUB_OFFSET_X = 24;
const SUB_OFFSET_Y = 4;
const SUB_STACK_Y = 28;

export class Renderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private state: StateManager;
  private lastTime = 0;
  private running = false;
  private globalTime = 0;
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

  stop() { this.running = false; }

  private loop(time: number) {
    if (!this.running) return;
    const dt = (time - this.lastTime) / 1000;
    this.lastTime = time;
    this.globalTime += dt;
    this.state.tick(dt);
    this.render();
    requestAnimationFrame((t) => this.loop(t));
  }

  private getOfficeOrigin(): { x: number; y: number } {
    const totalW = DESKS_PER_ROW * DESK_SPACING_X * SCALE;
    return {
      x: (this.canvas.width - totalW) / 2,
      y: WALL_HEIGHT * SCALE + 40,
    };
  }

  private getDeskPosition(index: number, isTopRow: boolean): { x: number; y: number } {
    const origin = this.getOfficeOrigin();
    const col = index % DESKS_PER_ROW;
    const row = Math.floor(index / DESKS_PER_ROW);
    const rowPair = Math.floor(row / 2);
    const isTop = row % 2 === 0;

    return {
      x: origin.x + (OFFICE_PADDING_X + col * DESK_SPACING_X) * SCALE,
      y: origin.y + (rowPair * DESK_SPACING_Y * 2 + (isTop ? 0 : DESK_SPACING_Y)) * SCALE,
    };
  }

  private getBreakAreaPos(): { x: number; y: number } {
    const origin = this.getOfficeOrigin();
    return {
      x: origin.x + (DESKS_PER_ROW * DESK_SPACING_X + 10) * SCALE,
      y: origin.y + 10 * SCALE,
    };
  }

  private render() {
    const { ctx, canvas } = this;
    const w = canvas.width;
    const h = canvas.height;
    const s = SCALE;

    ctx.imageSmoothingEnabled = false;

    // ── Background ──
    ctx.fillStyle = '#3a3035';
    ctx.fillRect(0, 0, w, h);

    // ── Wall ──
    drawWall(ctx, w, WALL_HEIGHT * s, s);

    // ── Floor ──
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, WALL_HEIGHT * s, w, h - WALL_HEIGHT * s);
    ctx.clip();
    drawWoodFloor(ctx, w, h, s);
    ctx.restore();

    // ── Decorations on wall ──
    const origin = this.getOfficeOrigin();
    drawBookshelf(ctx, origin.x + 2 * s, 4 * s, s);
    drawBookshelf(ctx, origin.x + 70 * s, 4 * s, s);
    drawClock(ctx, origin.x + 50 * s, 6 * s, s, this.globalTime);

    // ── Break area decorations ──
    const breakPos = this.getBreakAreaPos();
    drawWaterCooler(ctx, breakPos.x, breakPos.y, s);
    drawPottedPlant(ctx, breakPos.x + 14 * s, breakPos.y + 6 * s, s);

    // ── Plants in corners ──
    drawPottedPlant(ctx, origin.x - 12 * s, WALL_HEIGHT * s + 2 * s, s);
    drawPottedPlant(ctx, origin.x + (DESKS_PER_ROW * DESK_SPACING_X - 2) * s, WALL_HEIGHT * s + 2 * s, s);

    // ── Separate agents ──
    const mainAgents = this.state.getMainAgents();
    const allAgents = Array.from(this.state.agents.values());

    // Assign positions to main agents
    mainAgents.forEach((agent, i) => {
      agent.deskIndex = i;
      const pos = this.getDeskPosition(i, i % 2 === 0);
      agent.x = pos.x;
      agent.y = pos.y;
    });

    // Position sub-agents
    for (const agent of allAgents) {
      if (!agent.isSubAgent) continue;
      const parent = agent.spawnedBy ? this.state.agents.get(agent.spawnedBy) : null;
      if (parent) {
        const siblings = this.state.getSubAgents(parent.sessionKey);
        const sibIdx = siblings.indexOf(agent);
        agent.x = parent.x + SUB_OFFSET_X * SCALE;
        agent.y = parent.y + (SUB_OFFSET_Y + sibIdx * SUB_STACK_Y) * SUB_SCALE;
      } else {
        const pos = this.getDeskPosition(mainAgents.length + agent.deskIndex, false);
        agent.x = pos.x;
        agent.y = pos.y;
      }
    }

    // ── Connection lines ──
    ctx.strokeStyle = 'rgba(200,180,150,0.15)';
    ctx.lineWidth = 2;
    ctx.setLineDash([3, 3]);
    for (const agent of allAgents) {
      if (!agent.isSubAgent || !agent.spawnedBy) continue;
      const parent = this.state.agents.get(agent.spawnedBy);
      if (!parent) continue;
      const pScale = SCALE;
      const aScale = parent ? SUB_SCALE : SCALE;
      ctx.beginPath();
      ctx.moveTo(parent.x + 8 * pScale, parent.y + 12 * pScale);
      ctx.lineTo(agent.x + 8 * aScale, agent.y + 12 * aScale);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // ── Draw desks and characters ──
    // Sort by y for depth ordering
    const sortedMain = [...mainAgents].sort((a, b) => a.y - b.y);

    for (const agent of sortedMain) {
      const isActive = agent.activity !== 'idle' && agent.activity !== 'sleeping';

      // Active glow under desk
      if (isActive) {
        ctx.fillStyle = 'rgba(78,204,163,0.06)';
        ctx.fillRect(
          Math.round(agent.x - 4 * s),
          Math.round(agent.y + 20 * s),
          Math.round(24 * s),
          Math.round(18 * s),
        );
      }

      drawDesk(ctx, agent.x, agent.y, s);
      drawCharacter(ctx, agent.x + 2 * s, agent.y - 4 * s, agent.color, agent.activity, agent.animFrame, s, agent.agentId, this.globalTime);

      // Status bubble for active agents
      if (agent.lastMessage && isActive) {
        const toolMatch = agent.lastMessage.match(/^Using (.+)$/);
        const bubbleText = toolMatch ? toolMatch[1] : agent.activity;
        drawStatusBubble(ctx, agent.x + 8 * s, agent.y - 10 * s, bubbleText, s);
      }

      this.drawNameTag(agent, s);
    }

    // ── Sub-agents ──
    const sortedSubs = allAgents.filter(a => a.isSubAgent).sort((a, b) => a.y - b.y);
    for (const agent of sortedSubs) {
      const parent = agent.spawnedBy ? this.state.agents.get(agent.spawnedBy) : null;
      const sc = parent ? SUB_SCALE : SCALE;

      // Mini side desk
      ctx.fillStyle = '#7a5f42';
      ctx.fillRect(Math.round(agent.x - 1 * sc), Math.round(agent.y + 22 * sc), Math.round(16 * sc), Math.round(2 * sc));
      ctx.fillStyle = '#6a5035';
      ctx.fillRect(Math.round(agent.x - 1 * sc), Math.round(agent.y + 24 * sc), Math.round(16 * sc), Math.round(3 * sc));

      drawCharacter(ctx, agent.x + 1 * sc, agent.y, agent.color, agent.activity, agent.animFrame, sc, agent.agentId, this.globalTime);
      this.drawNameTag(agent, sc);
    }

    // ── Empty state ──
    if (allAgents.length === 0) {
      ctx.fillStyle = '#8a8070';
      ctx.font = '16px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('No agents active — the office is empty', w / 2, h / 2);
      ctx.font = '12px "Courier New", monospace';
      ctx.fillText('🦀', w / 2, h / 2 + 30);
      ctx.textAlign = 'left';
    }
  }

  private drawNameTag(agent: AgentState, scale: number) {
    const { ctx } = this;
    const cx = agent.x + 8 * scale;
    const baseY = agent.y + 36 * scale;
    const isActive = agent.activity !== 'idle' && agent.activity !== 'sleeping';
    const isSelected = agent === this.selectedAgent;

    // Emoji + name
    const emoji = agent.identity?.emoji || '';
    const displayName = emoji ? `${emoji} ${agent.label}` : agent.label;

    ctx.font = `${scale === SCALE ? 11 : 9}px "Courier New", monospace`;
    ctx.textAlign = 'center';

    // Glow for active
    if (isActive && !isSelected) {
      ctx.fillStyle = 'rgba(78,204,163,0.5)';
    } else if (isSelected) {
      ctx.fillStyle = '#e0a050';
    } else {
      ctx.fillStyle = agent.isSubAgent ? '#9a9088' : '#d0c8b8';
    }
    ctx.fillText(displayName, Math.round(cx), Math.round(baseY));

    // Activity
    ctx.fillStyle = isActive ? '#a0c8a0' : '#807870';
    ctx.font = `${scale === SCALE ? 9 : 7}px "Courier New", monospace`;
    ctx.fillText(agent.activity, Math.round(cx), Math.round(baseY + (scale === SCALE ? 13 : 10)));
    ctx.textAlign = 'left';
  }

  private handleClick(e: MouseEvent) {
    const agents = Array.from(this.state.agents.values());
    const clickX = e.clientX;
    const clickY = e.clientY;

    for (const agent of agents) {
      const sc = (agent.isSubAgent && agent.spawnedBy && this.state.agents.has(agent.spawnedBy)) ? SUB_SCALE : SCALE;
      const ax = agent.x;
      const ay = agent.y - 4 * sc;
      const aw = 16 * sc;
      const ah = 40 * sc;

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
