import { Page, expect } from '@playwright/test';
import { TEST_USERS, URLS } from '../../fixtures/test-data';

/**
 * Helper to perform login on the Audience Web App (Port 3001)
 */
export async function loginAudience(page: Page, user = TEST_USERS.audience) {
  await page.goto(URLS.web.login);
  await page.waitForLoadState('domcontentloaded');

  const emailInput = page.locator('#email, input[type="email"]').first();
  const passwordInput = page.locator('#password, input[type="password"]').first();
  const submitBtn = page.getByRole('button', { name: /đăng nhập/i });

  await expect(emailInput).toBeVisible({ timeout: 10000 });
  await emailInput.fill(user.email);
  await passwordInput.fill(user.password);
  await submitBtn.click();

  // Đợi đăng nhập hoàn tất (URL rời khỏi /login hoặc trang phản hồi)
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1000);
}

/**
 * Helper to perform login on the Admin Portal (Port 3002)
 */
export async function loginAdmin(page: Page, user = TEST_USERS.admin) {
  await page.goto(URLS.admin.login);
  await page.waitForLoadState('domcontentloaded');

  const emailInput = page.locator('input[type="email"], #email').first();
  const passwordInput = page.locator('input[type="password"], #password').first();
  const submitBtn = page.getByRole('button', { name: /đăng nhập/i });

  await expect(emailInput).toBeVisible({ timeout: 10000 });
  await emailInput.fill(user.email);
  await passwordInput.fill(user.password);
  await submitBtn.click();

  // Đợi đăng nhập hoàn tất và chuyển hướng vào /dashboard
  await page.waitForURL(/\/dashboard/, { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1000);
}

/**
 * Helper to perform login on the Organizer Hub (Web App Port 3001)
 */
export async function loginOrganizer(page: Page, user = TEST_USERS.organizer) {
  await loginAudience(page, user);
}

