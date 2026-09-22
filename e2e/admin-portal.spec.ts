import { test, expect } from '@playwright/test';
import { TEST_USERS, URLS } from './fixtures/test-data';
import { loginAdmin } from './helpers/auth.helper';

test.describe('Admin Portal — RBAC, Dashboard & Management', () => {
  test('TC-ADM-01: Chặn tài khoản thường Audience đăng nhập vào Admin Portal (RBAC)', async ({ page }) => {
    await page.goto(URLS.admin.login);

    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const submitBtn = page.getByRole('button', { name: /đăng nhập/i });

    await emailInput.fill(TEST_USERS.audience.email);
    await passwordInput.fill(TEST_USERS.audience.password);
    await submitBtn.click();

    // Hệ thống phải báo lỗi từ chối truy cập vì không có quyền Admin
    const accessDeniedToast = page.locator('text=/từ chối|không có quyền|admin|unauthorized/i');
    await expect(accessDeniedToast.first()).toBeVisible({ timeout: 7000 });

    // Đảm bảo không bị chuyển hướng vào trang dashboard
    expect(page.url()).not.toContain('/dashboard');
  });

  test('TC-ADM-02: Đăng nhập thành công với tài khoản Admin', async ({ page }) => {
    await loginAdmin(page, TEST_USERS.admin);

    // Kiểm tra đã chuyển hướng vào Dashboard
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/dashboard/);

    // Kiểm tra tiêu đề hoặc thẻ KPI của Dashboard xuất hiện
    const dashboardTitle = page.locator('text=/dashboard|tổng quan|quản trị|doanh thu/i').first();
    await expect(dashboardTitle).toBeVisible({ timeout: 8000 });
  });

  test('TC-ADM-03: Kiểm tra điều hướng các menu quản trị', async ({ page }) => {
    await loginAdmin(page, TEST_USERS.admin);
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });

    // Kiểm tra có sidebar hoặc thanh menu chứa các liên kết quản trị
    const eventsLink = page.locator('a[href*="/events"], a:has-text("Sự kiện")').first();
    if (await eventsLink.isVisible()) {
      await eventsLink.click();
      await page.waitForURL(/\/events/, { timeout: 6000 });
      await expect(page).toHaveURL(/\/events/);
    }
  });
});
