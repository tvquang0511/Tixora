import { test, expect } from '@playwright/test';
import { TEST_USERS, URLS } from '../../fixtures/test-data';
import { loginAdmin } from '../helpers/auth.helper';

test.describe('Authentication & RBAC — Admin Portal (:3002)', () => {
  test('TC-AUTH-06: Chặn tài khoản thường Audience đăng nhập vào Admin Portal (RBAC Guard)', async ({ page }) => {
    await page.goto(URLS.admin.login);
    await page.waitForLoadState('domcontentloaded');

    const emailInput = page.locator('input[type="email"], #email');
    const passwordInput = page.locator('input[type="password"], #password');
    const submitBtn = page.getByRole('button', { name: /đăng nhập/i });

    await emailInput.fill(TEST_USERS.audience.email);
    await passwordInput.fill(TEST_USERS.audience.password);
    await submitBtn.click();
    await page.waitForTimeout(2000);

    // Tuyệt đối không được phép chuyển hướng vào /dashboard
    expect(page.url()).not.toContain('/dashboard');

    // Phải hiển thị thông báo lỗi hoặc giữ nguyên tại trang đăng nhập
    const isStillOnLogin = page.url().includes('/login');
    expect(isStillOnLogin).toBeTruthy();
  });

  test('TC-AUTH-07: Đăng nhập thành công với tài khoản Admin hợp lệ', async ({ page }) => {
    await loginAdmin(page, TEST_USERS.admin);
    await page.waitForTimeout(3000);

    // Chuyển hướng vào Dashboard hoặc hiển thị thông tin quản trị
    const currentUrl = page.url();
    const isDashboard = currentUrl.includes('/dashboard') || !currentUrl.includes('/login');
    expect(isDashboard).toBeTruthy();

    const dashboardIndicator = page.locator('text=/dashboard|tổng quan|quản trị|doanh thu|người dùng/i');
    await expect(dashboardIndicator.first()).toBeVisible({ timeout: 10000 });
  });
});
