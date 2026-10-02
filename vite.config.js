import { defineConfig } from 'vite';

export default defineConfig({
  // relative paths so the build works on GitHub Pages (served from /3D-Island-Game/)
  base: './',
  server: { port: 5173, open: false },
  build: { chunkSizeWarningLimit: 2000 },
});
