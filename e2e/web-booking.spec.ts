import { test, expect } from '@playwright/test';
import { TEST_USERS, URLS } from './fixtures/test-data';
import { loginAudience } from './helpers/auth.helper';

test.describe('Web App — Ticket Selection & Booking Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Đăng nhập trước khi thực hiện luồng đặt vé
    await loginAudience(page, TEST_USERS.audience);
    await page.waitForTimeout(1000);
  });

  test('TC-BOOK-01: Truy cập trang concert và kiểm tra các nút chọn vé', async ({ page }) => {
    await page.goto(URLS.web.home);
    const firstConcert = page.locator('a[href*="/concerts/"]').first();
    await expect(firstConcert).toBeVisible({ timeout: 8000 });
    await firstConcert.click();

    await expect(page).toHaveURL(/\/concerts\/.+/);

    // Kiểm tra có nút chọn số lượng hoặc nút mua vé
    const buyButtonOrTicketRow = page.locator('button:has-text("Mua"), button:has-text("Đặt vé"), button:has-text("+"), [data-testid="ticket-category"]').first();
    await expect(buyButtonOrTicketRow).toBeVisible({ timeout: 8000 });
  });

  test('TC-BOOK-02: Kiểm tra trang Quản lý vé của tôi', async ({ page }) => {
    await page.goto(URLS.web.myTickets);
    await page.waitForLoadState('domcontentloaded');

    // Kiểm tra trang hiển thị tiêu đề Vé của tôi
    const pageHeader = page.locator('h1, h2, h3').filter({ hasText: /vé của tôi|my tickets|danh sách vé/i });
    await expect(pageHeader.first()).toBeVisible({ timeout: 8000 });
  });
});
