# TicketBox - Hệ thống Đặt Vé và Soát Vé Concert (pnpm Monorepo)

Chào mừng bạn đến với **TicketBox**! Đây là dự án hệ thống đặt vé concert trực tuyến tích hợp cơ chế chịu tải (Rate Limiting), chống bán quá số lượng (Oversell Prevention), và soát vé ngoại tuyến (Offline Check-in).

Repository này được tổ chức dưới dạng **pnpm Workspaces (Monorepo)**, giúp quản lý toàn bộ các thành phần (Backend, Web Khách Hàng, Admin Portal, Mobile App) trong cùng một dự án một cách tinh gọn, nhanh chóng và độc lập.

---

## 📁 Cấu Trúc Dự Án

* **`apps/backend-api`**: Backend API xây dựng trên **NestJS** (chạy tại cổng **`3000`**), sử dụng **Prisma ORM** kết nối Postgres (schema và migrations nằm tại `apps/backend-api/prisma`). Tích hợp Redis Cache, RabbitMQ Message Queue và cơ chế chặn spam Token Bucket (Redis + Lua script).
* **`apps/web-app`**: Frontend Web dành riêng cho khách hàng (Audience) mua vé (chạy tại cổng **`3001`**), xây dựng bằng **Next.js 16 App Router** và **Tailwind CSS v4**.
* **`apps/admin-app`**: Trang quản trị (Admin Portal) độc lập (chạy tại cổng **`3002`**), xây dựng bằng **Next.js 16 App Router** phục vụ quản lý sự kiện, vé, doanh thu, phân công và tác vụ nền. Sẵn sàng deploy độc lập lên domain riêng (ví dụ `admin.ticketbox.vn`).
* **`apps/mobile-app`**: Ứng dụng di động dành riêng cho nhân viên soát vé (Checker), phát triển bằng **React Native (Expo)** hỗ trợ quét QR ngoại tuyến (Offline-first).
* **`infrastructure/`**: Chứa file cấu hình Docker Compose để khởi động nhanh Redis và RabbitMQ dưới local.
* **`scripts/`**: Chứa các script k6 dùng để load test hệ thống dưới tải cao và script quality gate `verify-push.js`.

---

## 🛠️ Yêu Cầu Hệ Thống (Prerequisites)

Trước khi bắt đầu, hãy đảm bảo máy tính của bạn đã cài đặt các công cụ sau:
* **Node.js**: Phiên bản LTS mới nhất (Khuyên dùng v20 hoặc v22+).
* **pnpm**: Trình quản lý package hiệu năng cao (v10+):
  ```bash
  npm install -g pnpm
  ```
* **Docker & Docker Compose**: Để chạy Redis & RabbitMQ.
* **k6**: Để thực hiện chạy load test (tùy chọn, tải tại [k6.io](https://k6.io)).
* **Expo Go**: Tải trên App Store hoặc Google Play (để chạy thử app di động trên điện thoại thật).

---

## 🚀 Hướng Dẫn Thiết Lập Từng Bước (Setup Guide)

### Bước 1: Clone Repository & Cài đặt Dependencies
Mở terminal tại thư mục gốc của dự án sau khi clone và chạy lệnh sau để tự động cài đặt package cho toàn bộ các workspace qua pnpm:
```bash
pnpm install
```

### Bước 2: Thiết lập Biến Môi Trường (Environment Variables)

1. Sao chép file `.env.example` thành `.env` tại thư mục gốc:
   ```bash
   cp .env.example .env
   ```
2. Điền chuỗi kết nối Database Postgres (`DATABASE_URL`, `DIRECT_URL`) và các thông tin cấu hình cổng:
   - Backend API: `3000`
   - Web App: `3001`
   - Admin App: `3002`

### Bước 3: Khởi Động Hạ Tầng Cục Bộ (Redis & RabbitMQ)

Khởi động các container Redis và RabbitMQ:
```bash
cd infrastructure
docker compose up -d
cd ..
```

### Bước 4: Khởi Tạo Cơ Sở Dữ Liệu (Prisma Database)

Chạy migration và sinh Prisma Client:
```bash
pnpm prisma:generate
pnpm db:migrate:deploy
pnpm db:seed
```

---

### Bước 5: Chạy Ứng Dụng dưới Local

Mở các cửa sổ terminal riêng biệt để chạy các thành phần:

#### 1. Chạy Backend API (NestJS - Port 3000)
```bash
pnpm start:api
```
*(Backend hoạt động tại địa chỉ: `http://localhost:3000`)*

#### 2. Chạy Web Khách Hàng (Next.js - Port 3001)
```bash
pnpm start:web
```
*(Truy cập tại địa chỉ: `http://localhost:3001`)*

#### 3. Chạy Admin Portal (Next.js - Port 3002)
```bash
pnpm start:admin
```
*(Truy cập tại địa chỉ: `http://localhost:3002`)*

#### 4. Chạy Mobile App (Expo - Port 8081)
```bash
pnpm start:mobile
```

> [!IMPORTANT]
> **Lưu ý khi chạy app di động:**
> * Nếu bạn sử dụng **thiết bị thật** (quét QR bằng Expo Go), bạn phải chỉnh sửa cấu hình `apiBaseUrl` thành IP máy tính chạy backend của bạn (ví dụ: `http://192.168.1.5:3000` thay vì `localhost`) và cả hai thiết bị phải kết nối chung một mạng Wi-Fi.

---

## 🔑 Tài Khoản Thử Nghiệm Mặc Định (Seed Users)

Sau khi chạy lệnh `pnpm db:seed`, bạn có thể dùng các tài khoản sau để đăng nhập thử nghiệm:

| Vai trò (Role) | Email | Mật khẩu | Chức năng chính |
| :--- | :--- | :--- | :--- |
| **Admin** | `vy.admin@ticketbox.local` | `123456` | Xem dashboard, thống kê doanh thu, quản lý tài khoản & phân quyền (Đăng nhập tại Admin Portal - Port 3002). |
| **Organizer** | `tuan.organizer@ticketbox.local` | `123456` | Quản lý concert, tạo concert mới, báo cáo doanh thu riêng. |
| **Checker** | `quang.checker@ticketbox.local` | `123456` | Soát vé (Đăng nhập trên Mobile App). |
| **Audience** | Đăng ký trực tiếp trên Web | Tùy chọn | Xem danh sách sự kiện, mua vé, xem vé cá nhân (Đăng nhập tại Web App - Port 3001). |

---

## ⚡ Load Test và Kiểm Tra Cơ Chế Chống Oversell (k6)

Đảm bảo backend đang chạy, sử dụng PowerShell để chạy thử nghiệm tải dưới local:

* **Mô phỏng luồng đặt vé chịu tải thường**:
  ```powershell
  .\scripts\k6-ticketing-flow.local.ps1
  ```
  *(Chứng minh cơ chế Rate Limit trả về lỗi `429 Too Many Requests` khi gửi quá nhiều request).*

* **Mô phỏng đặt vé đồng thời kiểm tra chống Oversell**:
  ```powershell
  .\scripts\k6-oversell-check.local.ps1
  ```
  *(Chứng minh dù có 30 người đặt vé cùng lúc nhưng chỉ bán đúng số lượng vé tồn thực tế trong kho, không bán lố).*
