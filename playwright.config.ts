import { defineConfig } from '@playwright/test';

const port = 4200;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `https://127.0.0.1:${port}`,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    headless: true,
  },
  webServer: {
    command: `npx ng serve --host 127.0.0.1 --port ${port}`,
    url: `https://127.0.0.1:${port}`,
    reuseExistingServer: !process.env.CI,
    ignoreHTTPSErrors: true,
    timeout: 180_000,          // Angular first compile can be slow
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
