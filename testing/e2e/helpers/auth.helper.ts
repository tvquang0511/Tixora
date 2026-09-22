import { Page, expect } from '@playwright/test';
import { TEST_USERS, URLS } from '../fixtures/test-data';

/**
 * Helper to perform login on the Audience Web App (Port 3001)
 */
export async function loginAudience(page: Page, user = TEST_USERS.audience) {
  await page.goto(URLS.web.login);
  await page.waitForLoadState('domcontentloaded');

  const emailInput = page.locator('#email');
  const passwordInput = page.locator('#password');
  const submitBtn = page.getByRole('button', { name: /đăng nhập/i });

  await expect(emailInput).toBeVisible();
  await emailInput.fill(user.email);
  await passwordInput.fill(user.password);
  await submitBtn.click();
}

/**
 * Helper to perform login on the Admin Portal (Port 3002)
 */
export async function loginAdmin(page: Page, user = TEST_USERS.admin) {
  await page.goto(URLS.admin.login);
  await page.waitForLoadState('domcontentloaded');

  const emailInput = page.locator('input[type="email"]');
  const passwordInput = page.locator('input[type="password"]');
  const submitBtn = page.getByRole('button', { name: /đăng nhập/i });

  await expect(emailInput).toBeVisible();
  await emailInput.fill(user.email);
  await passwordInput.fill(user.password);
  await submitBtn.click();
}
