import { test, expect } from '@playwright/test';
import { TEST_CONCERTS, URLS } from './fixtures/test-data';

test.describe('Web App — Catalog & Event Discovery', () => {
  test('TC-CAT-01: Trang chủ tải danh sách sự kiện thành công', async ({ page }) => {
    await page.goto(URLS.web.home);
    await page.waitForLoadState('domcontentloaded');

    // Kiểm tra có tiêu đề hoặc banner chính
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();

    // Kiểm tra có ít nhất một card sự kiện hiển thị
    const eventCards = page.locator('article, [data-testid="concert-card"], a[href*="/concerts/"]');
    await expect(eventCards.first()).toBeVisible({ timeout: 8000 });
  });

  test('TC-CAT-02: Tìm kiếm sự kiện theo từ khóa', async ({ page }) => {
    await page.goto(URLS.web.home);

    const searchInput = page.locator('input[type="search"], input[placeholder*="Tìm"], input[placeholder*="tìm"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill(TEST_CONCERTS.anhTraiChongGai.searchKeyword);
      await searchInput.press('Enter');

      // Danh sách lọc hiển thị kết quả liên quan
      await page.waitForTimeout(1000);
      const matchText = page.locator(`text=/${TEST_CONCERTS.anhTraiChongGai.searchKeyword}/i`).first();
      await expect(matchText).toBeVisible({ timeout: 6000 });
    }
  });

  test('TC-CAT-03: Xem chi tiết sự kiện và bảng giá vé', async ({ page }) => {
    await page.goto(URLS.web.home);

    // Bấm vào concert đầu tiên trong danh sách
    const firstConcertLink = page.locator('a[href*="/concerts/"]').first();
    await expect(firstConcertLink).toBeVisible({ timeout: 8000 });
    await firstConcertLink.click();

    // Kiểm tra URL đã chuyển sang trang chi tiết
    await expect(page).toHaveURL(/\/concerts\/.+/);

    // Kiểm tra sự xuất hiện của thông tin địa điểm và danh sách hạng vé
    const ticketSection = page.locator('text=/hạng vé|loại vé|chọn vé|vé/i').first();
    await expect(ticketSection).toBeVisible({ timeout: 8000 });
  });
});
