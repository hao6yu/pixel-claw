# pixel-claw Design Document
> 🔮 Cortana's Architecture Brief — v1.0, Feb 2026

## Overview

pixel-claw is a browser-based pixel art office visualization for OpenClaw agents. It connects to the OpenClaw gateway via WebSocket and renders agents as animated pixel characters working in a virtual office. This document defines the complete architecture for a production-quality rebuild.

**Key difference from Pixel Agents (VS Code extension):** Pixel Agents uses purchased sprite sheets (16×16 tileset from itch.io) and runs inside VS Code's webview. pixel-claw is standalone, fully procedural (zero external assets), and designed around OpenClaw's gateway protocol with persistent named agents + ephemeral sub-agents.

---

## Office Layout

### Zone Map (fixed layout, dynamic population)

```
┌─────────────────────────────────────────────────────┐
│                    BACK WALL                         │
│  [bookshelf] [bookshelf] [clock] [bookshelf]        │
├──────────────────────┬──────────────────────────────┤
│                      │                              │
│   LEAD OFFICE        │     MAIN FLOOR               │
│   ┌──────────┐       │     ┌────┐ ┌────┐ ┌────┐    │
│   │ Max ⚡    │       │     │desk│ │desk│ │desk│    │
│   │ big desk │       │     └────┘ └────┘ └────┘    │
│   │ + 2 guest│       │     ┌────┐ ┌────┐ ┌────┐    │
│   │ chairs   │       │     │desk│ │desk│ │desk│    │
│   └──────────┘       │     └────┘ └────┘ └────┘    │
│                      │                              │
│   [plant] [shelf]    │     (expands rows as needed) │
├──────────────────────┤──────────────────────────────┤
│                      │                              │
│   BREAK ROOM         │     SUB-AGENT ZONE           │
│   [water cooler]     │     (standing desks,         │
│   [vending machine]  │      temporary positions)    │
│   [couch]            │     ┌──┐ ┌──┐ ┌──┐ ┌──┐     │
│   [coffee machine]   │     │sd│ │sd│ │sd│ │sd│     │
│                      │     └──┘ └──┘ └──┘ └──┘     │
└──────────────────────┴──────────────────────────────┘
```

### Zone Definitions

**Lead Office (left, walled off):**
- The first configured agent (or agent with id matching a configurable "lead" setting, default: agent whose name/id contains "main" or index 0) gets this room.
- Larger desk, landscape painting on wall, two visitor chairs, bookshelf, plant.
- Separated by a wall with a doorway (no door sprite — just an opening).
- Teal/blue carpet floor (distinct from main area).

**Main Floor (right, open plan):**
- Squad agents (configured, non-lead) sit here.
- 3 desks per row, rows added dynamically. Max 4 rows (12 desks) before scrolling.
- Warm wood plank floor.
- Desks face downward (monitor at top, character sits behind it facing viewer).

**Break Room (bottom-left):**
- Agents with `sleeping` or `idle` (>5 min) activity migrate here visually.
- Contains: water cooler, vending machine, coffee machine, couch, small table.
- Cream tile floor.
- Agents stand or sit on couch — no assigned positions, just stack left-to-right.

**Sub-Agent Zone (bottom-right):**
- Temporary sub-agents get standing desks (smaller, no chair).
- Arranged in a single row, wrap to next row if >6.
- A dashed line connects each sub-agent to its parent.
- Sub-agents render at 2/3 scale (smaller characters = visual hierarchy).
- Spawn animation: character walks in from right edge. Despawn: walks out and fades.

### Dynamic Sizing
- Base canvas is 240×180 "virtual pixels" at 3× scale = 720×540 CSS pixels.
- Scale factor adjusts to fit viewport: `scale = Math.max(2, Math.min(4, Math.floor(Math.min(viewW / 240, viewH / 180))))`.
- If >12 main agents, enable vertical scrolling (mouse wheel / drag).

---

## Character System

### Dimensions
- **Base size: 16×24 pixels** (width × height including hair).
- At 3× scale = 48×72 CSS pixels per character.
- Sub-agents render at 2× scale = 32×48 CSS pixels.

### Body Parts (drawn bottom-up)
1. **Shoes** — 2px tall, dark color
2. **Legs/Pants** — 3px tall, generated color
3. **Torso/Shirt** — 6px tall, agent's theme color
4. **Arms** — attached to torso sides, 2px wide, animate per activity
5. **Head** — 8×8px oval-ish rectangle, skin tone
6. **Hair** — varies by style, 2-4px above head
7. **Eyes** — 2×2px each, with 1px highlight dot
8. **Mouth** — 2×1px, contextual

### Appearance Generation (deterministic from agentId)

Hash the `agentId` string to a 32-bit integer. Use bit ranges to select:

| Bits | Feature | Options |
|------|---------|---------|
| 0-2 | Skin tone | 6 tones (light → dark) |
| 3-5 | Hair color | 8 colors (black, brown, blonde, red, gray, auburn, platinum, dark brown) |
| 6-8 | Hair style | 6 styles (short spiky, neat parted, long flowing, buzz cut, mohawk, curly/afro) |
| 9-11 | Pants color | 4 options (navy, charcoal, khaki, dark green) |
| 12-13 | Accessory | 4 options (none, glasses, headphones, hat) — NEW |

**Shirt color** = agent's theme color from the PALETTE array (already implemented, keep it).

**Accessories (new feature):**
- **Glasses:** 2px round frames over eyes, thin bridge
- **Headphones:** Arc over head + ear cups, dark gray
- **Hat:** Replace top hair pixels with hat shape, colored

### Animation States

| State | Frames | FPS | Description |
|-------|--------|-----|-------------|
| `idle` | 2 | 0.5 | Subtle breathing bob (±0.5px Y on torso+head) |
| `thinking` | 2 | 1 | One hand on chin, eyes look up-right, thought bubble with animated dots |
| `coding` | 2 | 6 | Both arms forward, alternating hand heights (typing), eyes on screen |
| `reading` | 2 | 0.8 | Arms at sides, eyes look down, slight head tilt |
| `browsing` | 2 | 4 | Like coding but slower hand movement, screen shows web-like content |
| `running-cmd` | 2 | 3 | Arms forward, screen shows scrolling green lines |
| `communicating` | 2 | 6 | Mouth opens/closes, speech bubble appears |
| `sleeping` | 2 | 0.3 | Eyes closed (horizontal lines), head droops 1px, Zzz floats up |
| `error` | 1 | 0 | X-eyes (red), frown mouth, small red exclamation above head |
| `walking` | 4 | 8 | **NEW** — legs alternate, arms swing, used for zone transitions |

### State Transitions & Walking

When an agent's target zone changes (e.g., idle→sleeping means move to break room), the character doesn't teleport. Instead:

1. Character enters `walking` state
2. Path is calculated as a series of waypoints (simple: exit current position → walk along corridor → enter new position)
3. Character moves at 30 virtual pixels/second
4. On arrival, character transitions to the target activity state

**Pathfinding:** No grid-based BFS needed. Use predefined waypoint routes:
- Main desk → corridor (Y midpoint) → break room entrance → break room position
- Main desk → corridor → sub-agent zone
- Lead office → doorway → corridor → anywhere

This is waypoint-based, not tile-based. Simpler, looks good enough.

---

## Room / Tile System

### Tile Size
- **Base tile: 16×16 virtual pixels.** Everything aligns to this grid.
- Furniture occupies rectangular tile regions (e.g., desk = 2×3 tiles).

### Rendering Approach
- **No tile map.** Zones are defined as rectangular regions with a floor type.
- Floor is rendered as a full-zone fill with procedural detail.
- Walls are rendered as thick lines with depth shadow.

### Floor Types

**Wood Planks (main floor):**
- 12×4px planks, staggered rows (offset by half-plank per row)
- Base colors cycle through 4 brown tones: `#8a6f4e`, `#7d6545`, `#96785a`, `#87694a`
- 1px grain lines (darker), 0.5px gap lines (darkest) between planks
- Already implemented well — keep as-is.

**Carpet (lead office):**
- Solid fill `#3a6068` with 2px dither pattern for texture
- Subtle 4px grid of slightly lighter dots to suggest pile
- 1px darker border at edges where carpet meets wall

**Tile (break room):**
- 8×8px tiles in `#e8e0d0`
- 1px grout lines in `#d0c8b8`
- Diamond accent dots at intersections in `#c8c0b0`

### Wall Rendering

Walls are 3 layers:
1. **Dark top band** (4px) — `#3a3440`
2. **Main wall** (variable height, ~28px) — `#4a4450`
3. **Baseboard** (3px) — `#5a4535` with 1px highlight on top edge

**Interior walls** (between zones): Same style but only 16px tall. Doorways are 20px-wide gaps.

**Wall shadow:** A 2px gradient strip below each wall, fading from `rgba(0,0,0,0.15)` to transparent. Gives depth.

### Furniture Catalog

All procedural. Each item is a draw function `(ctx, x, y, scale) => void`.

| Item | Size (tiles) | Location |
|------|-------------|----------|
| **Desk** (full) | 2×3 | Main floor, lead office |
| **Standing desk** | 1×2 | Sub-agent zone |
| **Office chair** | 1×1 | Behind each full desk |
| **Monitor** | 1×1 | On desk surface |
| **Laptop** | 1×1 | Alt to monitor (sub-agents) |
| **Bookshelf** | 2×2 | On walls |
| **Potted plant** | 1×1 | Corners, decoration |
| **Wall clock** | 1×1 | On wall (animated, tracks real time) |
| **Water cooler** | 1×2 | Break room |
| **Vending machine** | 1×2 | Break room — NEW |
| **Coffee machine** | 1×1 | Break room — NEW |
| **Couch** | 2×1 | Break room — NEW |
| **Landscape painting** | 2×1 | Lead office wall — NEW |
| **Whiteboard** | 2×1 | Main floor wall — NEW |
| **Server rack** | 1×2 | Optional decoration — NEW |
| **Rubber duck** | 0.5×0.5 | On random desks — Easter egg |

**New furniture drawing specs:**

**Vending machine:** 10×18px. Dark metal frame (#4a4a54), glass front showing colored rectangles (snacks), coin slot on right side, base slightly wider.

**Coffee machine:** 8×10px. Black body, chrome accents, small red power light, brown drip tray.

**Couch:** 20×10px. Cushioned look — dark blue (#3a4a6a) with lighter top edge, armrests on sides, 2px legs.

**Landscape painting:** 16×10px. Brown frame (2px border), interior shows green hills, blue sky gradient, white cloud blobs, yellow sun dot.

**Whiteboard:** 16×10px. White fill with light gray border, colored marker scribbles (random colored horizontal lines), red/blue/green marker nubs at bottom tray.

---

## Interaction

### Click to Select
- Click on character → highlight with golden glow border, show detail panel.
- Detail panel (right sidebar, 250px wide): agent name, emoji, agentId, session key, current activity, model, last message preview, parent agent (if sub-agent).
- Click empty space → deselect.
- Already implemented — keep and enhance.

### Hover Tooltip
- **NEW:** On hover over character, show a floating tooltip after 300ms delay:
  ```
  ┌─────────────────┐
  │ ⚡ Max           │
  │ coding • claude  │
  └─────────────────┘
  ```
- Pixel art styled bubble (same as status bubble but positioned at cursor).
- Disappears on mouseout.

### No Drag / No Office Editor
- Unlike Pixel Agents, we do NOT implement an office editor. The layout is programmatic and auto-arranges.
- Reason: OpenClaw agents are dynamic (configured agents + sub-agents come and go). Manual layout would constantly break.
- Future consideration: allow pinning a configured agent to the lead office via a right-click context menu.

---

## Data Flow

### Gateway → Visual State Pipeline

```
Gateway WebSocket
  ├── connect.challenge → auth handshake
  ├── agents.list → create configured agent characters (permanent)
  ├── agent.identity → fetch name/emoji/avatar per agentId
  ├── sessions.list (poll 8s) → update sub-agent roster
  └── chat event (push) → update agent activity in real-time
        │
        ▼
  StateManager
  ├── agents: Map<sessionKey, AgentState>
  ├── handleChatEvent() → classify tool_use → set activity
  ├── updateFromSessions() → add/remove sub-agents
  └── tick(dt) → idle→sleeping after 30min, animation timers
        │
        ▼
  ZoneManager (NEW)
  ├── assignZone(agent) → determine which zone agent belongs to
  ├── getTargetPosition(agent) → pixel coords for agent's current zone
  └── handles walking transitions when zone changes
        │
        ▼
  Renderer
  ├── Layer 0: Background fill
  ├── Layer 1: Floor (per zone)
  ├── Layer 2: Walls + shadows
  ├── Layer 3: Furniture (static)
  ├── Layer 4: Characters (y-sorted for depth)
  ├── Layer 5: Bubbles + effects (thought, speech, Zzz)
  └── Layer 6: UI overlays (name tags, tooltips, selection glow)
```

### Agent State Machine

```
                    ┌──────────┐
           ┌──────→│ sleeping  │←── idle > 30min
           │       └──────────┘
           │             │ chat event
           │             ▼
  ┌────────┴───┐   ┌──────────┐
  │   idle     │←──│ thinking  │←── text delta with no tool
  └────────────┘   └──────────┘
       ↑                │ tool_use detected
       │                ▼
       │         ┌─────────────┐
       │         │  coding     │←── write/edit tool
       │         │  reading    │←── read/search tool
       │         │  browsing   │←── web_search/browser tool
       │         │  running-cmd│←── exec/process tool
       │         │  communicat.│←── message/tts tool
       │         └─────────────┘
       │                │ state=final/aborted
       └────────────────┘
                        │ state=error
                        ▼
                  ┌──────────┐
                  │  error    │── auto-clears after 10s → idle
                  └──────────┘
```

### Sub-Agent Lifecycle

1. **Spawn:** `sessions.list` poll detects new session with `spawnedBy` or `:subagent:` in key.
   - Character created at right edge of sub-agent zone.
   - Walks to assigned standing desk position.
   - Parent-child dashed line drawn.

2. **Work:** Normal activity state machine applies. Sub-agent renders at 2/3 scale.

3. **Despawn:** Next `sessions.list` poll no longer includes the session.
   - Character walks toward right edge.
   - Fade out over 0.5s (alpha 1→0).
   - Remove from state.

### Activity Classification (tool name → activity)

Keep existing `classifyTool()` function. It's good. One addition:
- `image` tool → `reading` (analyzing images)
- `canvas` tool → `coding` (presenting UI)
- `subagents` tool → `communicating` (coordinating)
- `nodes` tool → `running-cmd`

---

## Technical Architecture

### File Structure

```
src/
├── main.ts              # Entry point, wires everything together
├── types.ts             # All TypeScript interfaces/types
├── state.ts             # StateManager — agent data, activity tracking
├── gateway.ts           # WebSocket connection, protocol handling
├── zones.ts             # NEW — ZoneManager, layout logic, position assignment
├── renderer.ts          # Main render loop, layer orchestration
├── sprites/
│   ├── character.ts     # Character drawing + animation
│   ├── furniture.ts     # All furniture draw functions
│   ├── environment.ts   # Floor, wall, decoration drawing
│   └── effects.ts       # Bubbles, Zzz, thought clouds, particles
├── ui.ts                # DOM-based UI (connection panel, detail panel, tooltips)
└── utils.ts             # Color helpers, hash, shared math
```

**Why split sprites.ts:** The current file is 400+ lines and growing. Each category (character, furniture, environment, effects) is independent. Splitting enables parallel work and better readability.

### Rendering Pipeline

Each frame (requestAnimationFrame at 60fps):

1. `state.tick(dt)` — update timers, activity transitions
2. `zones.update(state)` — reassign zones, calculate walking paths
3. Clear canvas
4. Draw floor zones (clip to zone rects)
5. Draw walls + shadows
6. Draw wall-mounted furniture (bookshelves, clock, painting, whiteboard)
7. Collect all ground-level items (desks, characters, floor furniture) into a single array
8. **Y-sort** the array (painter's algorithm — items with lower Y draw first, appear "behind")
9. Draw each item in sorted order
10. Draw effects layer (bubbles, Zzz) — always on top of characters
11. Draw UI overlays (name tags, tooltips, selection highlight)

### Performance

- **Dirty rectangle tracking:** Don't redraw the entire canvas every frame. Track which agents moved/changed state. Only redraw affected regions + their immediate surroundings. Fall back to full redraw if >50% of canvas is dirty.
- **Offscreen canvas caching:** Pre-render static furniture to offscreen canvases on init. Blit them each frame instead of re-executing all the fillRect calls. Invalidate only when scale changes.
- **Animation throttle:** Idle agents only need redraws at 2fps (breathing). Active agents at 10fps (typing). Only the walking state needs true 60fps. Use per-agent dirty flags.
- **Target: 60fps with 20 agents on M1 Mac.** Canvas 2D is plenty fast for this pixel count.

### Responsive Sizing

```typescript
function calculateScale(): number {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  // Base virtual canvas: 260×200 (enough for all zones)
  const sx = Math.floor(vw / 260);
  const sy = Math.floor(vh / 200);
  return Math.max(2, Math.min(4, Math.min(sx, sy)));
}
```

- Recalculate on `resize` event (debounced 100ms).
- Canvas sized to `virtualW * scale` × `virtualH * scale`, centered in viewport.
- Detail panel overlays on right side, doesn't affect canvas sizing.

---

## Implementation Priority

1. **Split sprites.ts** into `sprites/` directory (mechanical, no behavior change)
2. **Add ZoneManager** (`zones.ts`) — layout logic, zone assignment, position calculation
3. **Add walking animation** — waypoint system, character walking frames
4. **Add new furniture** (vending machine, coffee machine, couch, painting, whiteboard)
5. **Add accessories** to character generation (glasses, headphones, hat)
6. **Add hover tooltips**
7. **Add break room migration** (idle agents walk to break room)
8. **Add sub-agent spawn/despawn animation**
9. **Performance: offscreen caching + dirty rects**
10. **Add lead office zone** with wall separation

---

## What We Keep From Current Implementation

- ✅ `state.ts` — StateManager logic is solid. Keep the session polling, chat event handling, identity caching.
- ✅ `gateway.ts` — WebSocket protocol handling works. Keep as-is.
- ✅ `types.ts` — Good type definitions. Add `walking` to AgentActivity, add zone/waypoint types.
- ✅ `ui.ts` — Connection panel and detail panel work. Enhance, don't rewrite.
- ✅ Character appearance generation — The hash-based skin/hair/shirt system is good. Extend with accessories.
- ✅ Furniture drawing style — The procedural pixel art approach is correct. Just add more items.

## What Changes

- 🔄 `renderer.ts` — Refactor to use zone-based layout instead of simple grid. Add layer pipeline.
- 🔄 `sprites.ts` → `sprites/` — Split into 4 files, add new furniture and effects.
- 🆕 `zones.ts` — Entirely new. The missing piece that gives the office its spatial structure.
- 🆕 Walking system — New animation state + waypoint pathfinding.
- 🆕 Hover tooltips — New DOM-based tooltip system.

---

*This design is opinionated and complete. Master Chief can build from this without guessing. Ship it.* 🔮
