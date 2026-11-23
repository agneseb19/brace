import { defineConfig } from 'vite';

export default defineConfig({
  // GitHub Pages serves the site from /<repo>/; the deploy workflow sets VITE_BASE
  base: process.env.VITE_BASE || '/',
  server: { open: true },
});
