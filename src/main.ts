import { StateManager } from './state';
import { Gateway } from './gateway';
import { Renderer } from './renderer';
import { initUI } from './ui';
import { loadSpriteSheets } from './sprite-loader';

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const state = new StateManager();
const gateway = new Gateway(state);
const renderer = new Renderer(canvas, state);

initUI(state, gateway, renderer);
renderer.start();

// Load sprite sheets in background — characters will upgrade to designed art once ready.
loadSpriteSheets().catch(() => {
  // keep procedural fallback silently
});
