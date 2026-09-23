# 🧪 MODULE KIỂM THỬ HỆ THỐNG Tixora (TESTING SUITE)

Module này đóng gói toàn bộ công cụ, kịch bản kiểm thử tự động End-to-End (E2E Playwright) và kiểm thử chịu tải (k6 Load Testing) của hệ sinh thái Tixora.

---

## 📁 Cấu Trúc Thư Mục

```
testing/
├── e2e/                           # Kiểm thử tự động giao diện (Playwright)
│   ├── fixtures/
│   │   └── test-data.ts           # Dữ liệu tài khoản seed & Concert ID
│   ├── helpers/
│   │   └── auth.helper.ts         # Tiện ích login nhanh
│   ├── web-auth.spec.ts           # Test xác thực Web Khách hàng (:3001)
│   ├── web-catalog.spec.ts        # Test danh sách, tìm kiếm & chi tiết sự kiện
│   ├── web-booking.spec.ts        # Test chọn vé, giữ chỗ & xem vé
│   └── admin-portal.spec.ts       # Test RBAC, Dashboard & Quản trị (:3002)
├── load/                          # Kiểm thử chịu tải & phòng thủ (k6)
│   ├── k6-oversell-check.js       # Kịch bản kiểm tra chống bán lố vé (Zero Oversell)
│   ├── k6-oversell-check.example.ps1
│   ├── k6-ticketing-flow.js       # Kịch bản kiểm tra luồng đặt vé & Rate Limiting (HTTP 429)
│   ├── k6-ticketing-flow.example.ps1
│   └── reports/                   # Thư mục lưu kết quả chạy test k6
│       ├── k6-oversell-summary.json
│       └── k6-ticketing-summary.json
├── playwright.config.ts           # Cấu hình Playwright
└── README.md                      # Tài liệu này
```

---

## 🚀 Hướng Dẫn Sử Dụng

### 1. Kiểm Thử Tự Động Playwright E2E
```powershell
# Chạy toàn bộ E2E tests (ngầm)
pnpm test:e2e

# Chạy với giao diện trực quan Playwright Interactive UI Mode
pnpm test:e2e:ui

# Chạy bật trình duyệt thật (Headed)
pnpm test:e2e:headed

# Xem báo cáo HTML
pnpm test:e2e:report
```

### 2. Kiểm Thử Chịu Tải k6 (Load & Concurrency Testing)
```powershell
# Chạy kiểm tra chống bán quá số lượng (Zero Oversell)
.\testing\load\k6-oversell-check.local.ps1

# Chạy kiểm tra luồng đặt vé & Token Bucket Rate Limit
.\testing\load\k6-ticketing-flow.local.ps1
```
*Kết quả sẽ được tự động lưu vào thư mục `testing/load/reports/`.*
