import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export default defineConfig({
  plugins: [react()],
  // Cache fuera del proyecto: evita bloqueos si la carpeta esta en OneDrive/Drive.
  cacheDir: join(tmpdir(), 'vite-orientafp-cache'),
  server: { port: 5173, open: true },
  build: { outDir: 'dist', emptyOutDir: false },
});
