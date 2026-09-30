import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config for TradieConnect web E2E. Targets the served web build.
 * Prereqs: emulators running + seeded; web served with .env.e2e (port 8082).
 */
const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:8082';

export default defineConfig({
  testDir: './web',
  testMatch: '**/*.spec.ts',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never', outputFolder: 'playwright-report' }]]
    : [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    testIdAttribute: 'data-testid',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
