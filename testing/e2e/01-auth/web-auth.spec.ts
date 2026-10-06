import { test, expect } from '@playwright/test';
import { TEST_USERS, URLS } from '../../fixtures/test-data';
import { loginAudience } from '../helpers/auth.helper';

test.describe('Authentication — Khách hàng (Audience Web App)', () => {
  test('TC-AUTH-01: Hiển thị form đăng nhập đầy đủ các trường', async ({ page }) => {
    await page.goto(URLS.web.login);
    await expect(page.locator('#email, input[type="email"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#password, input[type="password"]')).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: /đăng nhập/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('link', { name: /đăng ký/i })).toBeVisible({ timeout: 10000 });
  });

  test('TC-AUTH-02: Đăng nhập sai mật khẩu hiển thị thông báo lỗi', async ({ page }) => {
    await page.goto(URLS.web.login);
    await page.locator('#email, input[type="email"]').first().fill(TEST_USERS.audience.email);
    await page.locator('#password, input[type="password"]').first().fill('SaiMatKhau999!');
    await page.getByRole('button', { name: /đăng nhập/i }).click();

    // Hệ thống hiển thị Toast hoặc lỗi
    const errorMessage = page.locator('text=/thất bại|không chính xác|sai|error|invalid/i');
    await expect(errorMessage.first()).toBeVisible({ timeout: 10000 });
  });

  test('TC-AUTH-03: Bảo vệ trang cá nhân khi chưa đăng nhập (Route Guard)', async ({ page }) => {
    await page.goto(URLS.web.myTickets);
    await page.waitForTimeout(2000);

    const currentUrl = page.url();
    const isRedirectedToLogin = currentUrl.includes('/login') || currentUrl.includes('/auth');
    const hasLoginPrompt = await page.getByText(/đăng nhập/i).first().isVisible().catch(() => false);

    expect(isRedirectedToLogin || hasLoginPrompt).toBeTruthy();
  });

  test('TC-AUTH-04: Đăng nhập thành công với tài khoản Audience hợp lệ', async ({ page }) => {
    await loginAudience(page, TEST_USERS.audience);
    await page.waitForTimeout(2500);

    // Kiểm tra điều hướng hoặc sự xuất hiện của nút tài khoản/đăng xuất/vé của tôi
    const loggedInIndicator = page.locator('text=/đăng xuất|vé của tôi|tài khoản|my tickets/i');
    const isLogged = await loggedInIndicator.first().isVisible().catch(() => false);
    const notOnLogin = !page.url().endsWith('/login');

    expect(isLogged || notOnLogin).toBeTruthy();
  });

  test('TC-AUTH-05: Kiểm tra form đăng ký tài khoản mới', async ({ page }) => {
    await page.goto(URLS.web.register);
    await expect(page.locator('input[type="email"], #email')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('input[type="password"], #password').first()).toBeVisible({ timeout: 10000 });
  });
});
