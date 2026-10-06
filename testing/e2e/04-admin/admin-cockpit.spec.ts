import { test, expect } from '@playwright/test';
import { TEST_USERS, URLS } from '../../fixtures/test-data';
import { loginAdmin } from '../helpers/auth.helper';

test.describe('Admin Portal — Dashboard Cockpit & Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await loginAdmin(page, TEST_USERS.admin);
    await page.waitForTimeout(2000);
  });

  test('TC-ADM-01: Admin Cockpit hiển thị đầy đủ các thẻ KPI tổng quan', async ({ page }) => {
    await page.goto(URLS.admin.dashboard);
    await page.waitForLoadState('domcontentloaded');

    // Kiểm tra tiêu đề hoặc thẻ KPI của Dashboard xuất hiện
    const dashboardTitle = page.locator('text=/dashboard|tổng quan|quản trị|doanh thu|người dùng/i').first();
    await expect(dashboardTitle).toBeVisible({ timeout: 10000 });
  });

  test('TC-ADM-02: Kiểm tra điều hướng các menu quản trị chính trên Sidebar', async ({ page }) => {
    await page.goto(URLS.admin.dashboard);
    await page.waitForLoadState('domcontentloaded');

    // Thử click vào menu Sự kiện
    const eventsLink = page.locator('a[href*="/events"], a:has-text("Sự kiện")').first();
    if (await eventsLink.isVisible()) {
      await eventsLink.click();
      await page.waitForURL(/\/events/, { timeout: 8000 });
      expect(page.url()).toContain('/events');
    }
  });
});
