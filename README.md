# 🦀 Pixel Claw

A pixel art office visualization for [OpenClaw](https://openclaw.dev) agents. Connect to your OpenClaw Gateway and watch your AI agents work in real-time as charming pixel characters.

![Pixel Claw](https://img.shields.io/badge/status-prototype-orange)

## Features

- **Real-time agent visualization** — Each active session appears as a pixel character at a desk
- **Activity detection** — Characters animate based on what the agent is doing (thinking, coding, reading, browsing, running commands, communicating)
- **Gateway WebSocket connection** — Protocol v3 with token auth
- **Session polling** — Automatically discovers and tracks active agent sessions
- **Click to inspect** — Click any character to see session details, current activity, and last output
- **Sleeping detection** — Idle agents eventually fall asleep (zzz...)

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:5173`, enter your Gateway URL (e.g., `ws://localhost:18789`) and token, then click Connect.

## URL Parameters

You can pass connection details via URL:

```
http://localhost:5173/?gatewayUrl=ws://localhost:18789&token=your-token
```

## Build

```bash
npm run build
```

Output goes to `dist/`.

## Visual Style

Pixel Claw uses a Donarg office board backdrop plus Pixel Agents-style character rendering.

### Character pipeline attribution

Character motion feel and frame layout are adapted from the MIT-licensed Pixel Agents project:

- https://github.com/pablodelucca/pixel-agents
- See `ASSET_LICENSES.md` for details.

### Design knobs

- `src/visual-system.ts`
  - `VS.palette`: global color tokens (background, walls, trim, UI panel, text, bubble)
  - `VS.fontFamily` + `pixelFont(...)`: centralized pixel typography
- `src/renderer.ts`
  - `SUB_SCALE_FACTOR`: child-agent size ratio
  - global canvas scale clamp in `resize()`
- `src/sprites/character.ts`
  - Pixel Agents-based sprite frame selection for activity states
- `src/sprites/effects.ts`
  - thought/status bubble shape, size, and text truncation

## Tech Stack

- Vite + TypeScript
- HTML5 Canvas (no framework)
- WebSocket (OpenClaw Gateway protocol v3)

## License

MIT
