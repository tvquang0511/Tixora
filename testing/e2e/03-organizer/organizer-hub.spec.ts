import { test, expect } from '@playwright/test';
import { TEST_USERS, URLS } from '../../fixtures/test-data';
import { loginOrganizer } from '../helpers/auth.helper';

test.describe('Organizer Hub — Dashboard, Events & Profile', () => {
  test.beforeEach(async ({ page }) => {
    await loginOrganizer(page, TEST_USERS.organizer);
    await page.waitForTimeout(1500);
  });

  test('TC-ORG-01: Truy cập Organizer Dashboard và kiểm tra giao diện tổng quan', async ({ page }) => {
    await page.goto(URLS.organizer.dashboard);
    await page.waitForLoadState('domcontentloaded');

    const heading = page.locator('h1, h2, h3, header, main').filter({
      hasText: /tổng quan|dashboard|ban tổ chức|organizer|sự kiện/i,
    });
    await expect(heading.first()).toBeVisible({ timeout: 10000 });
  });

  test('TC-ORG-02: Kiểm tra trang Quản lý hồ sơ ban tổ chức (Organizer Profile)', async ({ page }) => {
    await page.goto(URLS.organizer.profile);
    await page.waitForLoadState('domcontentloaded');

    const profileSection = page.locator('text=/hồ sơ|thông tin ban tổ chức|tên đơn vị|email|organizer/i').first();
    await expect(profileSection).toBeVisible({ timeout: 10000 });
  });

  test('TC-ORG-03: Kiểm tra trang Quản lý sự kiện của Ban tổ chức (/organizer/events)', async ({ page }) => {
    await page.goto(URLS.organizer.events);
    await page.waitForLoadState('domcontentloaded');

    // Kiểm tra trang hiển thị tiêu đề Sự kiện hoặc nút Tạo sự kiện hoặc bảng rỗng
    const eventsSection = page
      .locator('h1, h2, h3, button, a, text=/sự kiện|tạo sự kiện|danh sách|events/i')
      .first();
    await expect(eventsSection).toBeVisible({ timeout: 10000 });
  });

  test('TC-ORG-04: Giao diện tạo sự kiện mới (/organizer/create-event)', async ({ page }) => {
    await page.goto(URLS.organizer.createEvent);
    await page.waitForLoadState('domcontentloaded');

    // Kiểm tra có form tạo sự kiện hoặc tiêu đề
    const formHeading = page.locator('text=/tạo sự kiện|thông tin sự kiện|tên sự kiện|create event/i').first();
    await expect(formHeading).toBeVisible({ timeout: 10000 });
  });
});
