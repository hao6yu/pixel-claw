# Asset Licenses

## Character sprites (`public/chars-idle.png`, `public/chars-action.png`)

These sheets are custom derivative edits based on:

- **Kenney – Roguelike Characters**
- Source page: https://kenney.nl/assets/roguelike-characters
- Direct download used: https://kenney.nl/media/pages/assets/roguelike-characters/cc364edf00-1729196490/kenney_roguelike-characters.zip
- License: **Creative Commons CC0 1.0 Universal**
  - https://creativecommons.org/publicdomain/zero/1.0/

### What was modified

- Extracted base character tiles from Kenney's sprite sheet
- Reworked into project-specific 4-character cast (Max, Chief, Cortana, Ghost)
- Added state-specific variants for idle / typing / thinking / walk1 / walk2 / sleeping
- Applied per-character palette tuning for project style consistency
- Packed into the project's existing `4 cols × 3 rows` atlas layout for compatibility
