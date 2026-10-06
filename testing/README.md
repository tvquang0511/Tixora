# 🧪 MODULE KIỂM THỬ HỆ THỐNG TIXORA (ENTERPRISE QA & LOAD TESTING SUITE)

Module đóng gói toàn diện 2 tầng kiểm thử chuẩn doanh nghiệp:
1. **Kiểm thử tự động End-to-End (E2E)** theo tiêu chuẩn ISO/IEC/IEEE 29119 với Playwright, xuất báo cáo Nghiệm thu Excel (.xlsx) & HTML Dashboard.
2. **Kiểm thử chịu tải cao & Concurrency (k6 Load Testing)** kiểm chứng năng lực chịu tải, chống bán lố vé (Zero Oversell), bảo vệ Token Bucket Rate Limit và áp lực cổng soát vé giờ G.

---

## 📁 Cấu Trúc Thư Mục

```
testing/
├── .env / .env.example              # Cấu hình môi trường (Cloud vs Local Staging)
├── playwright.config.ts             # Cấu hình Playwright Runner (2 workers, headless, outputDir)
├── fixtures/                        # 🎯 Trung tâm dữ liệu kiểm thử tập trung
│   ├── test-data.ts                 # Thông tin tài khoản, URLs, cấu hình môi trường
│   └── test-cases.catalog.ts        # Bảng từ điển đặc tả 25 Test Case chuẩn ISO 29119
├── helpers/
│   └── auth.helper.ts               # Action Helper & Session Guard (chống race condition)
├── e2e/                             # Domain-Driven E2E Test Suite (Playwright)
│   ├── 01-auth/                     # Web Authentication & Admin RBAC Guard
│   ├── 02-audience/                 # Khám phá sự kiện, Đặt vé & Quản lý vé của tôi
│   ├── 03-organizer/                # Hub Ban tổ chức, Tạo sự kiện & Doanh thu
│   └── 04-admin/                    # Cockpit, Quản trị Users, Events, Quyết toán
├── load/                            # Kiểm thử chịu tải & Phòng thủ hệ thống (k6)
│   ├── k6-oversell-check.js         # [Kịch bản 1] Tranh chấp vé đồng thời chống bán lố (Zero Oversell)
│   ├── k6-ticketing-flow.js         # [Kịch bản 2] Luồng khép kín: Xem -> Khóa vé -> Thanh toán
│   ├── k6-catalog-browse.js         # [Kịch bản 3] F5 / Tìm kiếm tải cao (Read-Heavy / Cache Spike)
│   └── k6-checkin-stress.js         # [Kịch bản 4] Cổng soát vé giờ G (Mobile Check-in Scanners)
├── reporters/
│   └── excel-reporter.ts            # Engine xuất báo cáo Excel & HTML Dashboard
└── reports/                         # 📊 TRUNG TÂM BÁO CÁO DUY NHẤT (REPORTS HUB)
    ├── e2e/                         # File Báo cáo Nghiệm thu Excel (.xlsx) & HTML Dashboard
    ├── playwright/                  # Báo cáo Playwright native HTML report
    ├── artifacts/                   # Video, Screenshots, Trace callstack khi test fail
    └── load/                        # File JSON tóm tắt chỉ số tải k6
```

---

## 🚀 Hướng Dẫn Thực Thi

### 1. Kiểm Thử Giao Diện E2E Nghiệm Thu (Playwright)
```powershell
# Chạy toàn bộ 25 Test Cases và xuất file Báo cáo Excel + HTML Dashboard
pnpm test:e2e

# Chạy giao diện tương tác Playwright Interactive UI
pnpm test:e2e:ui

# Mở báo cáo HTML mặc định của Playwright
pnpm test:e2e:report
```

---

### 2. Kiểm Thử Chịu Tải Cao & Tranh Chấp Dữ Liệu (k6 Load Testing)

Toàn bộ script k6 đều hỗ trợ **Auto-Discovery** (tự động nhận diện sự kiện và hạng vé mở bán trên Cloud hoặc Local):

```powershell
# Kịch bản 1: Kiểm tra chống bán lố vé (Zero Oversell Concurrency Check)
pnpm test:load:oversell

# Kịch bản 2: Kiểm tra trọn vẹn luồng Bán vé & Thanh toán (Closed-Loop Ticketing Flow)
pnpm test:load:flow

# Kịch bản 3: Kiểm tra đọc tải cao / F5 trang chủ / Tìm kiếm show diễn (Read-Heavy)
pnpm test:load:catalog

# Kịch bản 4: Kiểm tra tải cổng soát vé giờ G của các máy quét di động (Check-in Gate)
pnpm test:load:checkin
```

#### Tùy chỉnh tham số khi chạy (Environment Variables):
```powershell
# Ví dụ chạy k6 Catalog test với 50 người dùng ảo trong 30 giây vào Cloud:
$env:BASE_URL="https://api.tixora.tvquang.id.vn"
$env:VUS="50"
$env:DURATION="30s"
pnpm test:load:catalog
```
