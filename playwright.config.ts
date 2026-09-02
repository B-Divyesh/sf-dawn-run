import { defineConfig } from '@playwright/test';

const remoteBaseURL = process.env.PLAYWRIGHT_BASE_URL;

export default defineConfig({
  testDir: './tests',
  testIgnore: '**/api.test.js',
  timeout: 30_000,
  use: { baseURL: remoteBaseURL || 'http://127.0.0.1:4173', headless: true },
  webServer: remoteBaseURL ? undefined : { command: 'npm run build && npm run preview', url: 'http://127.0.0.1:4173', reuseExistingServer: !process.env.CI }
});
