/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  // Las tipografías de la portada (woff2, ~160 KB) se incrustan: así también funciona la copia de un solo archivo
  build: { assetsInlineLimit: 200000 },
  test: { include: ['src/**/*.test.ts'], environment: 'node' },
});
