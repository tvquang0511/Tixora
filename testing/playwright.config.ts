import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Configuration for Tixora Monorepo.
 * Covers both Web App (Port 3001) and Admin Portal (Port 3002).
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 35 * 1000,
  expect: {
    timeout: 7000,
  },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }]
  ],
  use: {
    baseURL: process.env.WEB_URL || 'http://localhost:3001',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    viewport: { width: 1280, height: 720 },
  },
  projects: [
    {
      name: 'Web App (Desktop Chrome)',
      testMatch: /web-.*\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.WEB_URL || 'http://localhost:3001',
      },
    },
    {
      name: 'Admin Portal (Desktop Chrome)',
      testMatch: /admin-.*\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.ADMIN_URL || 'http://localhost:3002',
      },
    },
    {
      name: 'Web App (Mobile Chrome)',
      testMatch: /web-.*\.spec\.ts/,
      use: {
        ...devices['Pixel 5'],
        baseURL: process.env.WEB_URL || 'http://localhost:3001',
      },
    },
  ],
});
