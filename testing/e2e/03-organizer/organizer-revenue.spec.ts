import { test, expect } from '@playwright/test';
import { TEST_USERS, URLS } from '../../fixtures/test-data';
import { loginOrganizer } from '../helpers/auth.helper';

test.describe('Organizer Hub — Báo Cáo Doanh Thu & Analytics', () => {
  test.beforeEach(async ({ page }) => {
    await loginOrganizer(page, TEST_USERS.organizer);
    await page.waitForTimeout(1500);
  });

  test('TC-ORG-05: Truy cập trang Báo cáo doanh thu Ban tổ chức (/organizer/revenue)', async ({ page }) => {
    await page.goto(URLS.organizer.revenue);
    await page.waitForLoadState('domcontentloaded');

    // Kiểm tra có tiêu đề trang doanh thu hoặc các thẻ KPI tài chính
    const revenueHeading = page.locator('h1, h2, h3, main').filter({
      hasText: /doanh thu|thực nhận|gmv|vé đã bán|revenue/i,
    });
    await expect(revenueHeading.first()).toBeVisible({ timeout: 10000 });
  });

  test('TC-ORG-06: Hiển thị các thẻ KPI tài chính tổng kết doanh thu', async ({ page }) => {
    await page.goto(URLS.organizer.revenue);
    await page.waitForLoadState('domcontentloaded');

    // Kiểm tra hiển thị thông tin số liệu (GMV hoặc Vé bán hoặc VND)
    const kpiMetric = page.locator('text=/tổng|doanh thu|vé|đơn hàng|vnd|đ/i').first();
    await expect(kpiMetric).toBeVisible({ timeout: 10000 });
  });
});
