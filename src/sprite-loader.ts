export interface CharacterSet {
  stand: HTMLImageElement;
  hold: HTMLImageElement;
  reload: HTMLImageElement;
}

export interface SpriteSheets {
  tilemap: HTMLImageElement;
  characters: Record<string, CharacterSet>;
}

let sheets: SpriteSheets | null = null;
let loading = false;
let loaded = false;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error(`Failed to load ${src}: ${e}`));
    img.src = src;
  });
}

export async function loadSpriteSheets(): Promise<SpriteSheets> {
  if (sheets) return sheets;
  if (loading) {
    return new Promise((resolve) => {
      const check = () => {
        if (sheets) resolve(sheets);
        else setTimeout(check, 50);
      };
      check();
    });
  }

  loading = true;
  try {
    const [tilemap, ...chars] = await Promise.all([
      loadImage('kenney/env/tilemap_packed.png'),
      loadImage('kenney/chars/manBlue_stand.png'),
      loadImage('kenney/chars/manBlue_hold.png'),
      loadImage('kenney/chars/manBlue_reload.png'),
      loadImage('kenney/chars/manBrown_stand.png'),
      loadImage('kenney/chars/manBrown_hold.png'),
      loadImage('kenney/chars/manBrown_reload.png'),
      loadImage('kenney/chars/womanGreen_stand.png'),
      loadImage('kenney/chars/womanGreen_hold.png'),
      loadImage('kenney/chars/womanGreen_reload.png'),
      loadImage('kenney/chars/robot1_stand.png'),
      loadImage('kenney/chars/robot1_hold.png'),
      loadImage('kenney/chars/robot1_reload.png'),
    ]);

    const characters: Record<string, CharacterSet> = {
      max: { stand: chars[0], hold: chars[1], reload: chars[2] },
      chief: { stand: chars[3], hold: chars[4], reload: chars[5] },
      cortana: { stand: chars[6], hold: chars[7], reload: chars[8] },
      ghost: { stand: chars[9], hold: chars[10], reload: chars[11] },
    };

    sheets = { tilemap, characters };
    loaded = true;
    return sheets;
  } catch (e) {
    console.warn('CC0 sprite sheets failed to load, falling back to procedural:', e);
    loading = false;
    throw e;
  }
}

export function getSheets(): SpriteSheets | null {
  return sheets;
}

export function spritesLoaded(): boolean {
  return loaded;
}
