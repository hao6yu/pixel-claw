import type { AgentActivity } from '../types';
import { pxAt, darken, lighten, hashNum } from '../utils';
import { getSheets } from '../sprite-loader';
import { getCharName, CHAR_IDLE_ATLAS, CHAR_ACTION_ATLAS } from '../atlas';
import type { SpriteRect } from '../atlas';

const SKIN_TONES = ['#f5d0a9', '#e8b88a', '#d4a574', '#c68c5b', '#a0704a', '#7a5435'];
const HAIR_COLORS = ['#2a1a0a', '#4a2a10', '#8b6040', '#c0a060', '#e0c080', '#d04030', '#303030', '#f0e0c0'];
const PANTS_COLORS = ['#3a4a6a', '#4a4a54', '#8a7a5a', '#3a5a4a'];

interface AgentAppearance {
  skinColor: string;
  skinShadow: string;
  hairColor: string;
  hairShadow: string;
  hairStyle: number;
  shirtColor: string;
  shirtShadow: string;
  pantsColor: string;
  pantsShadow: string;
  eyeColor: string;
  accessory: number; // 0=none, 1=glasses, 2=headphones, 3=hat
}

function getAppearance(agentId: string, shirtColor: string): AgentAppearance {
  const h = hashNum(agentId);
  const skinColor = SKIN_TONES[h % SKIN_TONES.length];
  const hairColor = HAIR_COLORS[(h >> 3) % HAIR_COLORS.length];
  const hairStyle = (h >> 6) % 6;
  const pantsColor = PANTS_COLORS[(h >> 9) % PANTS_COLORS.length];
  const accessory = (h >> 12) % 4;
  return {
    skinColor,
    skinShadow: darken(skinColor, 0.15),
    hairColor,
    hairShadow: darken(hairColor, 0.2),
    hairStyle,
    shirtColor,
    shirtShadow: darken(shirtColor, 0.25),
    pantsColor,
    pantsShadow: darken(pantsColor, 0.2),
    eyeColor: '#1a1a1a',
    accessory,
  };
}

/** Try to draw character from sprite sheet. Returns true if drawn. */
function drawCharacterSprite(
  ctx: CanvasRenderingContext2D,
  baseX: number, baseY: number,
  activity: AgentActivity,
  scale: number,
  agentId: string,
  globalTime: number,
): boolean {
  const sheets = getSheets();
  if (!sheets) return false;

  const name = getCharName(agentId);
  let sheet: HTMLImageElement;
  let rect: SpriteRect | undefined;

  if (activity === 'walking') {
    sheet = sheets.charsAction;
    const walkFrame = Math.floor(globalTime * 4) % 2;
    rect = CHAR_ACTION_ATLAS[`${name}-walk${walkFrame + 1}`];
  } else if (activity === 'sleeping') {
    sheet = sheets.charsAction;
    rect = CHAR_ACTION_ATLAS[`${name}-sleeping`];
  } else if (activity === 'thinking') {
    sheet = sheets.charsIdle;
    rect = CHAR_IDLE_ATLAS[`${name}-thinking`];
  } else if (activity === 'coding' || activity === 'browsing' || activity === 'running-cmd' || activity === 'reading') {
    sheet = sheets.charsIdle;
    rect = CHAR_IDLE_ATLAS[`${name}-typing`];
  } else {
    // idle, communicating, error, etc
    sheet = sheets.charsIdle;
    rect = CHAR_IDLE_ATLAS[`${name}-idle`];
  }

  if (!rect) return false;

  ctx.imageSmoothingEnabled = false;
  // Character sprites are 256x512 in the PNG, draw them scaled to ~16x24 virtual pixels
  const destW = 16 * scale;
  const destH = 24 * scale;
  // Center horizontally on baseX, align bottom
  const destX = Math.round(baseX);
  const destY = Math.round(baseY);

  ctx.drawImage(
    sheet,
    rect.x, rect.y, rect.w, rect.h,
    destX, destY, destW, destH,
  );
  return true;
}

export function drawCharacter(
  ctx: CanvasRenderingContext2D,
  baseX: number, baseY: number,
  color: string,
  activity: AgentActivity,
  frame: number,
  scale: number,
  agentId: string = 'default',
  globalTime: number = 0,
  accessoryOverride?: number,
) {
  ctx.imageSmoothingEnabled = false;

  // Try sprite sheet first
  if (drawCharacterSprite(ctx, baseX, baseY, activity, scale, agentId, globalTime)) {
    return;
  }

  // Fallback to procedural drawing
  const s = scale;
  const a = getAppearance(agentId, color);
  if (accessoryOverride !== undefined) a.accessory = accessoryOverride;
  const bx = baseX / s;
  const by = baseY / s;

  // Animation offsets
  const breathe = activity === 'idle' ? Math.sin(globalTime * 2) * 0.5 : 0;
  const typeBob = (activity === 'coding' || activity === 'browsing' || activity === 'running-cmd')
    ? Math.sin(globalTime * 8) * 0.5 : 0;
  const thinkBob = activity === 'thinking' ? Math.sin(globalTime * 1.5) * 0.3 : 0;
  const bob = Math.round(breathe + typeBob + thinkBob);

  // Walking animation
  const isWalking = activity === 'walking';
  const walkFrame = isWalking ? Math.floor(globalTime * 8) % 4 : 0;
  const walkBob = isWalking ? Math.abs(Math.sin(globalTime * 8 * Math.PI)) * 0.5 : 0;

  const blinkCycle = Math.floor(globalTime * 2) % 20;
  const isBlinking = blinkCycle === 0;

  // Hair back layer
  if (a.hairStyle === 2 || a.hairStyle === 5) {
    pxAt(ctx, bx, by, 3, 1 + bob, 10, 10, a.hairShadow, s);
  }

  // Head
  pxAt(ctx, bx, by, 4, 2 + bob - walkBob, 8, 8, a.skinColor, s);
  pxAt(ctx, bx, by, 10, 3 + bob - walkBob, 2, 6, a.skinShadow, s);
  pxAt(ctx, bx, by, 4, 8 + bob - walkBob, 8, 2, a.skinShadow, s);

  // Hair
  drawHair(ctx, bx, by + bob - walkBob, a, s);

  // Headphones (draw before eyes, over hair)
  if (a.accessory === 2) {
    drawHeadphones(ctx, bx, by + bob - walkBob, s);
  }

  // Hat (replaces top hair)
  if (a.accessory === 3) {
    drawHat(ctx, bx, by + bob - walkBob, a, s);
  }

  // Eyes
  const eyeY = 5 + bob - walkBob;
  if (activity === 'sleeping') {
    pxAt(ctx, bx, by, 5, eyeY + 1, 2, 1, a.eyeColor, s);
    pxAt(ctx, bx, by, 9, eyeY + 1, 2, 1, a.eyeColor, s);
  } else if (activity === 'error') {
    pxAt(ctx, bx, by, 5, eyeY, 1, 1, '#e03030', s);
    pxAt(ctx, bx, by, 6, eyeY + 1, 1, 1, '#e03030', s);
    pxAt(ctx, bx, by, 5, eyeY + 2, 1, 1, '#e03030', s);
    pxAt(ctx, bx, by, 9, eyeY, 1, 1, '#e03030', s);
    pxAt(ctx, bx, by, 10, eyeY + 1, 1, 1, '#e03030', s);
    pxAt(ctx, bx, by, 9, eyeY + 2, 1, 1, '#e03030', s);
  } else if (activity === 'reading') {
    if (isBlinking) {
      pxAt(ctx, bx, by, 5, eyeY + 2, 2, 1, a.eyeColor, s);
      pxAt(ctx, bx, by, 9, eyeY + 2, 2, 1, a.eyeColor, s);
    } else {
      pxAt(ctx, bx, by, 5, eyeY + 1, 2, 2, a.eyeColor, s);
      pxAt(ctx, bx, by, 9, eyeY + 1, 2, 2, a.eyeColor, s);
      pxAt(ctx, bx, by, 6, eyeY + 1, 1, 1, '#fff', s);
      pxAt(ctx, bx, by, 10, eyeY + 1, 1, 1, '#fff', s);
    }
  } else if (activity === 'thinking') {
    if (isBlinking) {
      pxAt(ctx, bx, by, 6, eyeY, 2, 1, a.eyeColor, s);
      pxAt(ctx, bx, by, 10, eyeY, 2, 1, a.eyeColor, s);
    } else {
      pxAt(ctx, bx, by, 5, eyeY, 2, 2, a.eyeColor, s);
      pxAt(ctx, bx, by, 9, eyeY, 2, 2, a.eyeColor, s);
      pxAt(ctx, bx, by, 6, eyeY, 1, 1, '#fff', s);
      pxAt(ctx, bx, by, 10, eyeY, 1, 1, '#fff', s);
    }
  } else {
    if (isBlinking) {
      pxAt(ctx, bx, by, 5, eyeY + 1, 2, 1, a.eyeColor, s);
      pxAt(ctx, bx, by, 9, eyeY + 1, 2, 1, a.eyeColor, s);
    } else {
      pxAt(ctx, bx, by, 5, eyeY, 2, 2, a.eyeColor, s);
      pxAt(ctx, bx, by, 9, eyeY, 2, 2, a.eyeColor, s);
      pxAt(ctx, bx, by, 5, eyeY, 1, 1, '#fff', s);
      pxAt(ctx, bx, by, 9, eyeY, 1, 1, '#fff', s);
    }
  }

  // Glasses (after eyes)
  if (a.accessory === 1) {
    drawGlasses(ctx, bx, by + bob - walkBob, s);
  }

  // Mouth
  if (activity === 'communicating') {
    const open = Math.floor(globalTime * 6) % 2 === 0;
    pxAt(ctx, bx, by, 7, 8 + bob - walkBob, 2, open ? 2 : 1, '#c04050', s);
  } else if (activity === 'error') {
    pxAt(ctx, bx, by, 6, 9 + bob, 1, 1, '#c04050', s);
    pxAt(ctx, bx, by, 7, 8 + bob, 2, 1, '#c04050', s);
    pxAt(ctx, bx, by, 9, 9 + bob, 1, 1, '#c04050', s);
  } else {
    pxAt(ctx, bx, by, 7, 8 + bob - walkBob, 2, 1, darken(a.skinColor, 0.3), s);
  }

  // Body / Shirt
  pxAt(ctx, bx, by, 4, 10 + bob, 8, 6, a.shirtColor, s);
  pxAt(ctx, bx, by, 10, 10 + bob, 2, 6, a.shirtShadow, s);
  pxAt(ctx, bx, by, 6, 10 + bob, 4, 1, lighten(a.shirtColor, 0.15), s);
  // Clothing wrinkle lines
  pxAt(ctx, bx, by, 5, 12 + bob, 3, 1, darken(a.shirtColor, 0.08), s);
  pxAt(ctx, bx, by, 6, 14 + bob, 2, 1, darken(a.shirtColor, 0.06), s);
  // Collar detail
  pxAt(ctx, bx, by, 6, 10 + bob, 4, 1, lighten(a.shirtColor, 0.2), s);
  pxAt(ctx, bx, by, 7, 10 + bob, 2, 1, darken(a.shirtColor, 0.05), s);

  // Arms
  if (isWalking) {
    // Arms swing while walking
    const swing = Math.sin(globalTime * 8 * Math.PI) * 2;
    pxAt(ctx, bx, by, 2, 11 + bob + Math.round(swing), 2, 5, a.shirtColor, s);
    pxAt(ctx, bx, by, 2, 16 + bob + Math.round(swing), 2, 1, a.skinColor, s);
    pxAt(ctx, bx, by, 12, 11 + bob - Math.round(swing), 2, 5, a.shirtShadow, s);
    pxAt(ctx, bx, by, 12, 16 + bob - Math.round(swing), 2, 1, a.skinShadow, s);
  } else if (activity === 'coding' || activity === 'browsing' || activity === 'running-cmd') {
    const armAnim = Math.floor(globalTime * 6) % 2;
    pxAt(ctx, bx, by, 2, 11 + bob, 2, 3, a.shirtColor, s);
    pxAt(ctx, bx, by, 1, 14 + bob, 2, 1, a.skinColor, s);
    pxAt(ctx, bx, by, 12, 11 + bob, 2, 3, a.shirtColor, s);
    pxAt(ctx, bx, by, 13, 14 + bob - armAnim, 2, 1, a.skinColor, s);
  } else if (activity === 'thinking') {
    pxAt(ctx, bx, by, 2, 11 + bob, 2, 5, a.shirtColor, s);
    pxAt(ctx, bx, by, 12, 11 + bob, 2, 2, a.shirtColor, s);
    pxAt(ctx, bx, by, 10, 8 + bob, 2, 1, a.skinColor, s);
    pxAt(ctx, bx, by, 11, 9 + bob, 2, 2, a.shirtColor, s);
  } else {
    pxAt(ctx, bx, by, 2, 11 + bob, 2, 5, a.shirtColor, s);
    pxAt(ctx, bx, by, 2, 16 + bob, 2, 1, a.skinColor, s);
    pxAt(ctx, bx, by, 12, 11 + bob, 2, 5, a.shirtShadow, s);
    pxAt(ctx, bx, by, 12, 16 + bob, 2, 1, a.skinShadow, s);
  }

  // Pants crease detail
  if (!isWalking) {
    pxAt(ctx, bx, by, 6, 17, 1, 1, darken(a.pantsColor, 0.08), s);
    pxAt(ctx, bx, by, 9, 17, 1, 1, darken(a.pantsColor, 0.12), s);
  }

  // Pants / Legs
  if (isWalking) {
    // Alternating leg positions
    const legPhase = walkFrame;
    if (legPhase === 0 || legPhase === 2) {
      pxAt(ctx, bx, by, 4, 16, 3, 3, a.pantsColor, s);
      pxAt(ctx, bx, by, 9, 16, 3, 3, a.pantsShadow, s);
      pxAt(ctx, bx, by, 3, 19, 4, 1, '#2a2020', s);
      pxAt(ctx, bx, by, 9, 19, 4, 1, '#2a2020', s);
    } else if (legPhase === 1) {
      pxAt(ctx, bx, by, 3, 16, 3, 3, a.pantsColor, s);
      pxAt(ctx, bx, by, 10, 16, 3, 2, a.pantsShadow, s);
      pxAt(ctx, bx, by, 2, 19, 4, 1, '#2a2020', s);
      pxAt(ctx, bx, by, 10, 18, 4, 1, '#2a2020', s);
    } else {
      pxAt(ctx, bx, by, 5, 16, 3, 2, a.pantsColor, s);
      pxAt(ctx, bx, by, 9, 16, 3, 3, a.pantsShadow, s);
      pxAt(ctx, bx, by, 5, 18, 4, 1, '#2a2020', s);
      pxAt(ctx, bx, by, 9, 19, 4, 1, '#2a2020', s);
    }
  } else {
    pxAt(ctx, bx, by, 4, 16, 8, 3, a.pantsColor, s);
    pxAt(ctx, bx, by, 4, 16, 3, 3, a.pantsColor, s);
    pxAt(ctx, bx, by, 9, 16, 3, 3, a.pantsShadow, s);
    pxAt(ctx, bx, by, 3, 19, 4, 1, '#2a2020', s);
    pxAt(ctx, bx, by, 9, 19, 4, 1, '#2a2020', s);
  }

  // Error exclamation
  if (activity === 'error') {
    pxAt(ctx, bx, by, 7, -2, 2, 3, '#e03030', s);
    pxAt(ctx, bx, by, 7, 2, 2, 1, '#e03030', s);
  }
}

function drawHair(ctx: CanvasRenderingContext2D, bx: number, by: number, a: AgentAppearance, s: number) {
  switch (a.hairStyle) {
    case 0:
      pxAt(ctx, bx, by, 4, 1, 8, 3, a.hairColor, s);
      pxAt(ctx, bx, by, 3, 2, 1, 3, a.hairColor, s);
      pxAt(ctx, bx, by, 12, 2, 1, 3, a.hairColor, s);
      pxAt(ctx, bx, by, 5, 0, 2, 1, a.hairColor, s);
      pxAt(ctx, bx, by, 8, 0, 2, 1, a.hairColor, s);
      break;
    case 1:
      pxAt(ctx, bx, by, 4, 1, 8, 3, a.hairColor, s);
      pxAt(ctx, bx, by, 3, 2, 1, 4, a.hairColor, s);
      pxAt(ctx, bx, by, 12, 2, 1, 4, a.hairColor, s);
      pxAt(ctx, bx, by, 7, 1, 1, 2, a.hairShadow, s);
      break;
    case 2:
      pxAt(ctx, bx, by, 3, 1, 10, 3, a.hairColor, s);
      pxAt(ctx, bx, by, 2, 3, 2, 8, a.hairColor, s);
      pxAt(ctx, bx, by, 12, 3, 2, 8, a.hairColor, s);
      break;
    case 3:
      pxAt(ctx, bx, by, 4, 1, 8, 2, a.hairColor, s);
      pxAt(ctx, bx, by, 3, 2, 1, 2, a.hairColor, s);
      pxAt(ctx, bx, by, 12, 2, 1, 2, a.hairColor, s);
      break;
    case 4:
      pxAt(ctx, bx, by, 6, -1, 4, 4, a.hairColor, s);
      pxAt(ctx, bx, by, 7, -2, 2, 1, a.hairColor, s);
      pxAt(ctx, bx, by, 3, 2, 1, 2, a.hairShadow, s);
      pxAt(ctx, bx, by, 12, 2, 1, 2, a.hairShadow, s);
      break;
    case 5:
      pxAt(ctx, bx, by, 3, 0, 10, 4, a.hairColor, s);
      pxAt(ctx, bx, by, 2, 1, 1, 4, a.hairColor, s);
      pxAt(ctx, bx, by, 13, 1, 1, 4, a.hairColor, s);
      pxAt(ctx, bx, by, 4, -1, 8, 1, a.hairColor, s);
      pxAt(ctx, bx, by, 5, 0, 1, 1, a.hairShadow, s);
      pxAt(ctx, bx, by, 8, 0, 1, 1, a.hairShadow, s);
      pxAt(ctx, bx, by, 11, 1, 1, 1, a.hairShadow, s);
      break;
  }
}

function drawGlasses(ctx: CanvasRenderingContext2D, bx: number, by: number, s: number) {
  // Round frames over eyes
  pxAt(ctx, bx, by, 4, 4, 4, 4, 'rgba(0,0,0,0)', s); // clear space reference
  // Left lens frame
  pxAt(ctx, bx, by, 4, 4, 4, 1, '#4a4a5a', s); // top
  pxAt(ctx, bx, by, 4, 7, 4, 1, '#4a4a5a', s); // bottom
  pxAt(ctx, bx, by, 4, 4, 1, 4, '#4a4a5a', s); // left
  pxAt(ctx, bx, by, 7, 4, 1, 4, '#4a4a5a', s); // right
  // Right lens frame
  pxAt(ctx, bx, by, 8, 4, 4, 1, '#4a4a5a', s);
  pxAt(ctx, bx, by, 8, 7, 4, 1, '#4a4a5a', s);
  pxAt(ctx, bx, by, 8, 4, 1, 4, '#4a4a5a', s);
  pxAt(ctx, bx, by, 11, 4, 1, 4, '#4a4a5a', s);
  // Bridge
  pxAt(ctx, bx, by, 7, 5, 1, 1, '#4a4a5a', s);
  // Lens tint
  pxAt(ctx, bx, by, 5, 5, 2, 2, 'rgba(180,200,230,0.15)', s);
  pxAt(ctx, bx, by, 9, 5, 2, 2, 'rgba(180,200,230,0.15)', s);
}

function drawHeadphones(ctx: CanvasRenderingContext2D, bx: number, by: number, s: number) {
  // Arc over head
  pxAt(ctx, bx, by, 3, 0, 10, 1, '#3a3a44', s);
  pxAt(ctx, bx, by, 2, 1, 1, 1, '#3a3a44', s);
  pxAt(ctx, bx, by, 13, 1, 1, 1, '#3a3a44', s);
  // Ear cups
  pxAt(ctx, bx, by, 2, 2, 2, 4, '#3a3a44', s);
  pxAt(ctx, bx, by, 2, 3, 2, 2, '#5a5a64', s); // highlight
  pxAt(ctx, bx, by, 12, 2, 2, 4, '#3a3a44', s);
  pxAt(ctx, bx, by, 12, 3, 2, 2, '#5a5a64', s);
}

function drawHat(ctx: CanvasRenderingContext2D, bx: number, by: number, a: AgentAppearance, s: number) {
  const hatColor = darken(a.shirtColor, 0.1);
  const hatHighlight = lighten(a.shirtColor, 0.1);
  // Brim
  pxAt(ctx, bx, by, 2, 2, 12, 2, hatColor, s);
  // Crown
  pxAt(ctx, bx, by, 4, -1, 8, 3, hatColor, s);
  pxAt(ctx, bx, by, 5, -2, 6, 1, hatColor, s);
  // Highlight
  pxAt(ctx, bx, by, 5, -1, 4, 1, hatHighlight, s);
  // Band
  pxAt(ctx, bx, by, 4, 1, 8, 1, darken(hatColor, 0.2), s);
}
