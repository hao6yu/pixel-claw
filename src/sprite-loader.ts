/** Loads all 4 PNG sprite sheets and exposes them for rendering */

export interface SpriteSheets {
  furniture: HTMLImageElement;
  charsIdle: HTMLImageElement;
  charsAction: HTMLImageElement;
  uiEffects: HTMLImageElement;
  donargOffice: HTMLImageElement;
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
    // Wait for existing load
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
    const [furniture, charsIdle, charsAction, uiEffects, donargOffice] = await Promise.all([
      loadImage('furniture.png'),
      loadImage('chars-idle.png'),
      loadImage('chars-action.png'),
      loadImage('ui-effects.png'),
      loadImage('assets/donarg/office-tileset-16-no-shadow.png'),
    ]);
    sheets = { furniture, charsIdle, charsAction, uiEffects, donargOffice };
    loaded = true;
    return sheets;
  } catch (e) {
    console.warn('Sprite sheets failed to load, falling back to procedural:', e);
    loading = false;
    throw e;
  }
}

/** Returns loaded sheets or null if not yet ready */
export function getSheets(): SpriteSheets | null {
  return sheets;
}

/** Whether sprites have finished loading */
export function spritesLoaded(): boolean {
  return loaded;
}
