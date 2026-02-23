# Pixel Claw — Prototype Spec

## What
A standalone web app that visualizes OpenClaw agents as pixel art characters in a virtual office. Connect to an OpenClaw Gateway via WebSocket and watch agents work in real-time.

## Tech Stack
- Vite + TypeScript
- HTML5 Canvas for rendering (lightweight game loop)
- No framework (vanilla — keep it minimal)
- WebSocket client for Gateway protocol v3

## Architecture

### Gateway Connection (`src/gateway.ts`)
- Connect to OpenClaw Gateway WebSocket (configurable URL + token)
- Implement protocol v3 handshake:
  1. Receive `connect.challenge` event
  2. Send `connect` request with role: "operator", client.id: "openclaw-control-ui", client.mode: "ui"
  3. For auth, send `auth: { token: "..." }` in connect params
  4. Device identity can be omitted if `dangerouslyDisableDeviceAuth` is enabled on gateway
  5. Receive `hello-ok` response with snapshot (presence, sessions, health)
- Subscribe to events: `chat` events stream agent activity
- Periodically call `sessions.list` to get active sessions
- Handle reconnection gracefully

### Frame Types
```
Request:  { type: "req", id: "<uuid>", method: "<method>", params: {...} }
Response: { type: "res", id: "<uuid>", ok: true, payload: {...} }
Event:    { type: "event", event: "<name>", payload: {...} }
```

### Key Methods to Call
- `connect` — handshake
- `sessions.list` — get active sessions (poll every 5-10s)
- Listen for `chat` events which have: `{ runId, sessionKey, seq, state: "delta"|"final"|"aborted"|"error", message, usage }`

### Agent State Detection
From `chat` events, detect what the agent is doing:
- **Thinking**: delta events streaming text (no tool calls yet)
- **Tool use**: delta events with tool_use content blocks — parse tool name:
  - `Read`, `memory_search`, `memory_get` → reading
  - `Write`, `Edit` → writing/coding
  - `exec`, `process` → running commands
  - `web_search`, `web_fetch` → browsing
  - `browser` → browsing
  - `message`, `tts` → communicating
  - `sessions_spawn`, `sessions_send` → spawning/managing agents
  - Other tools → generic "working"
- **Idle**: no active run for this session
- **Done**: `state: "final"` received
- **Error**: `state: "error"` received
- **Sleeping**: idle for >30 minutes

### Rendering (`src/renderer.ts`)
- HTML5 Canvas, 60fps game loop
- Isometric or top-down pixel office
- Each session = one character with a name tag (session label or key)
- Characters have animation states: idle, thinking, typing, reading, browsing, running-cmd, communicating, sleeping
- Simple sprite system — start with colored rectangles or very basic pixel sprites, we'll improve art later
- Office background: simple tiled floor + desks

### UI (`src/ui.ts`)
- Connection panel: Gateway URL + token inputs, connect button
- Status bar: connected/disconnected, session count
- Click a character to see details (session key, current activity, model, last message preview)

### Entry Point (`src/main.ts`)
- Initialize canvas
- Set up connection UI
- On connect: start polling sessions, subscribe to events, render characters

### Config
- Gateway URL from URL param `?gatewayUrl=ws://...` or input field
- Token from URL param `?token=...` or input field (stored in localStorage)
- Save preferences in localStorage

## File Structure
```
pixel-claw/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── src/
│   ├── main.ts          — entry point
│   ├── gateway.ts       — WS connection + protocol
│   ├── renderer.ts      — canvas rendering + game loop
│   ├── sprites.ts       — character sprite definitions
│   ├── ui.ts            — connection UI + overlays
│   ├── state.ts         — agent state management
│   └── types.ts         — TypeScript interfaces
├── public/
│   └── (sprites later)
├── README.md
└── LICENSE (MIT)
```

## MVP Goal
Connect to a real OpenClaw gateway, see characters appear for each active session, and watch them animate based on real-time agent activity. Even if the art is placeholder rectangles, the data pipeline should be solid.

## Important Notes
- The gateway WS is on the same port as HTTP (default 18789)
- Protocol version 3 is current
- `hello-ok` response includes `features.methods` and `features.events` arrays
- Chat events are broadcast to all connected operator clients
- Sessions can be main, sub-agents (spawned), cron, or channel-specific
- Keep it simple for v1 — one office room, characters at desks
