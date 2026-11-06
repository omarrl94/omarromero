import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    include: ['tests/unit/**/*.test.{ts,tsx}'],
    setupFiles: ['tests/unit/aislar-entorno.ts'],
    // Varias pruebas usan la misma carpeta temporal (.blobs-local): de una en una, sin carreras.
    fileParallelism: false,
    environment: 'node',
  },
});
