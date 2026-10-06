import { test, expect } from '@playwright/test';
import { TEST_CONCERTS, URLS } from '../../fixtures/test-data';

test.describe('Audience — Event Catalog & Discovery', () => {
  test('TC-CAT-01: Trang chủ tải danh sách sự kiện và Banner nổi bật', async ({ page }) => {
    await page.goto(URLS.web.home);
    await page.waitForLoadState('domcontentloaded');

    // Kiểm tra có tiêu đề hoặc banner chính
    const heading = page.locator('h1, h2, nav').first();
    await expect(heading).toBeVisible({ timeout: 10000 });

    // Kiểm tra có ít nhất một card sự kiện hiển thị
    const eventCards = page.locator('article, [data-testid="concert-card"], a[href*="/concerts/"]');
    await expect(eventCards.first()).toBeVisible({ timeout: 10000 });
  });

  test('TC-CAT-02: Tìm kiếm sự kiện theo từ khóa', async ({ page }) => {
    await page.goto(URLS.web.home);
    await page.waitForLoadState('domcontentloaded');

    const searchInput = page.locator('input[type="search"], input[placeholder*="Tìm"], input[placeholder*="tìm"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill(TEST_CONCERTS.anhTraiChongGai.searchKeyword);
      await searchInput.press('Enter');
      await page.waitForTimeout(1500);

      const matchText = page.locator(`text=/${TEST_CONCERTS.anhTraiChongGai.searchKeyword}/i`).first();
      await expect(matchText).toBeVisible({ timeout: 8000 });
    }
  });

  test('TC-CAT-03: Xem chi tiết sự kiện, thông tin địa điểm và hạng vé', async ({ page }) => {
    await page.goto(URLS.web.home);
    await page.waitForLoadState('domcontentloaded');

    // Bấm vào concert đầu tiên trong danh sách
    const firstConcertLink = page.locator('a[href*="/concerts/"]').first();
    await expect(firstConcertLink).toBeVisible({ timeout: 10000 });
    await firstConcertLink.click();

    // Chờ điều hướng vào trang chi tiết concert
    await page.waitForURL(/\/concerts\/.+/, { timeout: 10000 });
    expect(page.url()).toMatch(/\/concerts\/.+/);

    // Kiểm tra thông tin địa điểm hoặc khu vực mua vé
    const contentIndicator = page.locator('text=/địa điểm|thời gian|sự kiện|giá vé|vé|mua vé|chọn vé/i').first();
    await expect(contentIndicator).toBeVisible({ timeout: 10000 });
  });
});
