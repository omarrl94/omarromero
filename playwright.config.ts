import { defineConfig, devices } from '@playwright/test';

const PUERTO = 5174;

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  workers: 3,
  retries: 0,
  reporter: [['list']],
  globalSetup: './tests/e2e/preparar.ts',
  use: { baseURL: `http://localhost:${PUERTO}`, trace: 'retain-on-failure' },
  projects: [
    { name: 'movil', use: { ...devices['Pixel 7'] } },
    { name: 'escritorio', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 860 } } },
  ],
  webServer: {
    command: `npx vite --port ${PUERTO} --strictPort`,
    url: `http://localhost:${PUERTO}`,
    reuseExistingServer: false,
    env: {
      CONECTA_MODO: 'pruebas',
      CONECTA_DATOS: 'ficticios',
      VITE_AUTH: 'prueba',
      MAIL_MODE: 'log',
      SUPERADMIN_EMAILS: 'jefa-movil@jrotero.es,jefa-escritorio@jrotero.es',
      SESSION_SECRET: 'secreto-e2e-de-al-menos-treinta-y-dos-caracteres',
    },
  },
});
