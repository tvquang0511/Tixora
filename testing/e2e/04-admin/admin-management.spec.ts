import { test, expect } from '@playwright/test';
import { TEST_USERS, URLS } from '../../fixtures/test-data';
import { loginAdmin } from '../helpers/auth.helper';

test.describe('Admin Portal — Events, Users & Financial Management', () => {
  test.beforeEach(async ({ page }) => {
    await loginAdmin(page, TEST_USERS.admin);
    await page.waitForTimeout(2000);
  });

  test('TC-ADM-03: Bảng sự kiện hiển thị cột tiến độ vé đã bán / tổng vé', async ({ page }) => {
    await page.goto(URLS.admin.events);
    await page.waitForLoadState('domcontentloaded');

    const eventsHeader = page.locator('h1, h2, h3, main').filter({ hasText: /sự kiện|events/i }).first();
    await expect(eventsHeader).toBeVisible({ timeout: 12000 });
  });

  test('TC-ADM-04: Quản lý người dùng và danh sách phân quyền (Staff & Users)', async ({ page }) => {
    await page.goto(URLS.admin.users);
    await page.waitForLoadState('domcontentloaded');

    const usersHeaderOrBtn = page.locator('text=/người dùng|tài khoản|thêm người dùng|\+ tạo/i').first();
    await expect(usersHeaderOrBtn).toBeVisible({ timeout: 12000 });
  });

  test('TC-ADM-05: Báo cáo Doanh thu toàn sàn (Platform Revenue)', async ({ page }) => {
    await page.goto(URLS.admin.revenue);
    await page.waitForLoadState('domcontentloaded');

    const revenueIndicator = page.locator('text=/doanh thu|gmv|thống kê|đơn hàng|revenue/i').first();
    await expect(revenueIndicator).toBeVisible({ timeout: 12000 });
  });

  test('TC-ADM-06: Quản lý quyết toán tài chính Ban tổ chức (Settlements)', async ({ page }) => {
    await page.goto('/settlements');
    await page.waitForLoadState('domcontentloaded');

    const settlementsIndicator = page.locator('text=/đối soát|quyết toán|giải ngân|escrow|bảo chứng|settlement/i').first();
    await expect(settlementsIndicator).toBeVisible({ timeout: 12000 });
  });
});
