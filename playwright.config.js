import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser',
  timeout: 180000,
  workers: 1,
  retries: 0,
  use: {
    baseURL: 'http://localhost:4175',
    channel: 'msedge',
    headless: true,
    trace: 'retain-on-failure',
  },
  reporter: [['list'], ['json', { outputFile: 'docs/browser-results.json' }]],
  webServer: {
    command: 'node server/index.js --test',
    url: 'http://localhost:4175/api/health',
    reuseExistingServer: true,
    timeout: 30000,
  },
});
