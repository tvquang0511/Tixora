import { test, expect } from '@playwright/test';
import { TEST_USERS, URLS } from '../../fixtures/test-data';
import { loginAudience } from '../helpers/auth.helper';

test.describe('Audience — Ticket Selection & My Tickets Flow', () => {
  test.beforeEach(async ({ page }) => {
    await loginAudience(page, TEST_USERS.audience);
    await page.waitForTimeout(1500);
  });

  test('TC-BOOK-01: Truy cập trang concert và kiểm tra giao diện chọn vé', async ({ page }) => {
    await page.goto(URLS.web.home);
    await page.waitForLoadState('domcontentloaded');

    const firstConcert = page.locator('a[href*="/concerts/"]').first();
    await expect(firstConcert).toBeVisible({ timeout: 10000 });
    await firstConcert.click();

    await page.waitForURL(/\/concerts\/.+/, { timeout: 10000 });

    // Kiểm tra nút mua vé hoặc danh sách hạng vé
    const buyButtonOrTicketSection = page
      .locator('button, [data-testid="ticket-category"], a')
      .filter({ hasText: /mua|đặt vé|\+|chọn/i })
      .first();
    await expect(buyButtonOrTicketSection).toBeVisible({ timeout: 10000 });
  });

  test('TC-BOOK-02: Kiểm tra trang Quản lý vé của tôi (My Tickets)', async ({ page }) => {
    await page.goto(URLS.web.myTickets);
    await page.waitForLoadState('domcontentloaded');

    // Kiểm tra trang hiển thị tiêu đề hoặc danh sách vé
    const pageHeader = page.locator('h1, h2, h3, main').filter({ hasText: /vé của tôi|my tickets|danh sách vé|chưa có vé/i });
    await expect(pageHeader.first()).toBeVisible({ timeout: 10000 });
  });

  test('TC-BOOK-03: Kiểm tra trang Quản lý thông tin tài khoản cá nhân (/profile)', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForLoadState('domcontentloaded');

    // Kiểm tra trang hiển thị thông tin tài khoản hoặc tiêu đề hồ sơ
    const profileHeader = page
      .locator('h1, h2, h3, main')
      .filter({ hasText: /hồ sơ|thông tin|tài khoản|profile/i })
      .first();
    await expect(profileHeader).toBeVisible({ timeout: 12000 });
  });
});
