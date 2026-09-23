# HƯỚNG DẪN THIẾT LẬP VÀ KIỂM THỬ TỰ ĐỘNG BẰNG PLAYWRIGHT (PLAYWRIGHT E2E TESTING GUIDE)
## HỆ THỐNG TIXORA MONOREPO

> **Tài liệu:** Hướng dẫn cài đặt, cấu hình và chạy bộ kiểm thử tự động End-to-End (E2E) với Playwright cho TIXORA  
> **Áp dụng cho:** `apps/web-app` (Port 3001), `apps/admin-app` (Port 3002), và `apps/backend-api` (Port 3000)

---

## MỤC LỤC
1. [Giới Thiệu Về Playwright Trong TIXORA](#1-giới-thiệu-về-playwright-trong-TIXORA)
2. [Cài Đặt & Khởi Tạo Playwright (Installation)](#2-cài-đặt--khởi-tạo-playwright-installation)
3. [Cấu Trúc Thư Mục Kiểm Thử (Folder Structure)](#3-cấu-trúc-thư-mục-kiểm-thử-folder-structure)
4. [File Cấu Hình Playwright (playwright.config.ts)](#4-file-cấu-hình-playwright-playwrightconfigts)
5. [Các Bộ Test Kịch Bản E2E Cốt Lõi (Core Test Suites)](#5-các-bộ-test-kịch-bản-e2e-cốt-lõi-core-test-suites)
   - [Suite 1: Xác Thực & Điều Hướng Web App (web-auth.spec.ts)](#suite-1-xác-thực--điều-hướng-web-app-web-authspects)
   - [Suite 2: Khám Phá & Tìm Kiếm Sự Kiện (web-catalog.spec.ts)](#suite-2-khám-phá--tìm-kiếm-sự-kiện-web-catalogspects)
   - [Suite 3: Luồng Chọn Vé & Giữ Chỗ (web-booking.spec.ts)](#suite-3-luồng-chọn-vé--giữ-chỗ-web-bookingspects)
   - [Suite 4: Quản Trị Hệ Thống Admin Portal (admin-portal.spec.ts)](#suite-4-quản-trị-hệ-thống-admin-portal-admin-portalspects)
6. [Hướng Dẫn Chạy Test (Execution Commands)](#6-hướng-dẫn-chạy-test-execution-commands)
   - [Chạy CLI ngầm (Headless Mode)](#chạy-cli-ngầm-headless-mode)
   - [Chạy giao diện trực quan (UI Mode & Headed)](#chạy-giao-diện-trực-quan-ui-mode--headed)
   - [Xem báo cáo HTML & Tracing (Trace Viewer)](#xem-báo-cáo-html--tracing-trace-viewer)
7. [Tích Hợp Vào CI/CD (GitHub Actions)](#7-tích-hợp-vào-cicd-github-actions)
8. [Best Practices Khi Viết E2E Test Cho TIXORA](#8-best-practices-khi-viết-e2e-test-cho-TIXORA)

---

## 1. Giới Thiệu Về Playwright Trong TIXORA

**Playwright** là framework kiểm thử tự động End-to-End (E2E) hiện đại bậc nhất hiện nay do Microsoft phát triển:
- **Hỗ trợ đa trình duyệt:** Chromium, Firefox, WebKit (Safari) và Mobile Viewport giả lập.
- **Tốc độ vượt trội & Ổn định:** Tự động chờ phần tử xuất hiện (Auto-waiting), loại bỏ hiện tượng test bị flaky (lỗi chập chờn).
- **Kiểm thử đa ứng dụng đồng thời:** Với TIXORA Monorepo, Playwright có thể dễ dàng test song song cả **Web Khách Hàng (Port 3001)** và **Admin Portal (Port 3002)** trong cùng một lần chạy.
- **Công cụ gỡ lỗi đỉnh cao:** Hỗ trợ Playwright UI Mode, Time-travel Debugging, chụp ảnh màn hình (Screenshots), quay video lỗi và xem file Trace chi tiết.

---

## 2. Cài Đặt & Khởi Tạo Playwright (Installation)

Tại thư mục gốc của monorepo TIXORA, chạy lệnh sau để cài đặt `@playwright/test`:

```powershell
pnpm add -D @playwright/test
```

Cài đặt trình duyệt (Browsers) cho Playwright:
```powershell
pnpm exec playwright install --with-deps chromium
```
*(Nếu muốn test trên cả Firefox và WebKit: `pnpm exec playwright install`)*

---

## 3. Cấu Trúc Thư Mục Kiểm Thử (Folder Structure)

Toàn bộ mã nguồn kiểm thử E2E được tổ chức tại thư mục `e2e/` ở gốc dự án:

```
tixora-monorepo/
├── e2e/
│   ├── fixtures/
│   │   └── test-data.ts           # Dữ liệu tài khoản seed & concert IDs mẫu
│   ├── helpers/
│   │   └── auth.helper.ts         # Tiện ích đăng nhập nhanh (Web & Admin)
│   ├── web-auth.spec.ts           # Kịch bản test đăng nhập, đăng xuất Web App
│   ├── web-catalog.spec.ts        # Kịch bản xem danh sách, tìm kiếm, chi tiết concert
│   ├── web-booking.spec.ts        # Kịch bản chọn vé, giữ chỗ, kiểm tra checkout
│   └── admin-portal.spec.ts       # Kịch bản đăng nhập Admin, Dashboard, RBAC
├── playwright.config.ts           # File cấu hình trung tâm của Playwright
├── package.json                   # Thêm các script test:e2e
└── docs/
    └── PLAYWRIGHT_TEST.md         # File tài liệu này
```

---

## 4. File Cấu Hình Playwright (playwright.config.ts)

File `playwright.config.ts` được thiết kế tối ưu cho monorepo:
- Tự động kiểm tra hoặc khởi động dev server nếu chưa bật (`webServer` block).
- Cấu hình 2 base URL linh hoạt: Web App (`http://localhost:3001`) và Admin Portal (`http://localhost:3002`).
- Thu thập Trace, Video và Screenshot khi test thất bại để dễ dàng điều tra lỗi.

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30 * 1000,
  expect: {
    timeout: 5000,
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }]
  ],
  use: {
    baseURL: process.env.WEB_URL || 'http://localhost:3001',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'Web App (Desktop Chrome)',
      testMatch: /web-.*\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:3001',
      },
    },
    {
      name: 'Admin Portal (Desktop Chrome)',
      testMatch: /admin-.*\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:3002',
      },
    },
    {
      name: 'Web App (Mobile Chrome)',
      testMatch: /web-.*\.spec\.ts/,
      use: {
        ...devices['Pixel 5'],
        baseURL: 'http://localhost:3001',
      },
    },
  ],
});
```

---

## 5. Các Bộ Test Kịch Bản E2E Cốt Lõi (Core Test Suites)

### Suite 1: Xác Thực & Điều Hướng Web App (web-auth.spec.ts)
Bao phủ các ca kiểm thử:
1. **Đăng nhập thành công:** Kiểm tra người dùng nhập đúng thông tin tài khoản seed (`audience1@tixora.local` / `123456`), chuyển hướng về trang chủ và hiển thị trạng thái đã đăng nhập.
2. **Đăng nhập sai mật khẩu:** Kiểm tra hiển thị thông báo lỗi phù hợp khi mật khẩu không đúng, không lưu token rác.
3. **Bảo vệ route cá nhân:** Kiểm tra khi chưa đăng nhập mà truy cập trực tiếp vào `/my-tickets`, hệ thống sẽ chặn và chuyển hướng về `/login`.
4. **Đăng xuất:** Kiểm tra sau khi đăng xuất, các thông tin định danh bị xóa sạch khỏi bộ nhớ trình duyệt.

### Suite 2: Khám Phá & Tìm Kiếm Sự Kiện (web-catalog.spec.ts)
Bao phủ các ca kiểm thử:
1. **Hiển thị danh sách sự kiện:** Trang chủ load thành công danh sách các concert nổi bật, hiển thị poster, tiêu đề, địa điểm và mức giá khởi điểm.
2. **Tìm kiếm sự kiện:** Nhập từ khóa trên thanh tìm kiếm (Search bar), danh sách kết quả phản hồi nhanh chóng theo bộ lọc.
3. **Xem chi tiết sự kiện:** Bấm vào một concert bất kỳ, chuyển hướng đến `/concerts/:id`, kiểm tra các thành phần:
   - Tên sự kiện & Thông tin địa điểm.
   - Sơ đồ sân khấu (Seatmap).
   - Danh sách các hạng vé (S-VIP, GA...) cùng giá tiền và trạng thái còn vé/hết vé.

### Suite 3: Luồng Chọn Vé & Giữ Chỗ (web-booking.spec.ts)
Bao phủ các ca kiểm thử:
1. **Kiểm tra giới hạn số lượng:** Không cho phép tăng số lượng vé vượt quá hạn mức `max_per_user`.
2. **Kích hoạt giữ chỗ (Reservation):** Chọn số lượng vé hợp lệ -> Bấm "Đặt vé ngay" -> Kiểm tra chuyển sang màn hình Thanh toán/Giữ chỗ (`/checkout`).
3. **Kiểm tra thông tin đơn hàng:** Đơn hàng hiển thị đúng tổng số tiền, tên hạng vé đã chọn và bộ đếm ngược thời gian giữ chỗ (Countdown Timer).

### Suite 4: Quản Trị Hệ Thống Admin Portal (admin-portal.spec.ts)
Bao phủ các ca kiểm thử:
1. **Chặn tài khoản thường vào Admin Portal:** Sử dụng tài khoản `audience1@tixora.local` đăng nhập vào `http://localhost:3002`, hệ thống phải từ chối truy cập (HTTP 403 / Access Denied).
2. **Đăng nhập tài khoản Quản trị viên:** Sử dụng `vy.admin@tixora.local`, đăng nhập thành công vào trang `/dashboard`.
3. **Kiểm tra số liệu Dashboard:** Các thẻ KPI (Doanh thu, Vé đã bán, Đơn hàng) hiển thị đầy đủ số liệu.
4. **Điều hướng các phân hệ quản trị:** Kiểm tra truy cập mượt mà vào Quản lý sự kiện (`/events`), Phân công soát vé (`/assignments`), Báo cáo doanh thu (`/revenue`), và Quản lý người dùng (`/users`).

---

## 6. Hướng Dẫn Chạy Test (Execution Commands)

Trước khi chạy test, hãy đảm bảo hệ thống đang hoạt động (Redis, RabbitMQ, Backend `:3000`, Web App `:3001`, Admin App `:3002`).

### 1. Chạy Tất Cả Test Bằng Dòng Lệnh (Headless)
```powershell
pnpm test:e2e
```
*Lệnh này sẽ chạy toàn bộ các file test trên các browser engine và in kết quả ra terminal.*

### 2. Chạy Riêng Từng Phân Hệ
- **Chỉ chạy Web App tests:**
  ```powershell
  pnpm exec playwright test --project="Web App (Desktop Chrome)"
  ```
- **Chỉ chạy Admin Portal tests:**
  ```powershell
  pnpm exec playwright test --project="Admin Portal (Desktop Chrome)"
  ```
- **Chỉ chạy 1 file test cụ thể:**
  ```powershell
  pnpm exec playwright test e2e/web-auth.spec.ts
  ```

### 3. Chạy Với Giao Diện Trực Quan (Playwright Interactive UI Mode)
Đây là chế độ tuyệt vời nhất để phát triển và quan sát trực tiếp từng thao tác click, gõ phím của bot:
```powershell
pnpm test:e2e:ui
```
*Giao diện tương tác sẽ bật lên, cho phép bạn bấm Play từng bước, tua ngược thời gian (Time-travel), xem DOM snapshot tại từng thời điểm.*

### 4. Chạy Bật Trình Duyệt Thật (Headed Mode)
```powershell
pnpm test:e2e:headed
```

### 5. Mở Báo Cáo Kết Quả Trực Quan (HTML Report & Trace Viewer)
Sau khi chạy test xong, mở báo cáo HTML chi tiết với biểu đồ, thời gian thực thi và hình ảnh:
```powershell
pnpm test:e2e:report
```

---

## 7. Tích Hợp Vào CI/CD (GitHub Actions)

Có thể thêm job chạy Playwright vào workflow `.github/workflows/ci.yml` để tự động kiểm thử mỗi khi mở Pull Request:

```yaml
  playwright-e2e:
    name: Playwright End-to-End Tests
    runs-on: ubuntu-latest
    timeout-minutes: 20
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Install pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 10

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Install Playwright Browsers
        run: pnpm exec playwright install --with-deps chromium

      - name: Run Playwright tests
        run: pnpm exec playwright test
        env:
          CI: true

      - name: Upload Playwright Report Artifact
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 14
```

---

## 8. Best Practices Khi Viết E2E Test Cho TIXORA

1. **Sử dụng Locators theo hành vi người dùng (User-facing Locators):**
   - Ưu tiên: `page.getByRole('button', { name: 'Đăng nhập' })`, `page.getByLabel('Email')`, `page.getByPlaceholder(...)`.
   - Tránh dùng các CSS selector phức tạp dễ gãy như `div > div.col-span-2 > button.bg-blue-600`.
2. **Không dùng `page.waitForTimeout(5000)` cứng:**
   - Hãy tận dụng tính năng tự động chờ của Playwright như `await expect(page.getByText('Đăng nhập thành công')).toBeVisible()`.
3. **Tách biệt dữ liệu kiểm thử (Test Data Fixture):**
   - Đặt các ID mẫu, tài khoản mẫu trong `e2e/fixtures/test-data.ts`.
4. **Giữ các Test Case độc lập (Test Independence):**
   - Mỗi test case nên tự chuẩn bị dữ liệu hoặc dùng tài khoản riêng để tránh việc test trước làm hỏng trạng thái của test sau.

---
*Bộ tài liệu và kịch bản Playwright sẵn sàng đưa vào vận hành, hỗ trợ kiểm thử hồi quy (Regression Testing) tự động mỗi khi cập nhật mã nguồn.*
