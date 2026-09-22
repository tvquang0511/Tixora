import { test, expect } from '@playwright/test';
import { TEST_USERS, URLS } from './fixtures/test-data';
import { loginAudience } from './helpers/auth.helper';

test.describe('Web App — Authentication & Authorization', () => {
  test('TC-AUTH-01: Hiển thị form đăng nhập đầy đủ các trường', async ({ page }) => {
    await page.goto(URLS.web.login);
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.getByRole('button', { name: /đăng nhập/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /quên mật khẩu/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /đăng ký/i })).toBeVisible();
  });

  test('TC-AUTH-02: Đăng nhập sai mật khẩu hiển thị thông báo lỗi', async ({ page }) => {
    await page.goto(URLS.web.login);
    await page.locator('#email').fill(TEST_USERS.audience.email);
    await page.locator('#password').fill('SaiMatKhau123456');
    await page.getByRole('button', { name: /đăng nhập/i }).click();

    // Hệ thống phải hiển thị Toast error hoặc thông báo lỗi
    const errorMessage = page.locator('text=/thất bại|không chính xác|sai|error/i');
    await expect(errorMessage.first()).toBeVisible({ timeout: 6000 });
  });

  test('TC-AUTH-03: Bảo vệ trang cá nhân khi chưa đăng nhập (Route Guard)', async ({ page }) => {
    // Truy cập trực tiếp vào My Tickets khi chưa đăng nhập
    await page.goto(URLS.web.myTickets);

    // Hệ thống cần redirect sang login hoặc hiển thị yêu cầu đăng nhập
    await page.waitForURL(/login|\/auth/, { timeout: 7000 }).catch(() => {
      // Nếu không redirect thì kiểm tra nội dung trang có yêu cầu đăng nhập
    });
    const currentUrl = page.url();
    const isRedirectedToLogin = currentUrl.includes('/login') || currentUrl.includes('/auth');
    const hasLoginPrompt = await page.getByText(/đăng nhập/i).first().isVisible().catch(() => false);

    expect(isRedirectedToLogin || hasLoginPrompt).toBeTruthy();
  });

  test('TC-AUTH-04: Đăng nhập thành công với tài khoản Audience hợp lệ', async ({ page }) => {
    await loginAudience(page, TEST_USERS.audience);

    // Chờ điều hướng về trang chủ hoặc thông báo thành công
    await page.waitForURL((url) => url.pathname === '/' || url.pathname.includes('/catalog') || url.pathname.includes('/account'), { timeout: 8000 }).catch(() => {});

    // Kiểm tra trạng thái đã đăng nhập trên thanh điều hướng (Avatar hoặc tên user hoặc nút Đăng xuất)
    const loggedInIndicator = page.locator('text=/đăng xuất|vé của tôi|tài khoản|my tickets/i');
    await expect(loggedInIndicator.first()).toBeVisible({ timeout: 8000 });
  });
});
