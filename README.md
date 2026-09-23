# Tixora - Nền Tảng Phân Phối Vé & Soát Vé Sự Kiện Chịu Tải Cao (pnpm Monorepo)

<p align="center">
  <img src="https://img.shields.io/badge/Architecture-Monorepo-indigo?style=for-the-badge&logo=pnpm" alt="Monorepo" />
  <img src="https://img.shields.io/badge/Backend-NestJS-red?style=for-the-badge&logo=nestjs" alt="NestJS" />
  <img src="https://img.shields.io/badge/Frontend-Next.js%2016-black?style=for-the-badge&logo=next.js" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/Styling-Tailwind%20CSS%20v4-38bdf8?style=for-the-badge&logo=tailwindcss" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Mobile-Expo%20React%20Native-000020?style=for-the-badge&logo=expo" alt="Expo" />
  <img src="https://img.shields.io/badge/Concurrency-Redis%20Lua-DC382D?style=for-the-badge&logo=redis" alt="Redis Lua" />
</p>

Chào mừng bạn đến với **Tixora**! Đây là nền tảng quản trị và bán vé hòa nhạc / sự kiện trực tuyến thế hệ mới, tích hợp các giải pháp kiến trúc chịu tải cao: **chống bán lố vé nguyên tử (Atomic Anti-Oversell via Redis Lua)**, **bảo vệ chống nghẽn với Token Bucket Rate Limiting**, và **soát vé tại cổng ngoại tuyến (Offline-First Gate Check-in)**.

Repository được tổ chức dưới dạng **pnpm Workspaces (Monorepo)**, giúp quản lý toàn bộ các thành phần (Backend API, Web Khách Hàng, Admin Portal, Mobile Scanner App) một cách độc lập, tinh gọn và tối ưu tốc độ build.

---

## 📁 Cấu Trúc Dự Án (Monorepo Structure)

* **`apps/backend-api`**: Backend API xây dựng trên **NestJS** (cổng **`3000`**), sử dụng **Prisma ORM** kết nối PostgreSQL. Tích hợp Redis Cache, RabbitMQ Message Queue, Swagger OpenAPI (`/api/docs`), và Lua Script nguyên tử xử lý giữ vé thời gian thực.
* **`apps/web-app`**: Frontend Web dành riêng cho khán giả (Audience) săn vé và quản lý vé cá nhân (cổng **`3001`**), xây dựng bằng **Next.js 16 App Router** và **Tailwind CSS v4**.
* **`apps/admin-app`**: Trang quản trị (Admin Portal) độc lập (cổng **`3002`**), xây dựng bằng **Next.js 16 App Router** phục vụ quản lý sự kiện, sơ đồ ghế, doanh thu, tài khoản và tác vụ nền. Sẵn sàng deploy độc lập lên domain riêng (ví dụ `admin.tixora.vn`).
* **`apps/mobile-app`**: Ứng dụng di động dành riêng cho nhân viên soát vé (Checker), phát triển bằng **React Native (Expo)** hỗ trợ quét QR ngoại tuyến (Offline Check-in) với bảo mật đồng bộ mã hóa.
* **`infrastructure/`**: Cấu hình Docker Compose để khởi động nhanh Redis và RabbitMQ cục bộ.
* **`docs/`**: Hệ thống tài liệu kiến trúc kỹ thuật (System Design, Auth & RBAC 5-Roles, Offline Check-in, k6 Testing và Quy trình). Tra cứu tại [docs/README.md](docs/README.md).
* **`testing/`**: Bộ kiểm thử tự động End-to-End (Playwright) và kiểm thử chịu tải k6 (Load Testing).

---

## 🛠️ Yêu Cầu Hệ Thống (Prerequisites)

Trước khi bắt đầu, hãy đảm bảo máy tính của bạn đã cài đặt các công cụ sau:
* **Node.js**: Phiên bản LTS (Khuyên dùng v20 hoặc v22+).
* **pnpm**: Trình quản lý package hiệu năng cao (v10+):
  ```bash
  npm install -g pnpm
  ```
* **Docker & Docker Compose**: Để chạy Redis & RabbitMQ.
* **k6**: Để thực hiện chạy load test (tùy chọn, tải tại [k6.io](https://k6.io)).
* **Expo Go**: Tải trên App Store hoặc Google Play (để chạy thử app soát vé trên điện thoại thật).

---

## 🚀 Hướng Dẫn Cài Đặt Nhanh (Quickstart Guide)

### Bước 1: Clone Repository & Cài Đặt Dependencies
```bash
git clone https://github.com/tvquang0511/Tixora.git
cd Tixora
pnpm install
```

### Bước 2: Thiết Lập Biến Môi Trường (Environment Variables)
1. Sao chép file `.env.example` thành `.env` tại thư mục gốc:
   ```bash
   cp .env.example .env
   ```
2. Cập nhật chuỗi kết nối PostgreSQL (`DATABASE_URL`, `DIRECT_URL`) và các thông tin cấu hình cổng:
   - Backend API: `3000`
   - Web App: `3001`
   - Admin App: `3002`

### Bước 3: Khởi Động Hạ Tầng Cục Bộ (Redis & RabbitMQ)
```bash
cd infrastructure
docker compose up -d
cd ..
```

### Bước 4: Khởi Tạo Cơ Sở Dữ Liệu (Prisma Database)
```bash
pnpm prisma:generate
pnpm db:migrate:deploy
pnpm db:seed
```

---

### Bước 5: Khởi Động Các Ứng Dụng

Mở các cửa sổ terminal riêng biệt để chạy các thành phần:

#### 1. Backend API (NestJS - Port 3000)
```bash
pnpm start:api
```
*(Swagger UI tài liệu API: `http://localhost:3000/api/docs`)*

#### 2. Web Khách Hàng (Next.js - Port 3001)
```bash
pnpm start:web
```
*(Giao diện đặt vé: `http://localhost:3001`)*

#### 3. Admin Portal (Next.js - Port 3002)
```bash
pnpm start:admin
```
*(Bảng điều khiển quản trị: `http://localhost:3002`)*

#### 4. Mobile Checker App (Expo - Port 8081)
```bash
pnpm start:mobile
```

> [!IMPORTANT]
> **Lưu ý khi chạy app di động:**
> Nếu bạn sử dụng **thiết bị thật** (quét QR bằng Expo Go), hãy chỉnh sửa cấu hình `apiBaseUrl` thành IP máy tính chạy backend của bạn (ví dụ: `http://192.168.1.5:3000` thay vì `localhost`) và cả hai thiết bị phải kết nối chung một mạng Wi-Fi.

---

## 🔑 Tài Khoản Thử Nghiệm Mặc Định (Seed Users)

Sau khi chạy lệnh `pnpm db:seed`, bạn có thể dùng các tài khoản sau để đăng nhập thử nghiệm:

| Vai trò (Role) | Email | Mật khẩu | Ứng dụng & Quyền hạn |
| :--- | :--- | :--- | :--- |
| **Admin** | `vy.admin@tixora.local` | `123456` | Dashboard, báo cáo doanh thu, quản trị tài khoản & phân quyền (Đăng nhập tại Admin Portal - Port 3002). |
| **Organizer** | `tuan.organizer@tixora.local` | `123456` | Quản lý concert, tạo concert mới, theo dõi doanh thu sự kiện. |
| **Checker** | `quang.checker@tixora.local` | `123456` | Quét mã QR soát vé cổng (Đăng nhập trên Mobile App). |
| **Audience** | Đăng ký trực tiếp trên Web | Tùy chọn | Xem danh sách sự kiện, giữ chỗ thời gian thực, thanh toán và xem vé cá nhân (Web App - Port 3001). |

---

## ⚡ Kiểm Thử Tự Động & Chịu Tải (Testing Suite)

Toàn bộ công cụ kiểm thử được gom gọn trong thư mục [`testing/`](testing/README.md):

* **Kiểm thử tự động End-to-End (Playwright)**:
  ```powershell
  pnpm test:e2e       # Chạy kiểm thử tự động toàn hệ thống
  pnpm test:e2e:ui    # Bật giao diện trực quan Playwright UI
  ```

* **Mô phỏng luồng đặt vé chịu tải thường (k6)**:
  ```powershell
  .\testing\load\k6-ticketing-flow.local.ps1
  ```
  *(Chứng minh cơ chế Rate Limit trả về lỗi `429 Too Many Requests` khi gửi quá nhiều request).*

* **Mô phỏng đặt vé đồng thời kiểm tra chống Oversell (k6)**:
  ```powershell
  .\testing\load\k6-oversell-check.local.ps1
  ```
  *(Chứng minh dù có hàng chục lượt đặt vé đồng thời nhưng chỉ bán đúng số lượng tồn kho thực tế, bảo đảm tính toàn vẹn 100%).*

---

## 📄 Bản Quyền & Giấy Phép
Dự án được phát triển và vận hành bởi cá nhân, phục vụ mục đích học thuật và trình diễn kỹ thuật chuyên sâu.
