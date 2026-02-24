# Asset Licenses

## Pixel Agents character pipeline assets (`public/assets/pixel-agents/characters/char_*.png`)

Character visuals and animation frame layout are reused from:

- **pablodelucca/pixel-agents**
- Source: https://github.com/pablodelucca/pixel-agents
- License: **MIT**
- Upstream files referenced:
  - `webview-ui/public/assets/characters/char_0.png` ... `char_5.png`
  - `webview-ui/src/office/engine/characters.ts` (state/frame behavior reference)
  - `webview-ui/src/office/sprites/spriteData.ts` (sprite format + frame layout reference)

### Integration notes

- Pixel Claw now renders agents from Pixel Agents character sheets directly.
- Existing app state mapping remains (`idle`, `coding/typing`, `thinking`, `walking`, `sleeping`).
- Sleeping remains represented via idle pose + existing Zzz effect to preserve app behavior.
