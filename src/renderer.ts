import type { AgentState } from './types';
import { StateManager } from './state';
import { ZoneManager, ZONES, LAYOUT } from './zones';
import {
  drawCharacter, drawDesk, drawStandingDesk, drawStatusBubble,
  drawFloorForZone, drawWall, drawInteriorWall,
  drawBookshelf, drawPottedPlant, drawClock, drawWaterCooler,
  drawVendingMachine, drawCoffeeMachine, drawCouch,
  drawLandscapePainting, drawWhiteboard,
  drawZzz, drawThoughtBubble,
} from './sprites/index';
import { VS, pixelFont } from './visual-system';

const SUB_SCALE_FACTOR = 0.8;
const SHOW_AGENT_LABELS = false;
const USE_DONARG_BACKGROUND = true;
const DONARG_BG_SRC = '/assets/donarg/office-level-4-custom.png';
const DONARG_BOARD_SRC = { x: 22, y: 258, w: 596, h: 520 }; // trimmed to actual office board bounds

export class Renderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private state: StateManager;
  private zones: ZoneManager;
  private lastTime = 0;
  private running = false;
  private globalTime = 0;
  private scale = 3;
  private donargBg: HTMLImageElement | null = null;
  selectedAgent: AgentState | null = null;
  onAgentClick?: (agent: AgentState | null) => void;
  onDeskClick?: (desk: { x: number; y: number; screenX: number; screenY: number }) => void;

  constructor(canvas: HTMLCanvasElement, state: StateManager) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.state = state;
    this.zones = new ZoneManager();
    this.resize();
    if (USE_DONARG_BACKGROUND) {
      const img = new Image();
      img.onload = () => {
        this.donargBg = img;
        this.zones.setBackgroundImage(img, DONARG_BOARD_SRC);
      };
      img.src = DONARG_BG_SRC;
    }
    window.addEventListener('resize', () => this.resize());
    canvas.addEventListener('click', (e) => this.handleClick(e));

    // NavDebug: show virtual coordinates on mouse move
    if (new URLSearchParams(window.location.search).has('navDebug') || localStorage.getItem('pixelclaw.navDebug') === '1') {
      this.mouseVirtual = { x: 0, y: 0 };
      canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        this.mouseVirtual = {
          x: Math.round((e.clientX - rect.left) / this.scale),
          y: Math.round((e.clientY - rect.top) / this.scale),
        };
      });
    }
  }

  private mouseVirtual?: { x: number; y: number };

  private resize() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    this.scale = Math.max(2, Math.min(4, Math.floor(Math.min(vw / LAYOUT.VW, vh / LAYOUT.VH))));
    this.canvas.width = LAYOUT.VW * this.scale;
    this.canvas.height = LAYOUT.VH * this.scale;
    this.canvas.style.position = 'absolute';
    this.canvas.style.left = `${Math.round((vw - this.canvas.width) / 2)}px`;
    this.canvas.style.top = `${Math.round((vh - this.canvas.height) / 2)}px`;
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
    this.zones.update(this.state.agents, dt);
    this.render();
    requestAnimationFrame((t) => this.loop(t));
  }

  private render() {
    const { ctx, canvas } = this;
    const s = this.scale;

    ctx.imageSmoothingEnabled = false;

    // ── Layer 0: Background ──
    ctx.fillStyle = VS.palette.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (USE_DONARG_BACKGROUND && this.donargBg) {
      // Draw only the real office board area (no outer void), scaled to fill viewport.
      ctx.drawImage(
        this.donargBg,
        DONARG_BOARD_SRC.x,
        DONARG_BOARD_SRC.y,
        DONARG_BOARD_SRC.w,
        DONARG_BOARD_SRC.h,
        0,
        0,
        canvas.width,
        canvas.height,
      );
    }

    // ── Layer 1: Floors ──
    if (!USE_DONARG_BACKGROUND || !this.donargBg) {
      for (const zone of Object.values(ZONES)) {
        drawFloorForZone(ctx, zone, s);
      }
    }

    const L = LAYOUT;
    if (!USE_DONARG_BACKGROUND || !this.donargBg) {
      // ── Layer 2: Walls ──
      drawWall(ctx, 0, 0, LAYOUT.VW, LAYOUT.WALL_H, s);
      drawInteriorWall(ctx, LAYOUT.DIVIDER_X, LAYOUT.WALL_H, 2, LAYOUT.DIVIDER_Y - LAYOUT.WALL_H, s,
        LAYOUT.DIVIDER_X, 0);
      this.drawVerticalWall(ctx, s);
      drawInteriorWall(ctx, 0, LAYOUT.DIVIDER_Y, LAYOUT.VW, 2, s);

      // ── Layer 3: Wall-mounted furniture ──
      drawBookshelf(ctx, 10 * s, 8 * s, s);
      drawLandscapePainting(ctx, 72 * s, 10 * s, s);
      drawBookshelf(ctx, (L.DIVIDER_X + 8) * s, 8 * s, s);
      drawWhiteboard(ctx, (L.DIVIDER_X + 50) * s, 8 * s, s);
      drawClock(ctx, (L.DIVIDER_X + 124) * s, 10 * s, s, this.globalTime);
    }

    // ── Collect all ground-level items for y-sort ──
    interface Drawable {
      y: number;
      draw: () => void;
    }
    const drawables: Drawable[] = [];

    if (!USE_DONARG_BACKGROUND || !this.donargBg) {
      // Break room furniture
      drawables.push({
        y: L.BREAK_START_Y + 44,
        draw: () => {
          const breakY = L.DIVIDER_Y + 8;
          drawWaterCooler(ctx, (L.BREAK_START_X + 8) * s, breakY * s, s);
          drawVendingMachine(ctx, (L.BREAK_START_X + 28) * s, breakY * s, s);
          drawCoffeeMachine(ctx, (L.BREAK_START_X + 58) * s, (breakY + 8) * s, s);
          drawCouch(ctx, (L.BREAK_START_X + 92) * s, (breakY + 26) * s, s);
        }
      });

      // Plants
      drawables.push({
        y: L.WALL_H + 2,
        draw: () => {
          drawPottedPlant(ctx, 2 * s, (L.WALL_H + 2) * s, s);
          drawPottedPlant(ctx, 80 * s, (L.WALL_H + 2) * s, s);
        }
      });

      // Lead office desk
      drawables.push({
        y: L.LEAD_DESK_Y,
        draw: () => drawDesk(ctx, L.LEAD_DESK_X * s, L.LEAD_DESK_Y * s, s),
      });

      // Main floor desks
      const mainFloorAgents = Array.from(this.state.agents.values()).filter(
        a => !a.isSubAgent && a.zone === 'main-floor'
      );
      for (let i = 0; i < Math.max(mainFloorAgents.length, 3); i++) {
        const col = i % L.MAIN_DESKS_PER_ROW;
        const row = Math.floor(i / L.MAIN_DESKS_PER_ROW);
        const deskX = L.MAIN_DESK_START_X + col * L.MAIN_DESK_SPACING_X;
        const deskY = L.MAIN_DESK_START_Y + row * L.MAIN_DESK_SPACING_Y;
        drawables.push({
          y: deskY,
          draw: () => drawDesk(ctx, deskX * s, deskY * s, s),
        });
      }

      // Sub-agent standing desks
      const subAgents = Array.from(this.state.agents.values()).filter(a => a.isSubAgent);
      for (let i = 0; i < subAgents.length; i++) {
        const col = i % L.SUB_PER_ROW;
        const row = Math.floor(i / L.SUB_PER_ROW);
        const deskX = L.SUB_START_X + col * L.SUB_SPACING_X;
        const deskY = L.SUB_START_Y + row * L.SUB_SPACING_Y;
        drawables.push({
          y: deskY,
          draw: () => drawStandingDesk(ctx, deskX * s, deskY * s, s),
        });
      }
    }

    // ── Characters ──
    const allAgents = Array.from(this.state.agents.values());
    for (const agent of allAgents) {
      const agentScale = agent.isSubAgent ? s * SUB_SCALE_FACTOR : s;
      const charY = agent.y;
      drawables.push({
        y: agent.renderLayerY ?? (charY + 20),
        draw: () => {
          ctx.save();
          if (agent.isSubAgent && agent.spawnAlpha !== undefined && agent.spawnAlpha < 1) {
            ctx.globalAlpha = agent.spawnAlpha;
          }

          const isActive = agent.activity !== 'idle' && agent.activity !== 'sleeping' && agent.activity !== 'walking';

          // Active glow
          if (isActive) {
            ctx.fillStyle = 'rgba(104,211,155,0.10)';
            ctx.fillRect(
              Math.round((agent.x - 4) * agentScale),
              Math.round((agent.y + 20) * agentScale),
              Math.round(24 * agentScale),
              Math.round(18 * agentScale),
            );
          }

          // Selection highlight
          if (agent === this.selectedAgent) {
            ctx.strokeStyle = VS.palette.textAccent;
            ctx.lineWidth = 2;
            ctx.strokeRect(
              Math.round((agent.x - 1) * agentScale),
              Math.round((agent.y - 2) * agentScale),
              Math.round(18 * agentScale),
              Math.round(26 * agentScale),
            );
          }

          const seated = !!agent.seated;

          drawCharacter(
            ctx,
            agent.x * agentScale,
            (agent.y - 4) * agentScale,
            agent.color,
            agent.activity,
            agent.animFrame,
            agentScale,
            agent.agentId,
            this.globalTime,
            agent.accessory,
            seated,
            agent.facing,
          );

          ctx.restore();
        }
      });
    }

    // Y-sort and draw all
    drawables.sort((a, b) => a.y - b.y);
    for (const d of drawables) {
      d.draw();
    }

    // ── Layer 5: Effects ──
    for (const agent of allAgents) {
      const agentScale = agent.isSubAgent ? s * SUB_SCALE_FACTOR : s;
      const bx = agent.x;
      const by = agent.y - 4;

      if (agent.activity === 'sleeping') {
        drawZzz(ctx, bx, by, this.globalTime, agentScale);
      }
      if (agent.activity === 'thinking') {
        drawThoughtBubble(ctx, bx, by, this.globalTime, agentScale);
      }
    }

    // ── Layer 5b: Connection lines (sub-agent → parent) ──
    ctx.strokeStyle = 'rgba(232,220,200,0.20)';
    ctx.lineWidth = 2;
    ctx.setLineDash([3, 3]);
    for (const agent of allAgents) {
      if (!agent.isSubAgent || !agent.spawnedBy) continue;
      const parent = this.state.findAgent(agent.spawnedBy);
      if (!parent) continue;
      const pScale = s;
      const aScale = s * SUB_SCALE_FACTOR;
      ctx.beginPath();
      ctx.moveTo(Math.round((parent.x + 8) * pScale), Math.round((parent.y + 12) * pScale));
      ctx.lineTo(Math.round((agent.x + 8) * aScale), Math.round((agent.y + 12) * aScale));
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // ── Nav debug overlay (toggle with ?navDebug=1 or localStorage pixelclaw.navDebug=1) ──
    this.zones.drawNavDebug(ctx, s, this.state.agents);

    // NavDebug: mouse coordinate readout
    if (this.mouseVirtual) {
      const mx = this.mouseVirtual.x;
      const my = this.mouseVirtual.y;
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.75)';
      ctx.fillRect(0, 0, 140 * (s / 3), 16 * (s / 3));
      ctx.fillStyle = '#fff';
      ctx.font = `${11 * (s / 3)}px monospace`;
      ctx.fillText(`v(${mx}, ${my})  cell(${Math.floor(mx / 4)}, ${Math.floor(my / 4)})`, 4 * (s / 3), 12 * (s / 3));
      ctx.restore();
    }

    // ── Layer 6: UI overlays (optional) ──
    if (SHOW_AGENT_LABELS) {
      for (const agent of allAgents) {
        const agentScale = agent.isSubAgent ? s * SUB_SCALE_FACTOR : s;
        this.drawNameTag(agent, agentScale);

        // Status bubble
        const isActive = agent.activity !== 'idle' && agent.activity !== 'sleeping' && agent.activity !== 'walking';
        if (agent.lastMessage && isActive && agent.activity !== 'thinking') {
          const toolMatch = agent.lastMessage.match(/^Using (.+)$/);
          const bubbleText = toolMatch ? toolMatch[1] : agent.activity;
          drawStatusBubble(ctx, (agent.x + 8) * agentScale, (agent.y - 10) * agentScale, bubbleText, agentScale);
        }
      }
    }

    // ── Empty state ──
    if (allAgents.length === 0) {
      ctx.fillStyle = VS.palette.textDim;
      ctx.font = pixelFont(16);
      ctx.textAlign = 'center';
      ctx.fillText('No agents active — the office is empty', canvas.width / 2, canvas.height / 2);
      ctx.font = pixelFont(12);
      ctx.fillText('🦀', canvas.width / 2, canvas.height / 2 + 30);
      ctx.textAlign = 'left';
    }
  }

  private drawVerticalWall(ctx: CanvasRenderingContext2D, s: number) {
    const L = LAYOUT;
    const wallX = L.DIVIDER_X;
    const wallW = 2;
    const wallTop = L.WALL_H;
    const wallBot = L.DIVIDER_Y;
    const doorY = L.DOORWAY_Y;
    const doorH = L.DOORWAY_H;

    // Section above doorway
    if (doorY > wallTop) {
      ctx.fillStyle = '#4a4450';
      ctx.fillRect(Math.round(wallX * s), Math.round(wallTop * s), Math.round(wallW * s), Math.round((doorY - wallTop) * s));
      // Baseboard
      ctx.fillStyle = '#5a4535';
      ctx.fillRect(Math.round(wallX * s), Math.round((doorY - 2) * s), Math.round(wallW * s), Math.round(2 * s));
    }

    // Section below doorway
    const belowY = doorY + doorH;
    if (belowY < wallBot) {
      ctx.fillStyle = '#4a4450';
      ctx.fillRect(Math.round(wallX * s), Math.round(belowY * s), Math.round(wallW * s), Math.round((wallBot - belowY) * s));
      ctx.fillStyle = '#5a4535';
      ctx.fillRect(Math.round(wallX * s), Math.round(belowY * s), Math.round(wallW * s), Math.round(2 * s));
    }

    // Shadow on right side of wall
    const grad = ctx.createLinearGradient(Math.round((wallX + wallW) * s), 0, Math.round((wallX + wallW + 2) * s), 0);
    grad.addColorStop(0, 'rgba(0,0,0,0.12)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(Math.round((wallX + wallW) * s), Math.round(wallTop * s), Math.round(2 * s), Math.round((wallBot - wallTop) * s));
  }

  private drawNameTag(agent: AgentState, scale: number) {
    const { ctx } = this;
    const cx = (agent.x + 8) * scale;
    const baseY = (agent.y + 22) * scale;
    const isActive = agent.activity !== 'idle' && agent.activity !== 'sleeping';
    const isSelected = agent === this.selectedAgent;

    const emoji = agent.identity?.emoji || '';
    const displayName = emoji ? `${emoji} ${agent.label}` : agent.label;

    const fontSize = agent.isSubAgent ? Math.round(7 * this.scale * SUB_SCALE_FACTOR) : Math.round(9 * this.scale);
    ctx.font = pixelFont(fontSize);
    ctx.textAlign = 'center';

    if (isSelected) {
      ctx.fillStyle = VS.palette.textAccent;
    } else if (isActive) {
      ctx.fillStyle = 'rgba(78,204,163,0.5)';
    } else {
      ctx.fillStyle = agent.isSubAgent ? VS.palette.textDim : VS.palette.text;
    }
    ctx.fillText(displayName, Math.round(cx), Math.round(baseY));

    ctx.fillStyle = isActive ? VS.palette.active : VS.palette.textDim;
    ctx.font = pixelFont(Math.round(fontSize * 0.8));
    ctx.fillText(agent.activity, Math.round(cx), Math.round(baseY + fontSize + 2));
    ctx.textAlign = 'left';
  }

  // Desk hitboxes matching the blocker rects in zones.ts
  private static DESK_RECTS = [
    { x: 25, y: 58, w: 28, h: 18 },
    { x: 76, y: 58, w: 28, h: 18 },
    { x: 127, y: 58, w: 28, h: 18 },
    { x: 25, y: 104, w: 28, h: 18 },
    { x: 76, y: 104, w: 28, h: 18 },
    { x: 127, y: 104, w: 28, h: 18 },
    // Lead office desk
    { x: 229, y: 214, w: 28, h: 18 },
    // Manager desk
    { x: 102, y: 206, w: 46, h: 18 },
  ];

  private handleClick(e: MouseEvent) {
    const rect = this.canvas.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) / this.scale;
    const clickY = (e.clientY - rect.top) / this.scale;

    // Check agent clicks first
    const agents = Array.from(this.state.agents.values());
    for (const agent of agents) {
      const ax = agent.x;
      const ay = agent.y - 4;
      const aw = 16;
      const ah = 28;

      if (clickX >= ax && clickX <= ax + aw && clickY >= ay && clickY <= ay + ah) {
        this.selectedAgent = agent;
        this.onAgentClick?.(agent);
        return;
      }
    }

    // Check desk clicks
    for (const desk of Renderer.DESK_RECTS) {
      if (clickX >= desk.x && clickX <= desk.x + desk.w && clickY >= desk.y && clickY <= desk.y + desk.h) {
        this.onDeskClick?.({
          x: desk.x,
          y: desk.y,
          screenX: Math.round(e.clientX),
          screenY: Math.round(e.clientY),
        });
        return;
      }
    }

    this.selectedAgent = null;
    this.onAgentClick?.(null);
  }
}
