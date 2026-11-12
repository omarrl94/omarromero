import { defineConfig } from '@playwright/test';
import { existsSync } from 'node:fs';

const local = '/opt/pw-browsers/chromium';
export default defineConfig({
  testDir: 'e2e',
  webServer: { command: 'npm run dev -- --port 5199', url: 'http://localhost:5199', reuseExistingServer: true },
  use: {
    baseURL: 'http://localhost:5199',
    launchOptions: existsSync(local) ? { executablePath: local, args: ['--no-sandbox'] } : {},
  },
});
