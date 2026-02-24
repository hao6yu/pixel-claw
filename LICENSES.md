# Third-Party Asset Licenses (CC0)

This project now uses Kenney CC0 assets as the visual baseline.

## 1) Kenney Tiny Town (environment / tiles / props)
- Source page: https://kenney.nl/assets/tiny-town
- Direct package used: https://kenney.nl/media/pages/assets/tiny-town/5e46f9e551-1735736916/kenney_tiny-town.zip
- Files used in repo:
  - `public/kenney/env/tilemap_packed.png`
  - `public/kenney/env/kenney-tiny-town-LICENSE.txt`
- License: **CC0 1.0 Universal** (public domain)

## 2) Kenney Top-Down Shooter (character sprites)
- Source page: https://kenney.nl/assets/top-down-shooter
- Direct package used: https://kenney.nl/media/pages/assets/top-down-shooter/4e195f4fff-1677694684/kenney_top-down-shooter.zip
- Files used in repo:
  - `public/kenney/chars/manBlue_*.png`
  - `public/kenney/chars/manBrown_*.png`
  - `public/kenney/chars/womanGreen_*.png`
  - `public/kenney/chars/robot1_*.png`
- License: **CC0 1.0 Universal** (public domain)

## Notes
- Gameplay and zone logic are unchanged; only visual assets/rendering were updated.
- Character state coverage (`idle/walk/sleep/thinking`) uses available sprite poses plus lightweight procedural overlays/offsets where an exact frame does not exist.
