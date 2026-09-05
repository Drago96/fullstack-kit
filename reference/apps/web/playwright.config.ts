import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL: 'http://localhost:3000', trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
  webServer: [
    {
      command: 'pnpm --filter api start',
      url: 'http://localhost:3001/hello',
      // mock keeps the LLM endpoint keyless, offline and deterministic under test.
      env: { PORT: '3001', LOG_LEVEL: 'warn', LLM_PROVIDER: 'mock' },
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'pnpm --filter web start',
      url: 'http://localhost:3000',
      env: { API_URL: 'http://localhost:3001' },
      reuseExistingServer: !process.env.CI,
    },
  ],
});
