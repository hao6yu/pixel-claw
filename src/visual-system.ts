export const VS = {
  pixelUnit: 1,
  fontFamily: '"Courier New", monospace',
  palette: {
    bg: '#1a1622',
    wall: '#4b4558',
    wallTop: '#3a3447',
    trim: '#7a5f47',
    trimLight: '#9b7a5e',
    text: '#e8dcc8',
    textDim: '#b6a998',
    textAccent: '#ffcb6b',
    panel: '#2e2838',
    panelDark: '#221d2c',
    panelBorder: '#6a5a7a',
    active: '#68d39b',
    danger: '#d35f5f',
    bubble: '#f4e9d7',
    bubbleBorder: '#7d6f5d',
  },
} as const;

export function pixelFont(sizePx: number): string {
  return `${Math.round(sizePx)}px ${VS.fontFamily}`;
}
