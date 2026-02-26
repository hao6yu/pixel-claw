import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: {
    allowedHosts: ['maxwells-mac-mini.tail2dbb65.ts.net'],
  },
  build: {
    outDir: 'dist',
    target: 'es2020',
  },
});
