import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Tự động nạp file .env từ thư mục testing/ hoặc thư mục gốc
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

/**
 * Playwright E2E Configuration for Tixora Monorepo.
 * Covers both Web App (Port 3001) and Admin Portal (Port 3002).
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 40 * 1000,
  expect: {
    timeout: 12000,
  },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.WORKERS ? Number(process.env.WORKERS) : 2,
  outputDir: './reports/artifacts',
  reporter: [
    ['list'],
    ['html', { outputFolder: 'reports/playwright', open: 'never' }],
    ['./reporters/excel-reporter.ts']
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
      name: 'Web & Organizer App (Desktop)',
      testMatch: /(web-auth|catalog|booking|organizer-).*\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.WEB_URL || 'http://localhost:3001',
      },
    },
    {
      name: 'Admin Portal (Desktop)',
      testMatch: /admin-.*\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.ADMIN_URL || 'http://localhost:3002',
      },
    },
  ],
});
