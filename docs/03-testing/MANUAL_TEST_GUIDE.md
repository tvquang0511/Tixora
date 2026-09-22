# TÀI LIỆU HƯỚNG DẪN KIỂM THỬ THỦ CÔNG (MANUAL TEST GUIDE)
## HỆ THỐNG ĐẶT VÉ VÀ SOÁT VÉ CONCERT TICKETBOX

> **Phiên bản tài liệu:** 1.0.0  
> **Dự án:** TicketBox Monorepo (NestJS + Next.js 16 + React Native Expo)  
> **Mục đích:** Cung cấp bộ kịch bản kiểm thử thủ công (Manual Test Cases) toàn diện từ A-Z để rà soát, nghiệm thu và đánh giá độ ổn định của toàn bộ hệ sinh thái TicketBox trước khi tiến hành tùy biến hoặc build thêm tính năng mới.

---

## MỤC LỤC
1. [Tổng Quan Kiến Trúc & Môi Trường Kiểm Thử](#1-tổng-quan-kiến-trúc--môi-trường-kiểm-thử)
2. [Thiết Lập Môi Trường Test (Pre-flight Setup)](#2-thiết-lập-môi-trường-test-pre-flight-setup)
3. [Danh Sách Tài Khoản & Dữ Liệu Kiểm Thử Có Sẵn (Seed Data)](#3-danh-sách-tài-khoản--dữ-liệu-kiểm-thử-có-sẵn-seed-data)
4. [Ma Trận Kịch Bản Kiểm Thử (Test Cases Matrix)](#4-ma-trận-kịch-bản-kiểm-thử-test-cases-matrix)
   - [Suite 1: Xác thực & Phân quyền (Auth & RBAC)](#suite-1-xác-thực--phân-quyền-auth--rbac)
   - [Suite 2: Khám Phá & Chi Tiết Sự Kiện (Catalog & Concert Detail)](#suite-2-khám-phá--chi-tiết-sự-kiện-catalog--concert-detail)
   - [Suite 3: Luồng Giữ Chỗ & Đặt Vé (Ticketing & Reservation)](#suite-3-luồng-giữ-chỗ--đặt-vé-ticketing--reservation)
   - [Suite 4: Thanh Toán & Phát Hành Vé (Payment & Ticket Issuance)](#suite-4-thanh-toán--phát-hành-vé-payment--ticket-issuance)
   - [Suite 5: Quản Lý Vé Cá Nhân (Audience My Tickets & E-Ticket QR)](#suite-5-quản-lý-vé-cá-nhân-audience-my-tickets--e-ticket-qr)
   - [Suite 6: Soát Vé Tại Cổng Mobile App (Online & Offline Gate Check-in)](#suite-6-soát-vé-tại-cổng-mobile-app-online--offline-gate-check-in)
   - [Suite 7: Quản Trị Sự Kiện & Cấu Hình Hạng Vé (Admin/Organizer Event Management)](#suite-7-quản-trị-sự-kiện--cấu-hình-hạng-vé-adminorganizer-event-management)
   - [Suite 8: Phân Công Cổng Soát Vé & Quản Lý Nhân Sự (Checker Assignment & Users)](#suite-8-phân-công-cổng-soát-vé--quản-lý-nhân-sự-checker-assignment--users)
   - [Suite 9: Dashboard Quản Trị & Báo Cáo Doanh Thu (Admin Dashboard & Revenue Analytics)](#suite-9-dashboard-quản-trị--báo-cáo-doanh-thu-admin-dashboard--revenue-analytics)
   - [Suite 10: Tác Vụ Nền & AI (Background Jobs, CSV Guest Import & AI Bio)](#suite-10-tác-vụ-nền--ai-background-jobs-csv-guest-import--ai-bio)
   - [Suite 11: Khả Năng Phục Hồi & Chống Quá Tải (Rate Limit & Resilience)](#suite-11-khả-năng-phục-hồi--chống-quá-tải-rate-limit--resilience)
5. [Checklist Nghiệm Thu Cuối Cùng (Sign-off Checklist)](#5-checklist-nghiệm-thu-cuối-cùng-sign-off-checklist)

---

## 1. Tổng Quan Kiến Trúc & Môi Trường Kiểm Thử

TicketBox bao gồm 4 ứng dụng cốt lõi chạy trên các cổng mặc định:

```mermaid
graph TD
    ClientWeb["Web Khách Hàng (Next.js 16)<br/>http://localhost:3001"] -->|REST API| Backend["NestJS Core API<br/>http://localhost:3000"]
    AdminWeb["Admin Portal (Next.js 16)<br/>http://localhost:3002"] -->|REST API| Backend
    MobileApp["Mobile Checker App (Expo)<br/>Port 8081 / Real Device"] -->|REST API (Pre-fetch & Sync)| Backend
    Backend -->|Cache, Lua scripts, Token Bucket| Redis[("Redis Caching & Lock<br/>Port 6379")]
    Backend -->|Event Messages, Orders Queue| RabbitMQ[("RabbitMQ Broker<br/>Port 5672 / UI 15672")]
    Backend -->|ACID Persistence| Postgres[("PostgreSQL Database<br/>Supabase / Local")]
```

---

## 2. Thiết Lập Môi Trường Test (Pre-flight Setup)

Trước khi bắt đầu thực hiện kiểm thử thủ công, hãy thực hiện lần lượt các bước chuẩn bị môi trường sau:

### Bước 2.1: Kiểm tra Biến Môi Trường (.env)
Đảm bảo file `.env` tại thư mục gốc có đầy đủ các cấu hình quan trọng:
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/ticketbox?schema=public"
DIRECT_URL="postgresql://user:password@localhost:5432/ticketbox?schema=public"

# Redis & RabbitMQ
REDIS_HOST=localhost
REDIS_PORT=6379
RABBITMQ_URL="amqp://guest:guest@localhost:5672"

# Security & JWT
JWT_SECRET="ticketbox-super-secret-jwt-key"
JWT_EXPIRATION="15m"
REFRESH_TOKEN_SECRET="ticketbox-refresh-secret-key"
REFRESH_TOKEN_EXPIRATION="7d"

# PayOS (Cổng thanh toán)
PAYOS_CLIENT_ID="your_client_id"
PAYOS_API_KEY="your_api_key"
PAYOS_CHECKSUM_KEY="your_checksum_key"
```

### Bước 2.2: Khởi động Hạ tầng Docker (Redis & RabbitMQ)
Mở Terminal 1:
```powershell
cd infrastructure
docker compose up -d
cd ..
```
*Kiểm tra:* Truy cập `http://localhost:15672` (User: `guest` / Pass: `guest`) để xác nhận RabbitMQ Management Panel hoạt động.

### Bước 2.3: Reset và Seed Dữ Liệu Sạch
Mở Terminal 2:
```powershell
pnpm prisma:generate
pnpm db:migrate:deploy
pnpm db:seed
```
*Lưu ý:* Khi chạy `pnpm db:seed`, hệ thống sẽ tự động dọn sạch bảng và sinh dữ liệu concert mẫu, các hạng vé, cùng các tài khoản thử nghiệm.

### Bước 2.4: Khởi động 3 Ứng Dụng Web & API
Mở 3 terminal riêng biệt:
- **Terminal A (Backend API):**
  ```powershell
  pnpm start:api:dev
  ```
  *(Truy cập Swagger docs: `http://localhost:3000/api/docs` để tra cứu endpoint)*
- **Terminal B (Web Khách Hàng):**
  ```powershell
  pnpm start:web
  ```
  *(Truy cập: `http://localhost:3001`)*
- **Terminal C (Admin Portal):**
  ```powershell
  pnpm start:admin
  ```
  *(Truy cập: `http://localhost:3002`)*
- **Terminal D (Mobile App - Nếu test trên điện thoại/máy ảo):**
  ```powershell
  pnpm start:mobile
  ```

---

## 3. Danh Sách Tài Khoản & Dữ Liệu Kiểm Thử Có Sẵn (Seed Data)

| Vai Trò (Role) | Email Đăng Nhập | Mật Khẩu | Ứng Dụng Sử Dụng | Quyền Hạn Chính |
| :--- | :--- | :--- | :--- | :--- |
| **System Admin** | `vy.admin@ticketbox.local` | `123456` | Admin Portal (`:3002`) | Toàn quyền: Thống kê, quản lý Concert, User, Phân công Gate, Background Jobs |
| **System Admin 2** | `vuong.admin@ticketbox.local` | `123456` | Admin Portal (`:3002`) | Toàn quyền quản trị |
| **Concert Organizer** | `tuan.organizer@ticketbox.local` | `123456` | Admin Portal (`:3002`) | Tạo sự kiện, cấu hình vé, xem báo cáo doanh thu sự kiện của mình |
| **Gate Checker 1** | `quang.checker@ticketbox.local` | `123456` | Mobile App (`:8081`) | Soát vé tại Cổng 1 (Gate 1 - S-VIP) |
| **Gate Checker 2** | `checker2@ticketbox.local` | `123456` | Mobile App (`:8081`) | Soát vé tại Cổng 2 (Gate 2) |
| **Audience Seeded** | `audience1@ticketbox.local` | `123456` | Web App (`:3001`) | Khách hàng mua vé thông thường |
| **Audience Mới** | Đăng ký trực tiếp trên Web | Tùy chọn | Web App (`:3001`) | Luồng đăng ký tài khoản mới |

---

## 4. Ma Trận Kịch Bản Kiểm Thử (Test Cases Matrix)

### Suite 1: Xác thực & Phân quyền (Auth & RBAC)

#### TC-AUTH-01: Đăng ký tài khoản Audience mới trên Web App
- **Tiền điều kiện:** Chưa đăng nhập. Đang ở `http://localhost:3001/register`.
- **Các bước thực hiện:**
  1. Nhập Họ và tên: `Nguyễn Văn Test`.
  2. Nhập Email: `user.test.manual@gmail.com`.
  3. Nhập Mật khẩu: `Password123@`.
  4. Nhập Xác nhận mật khẩu: `Password123@`.
  5. Bấm nút **"Đăng ký"**.
- **Kết quả mong đợi:**
  - Hệ thống hiển thị thông báo đăng ký thành công.
  - Tự động chuyển hướng sang trang Đăng nhập hoặc Trang chủ.
  - Bảng `users` trong CSDL có thêm bản ghi mới với `status = 'ACTIVE'`, mật khẩu được băm bcrypt.
  - Bảng `user_roles` tự động gán vai trò `Audience`.

#### TC-AUTH-02: Đăng nhập Audience thành công & Lưu trữ Access Token
- **Tiền điều kiện:** Đang ở trang `http://localhost:3001/login`.
- **Các bước thực hiện:**
  1. Nhập Email: `audience1@ticketbox.local`.
  2. Nhập Mật khẩu: `123456`.
  3. Bấm **"Đăng nhập"**.
- **Kết quả mong đợi:**
  - Đăng nhập thành công, chuyển hướng về Trang chủ `/`.
  - Header thay đổi: hiển thị avatar/tên người dùng, xuất hiện menu "Vé của tôi" (`/my-tickets`) và "Đăng xuất".
  - Kiểm tra DevTools > Application > Storage/Cookies: Có lưu `access_token` và `refresh_token`.

#### TC-AUTH-03: Đăng nhập sai mật khẩu & Kiểm tra thông báo lỗi
- **Tiền điều kiện:** Đang ở trang `http://localhost:3001/login`.
- **Các bước thực hiện:**
  1. Nhập Email: `audience1@ticketbox.local`.
  2. Nhập Mật khẩu sai: `sai_mat_khau_123`.
  3. Bấm **"Đăng nhập"**.
- **Kết quả mong đợi:**
  - Hệ thống báo lỗi rõ ràng: "Email hoặc mật khẩu không chính xác" (HTTP 401).
  - Không chuyển trang, form không bị reset email.

#### TC-AUTH-04: Đăng nhập Admin Portal với tài khoản thường (Kiểm tra RBAC)
- **Tiền điều kiện:** Mở tab ẩn danh tại `http://localhost:3002/login`.
- **Các bước thực hiện:**
  1. Nhập Email tài khoản thường: `audience1@ticketbox.local`.
  2. Nhập Mật khẩu: `123456`.
  3. Bấm **"Đăng nhập"**.
- **Kết quả mong đợi:**
  - Hệ thống từ chối đăng nhập vào Admin Portal: thông báo "Bạn không có quyền truy cập vào trang quản trị" (HTTP 403 Forbidden).
  - Không cho phép vào route `/dashboard`.

#### TC-AUTH-05: Đăng nhập Admin Portal thành công với tài khoản Admin
- **Tiền điều kiện:** Đang ở `http://localhost:3002/login`.
- **Các bước thực hiện:**
  1. Nhập Email Admin: `vy.admin@ticketbox.local`.
  2. Nhập Mật khẩu: `123456`.
  3. Bấm **"Đăng nhập"**.
- **Kết quả mong đợi:**
  - Đăng nhập thành công, chuyển thẳng vào `http://localhost:3002/dashboard`.
  - Sidebar hiển thị đầy đủ các mục: Dashboard, Quản lý sự kiện, Quản lý đơn hàng, Doanh thu, Phân công cổng, Tác vụ nền, Quản lý tài khoản.

#### TC-AUTH-06: Đăng xuất và Bảo vệ Tuyến đường (Route Guard)
- **Tiền điều kiện:** Đang đăng nhập tài khoản Audience trên Web App.
- **Các bước thực hiện:**
  1. Bấm nút **"Đăng xuất"** trên thanh điều hướng.
  2. Thử truy cập thủ công vào URL: `http://localhost:3001/my-tickets`.
- **Kết quả mong đợi:**
  - Phiên làm việc bị xóa (token bị clear khỏi storage/cookies).
  - Khi gõ URL `/my-tickets`, hệ thống tự động redirect về trang `/login` hoặc hiển thị thông báo yêu cầu đăng nhập.

---

### Suite 2: Khám Phá & Chi Tiết Sự Kiện (Catalog & Concert Detail)

#### TC-CAT-01: Xem Danh Sách Sự Kiện Trang Chủ & Tối Ưu Cache
- **Tiền điều kiện:** Đang ở `http://localhost:3001`.
- **Các bước thực hiện:**
  1. Lướt qua danh sách các sự kiện đang diễn ra / sắp diễn ra.
  2. Quan sát hình ảnh poster, tên sự kiện, ngày giờ tổ chức, địa điểm, giá vé từ thấp nhất.
  3. F5 (Refresh trang) nhiều lần.
- **Kết quả mong đợi:**
  - Danh sách concert tải mượt mà (< 300ms).
  - Lần tải thứ 2 trở đi dữ liệu được trả về trực tiếp từ Redis Cache (Backend log không query lại DB).
  - Hiển thị đúng các concert đã seed (ví dụ: Concert Anh Trai Vượt Ngàn Chông Gai, Anh Trai Say Hi,...).

#### TC-CAT-02: Tìm Kiếm & Lọc Sự Kiện
- **Tiền điều kiện:** Đang ở `http://localhost:3001`.
- **Các bước thực hiện:**
  1. Nhập từ khóa vào ô tìm kiếm: `Chông Gai`.
  2. Bấm phím Enter hoặc icon tìm kiếm.
- **Kết quả mong đợi:**
  - Danh sách lập tức lọc chỉ còn concert khớp tên "Anh Trai Vượt Ngàn Chông Gai".
  - Nhập từ khóa không tồn tại (vd: `xyz999`): Hiển thị thông báo "Không tìm thấy sự kiện phù hợp".

#### TC-CAT-03: Xem Chi Tiết Concert, Tiểu Sử Nghệ Sĩ & Sơ Đồ Ghế SVG
- **Tiền điều kiện:** Đang ở trang chủ `http://localhost:3001`.
- **Các bước thực hiện:**
  1. Bấm vào card concert "[CONCERT ENCORE] ANH TRAI VƯỢT NGÀN CHÔNG GAI".
  2. Quan sát nội dung trang chi tiết (`/concerts/:id`):
     - Thông tin chi tiết, địa điểm (The Global City...).
     - Phần trích xuất AI Bio / Dàn nghệ sĩ tham gia.
     - Sơ đồ chỗ ngồi sân khấu (Seatmap SVG/Image).
     - Bảng danh sách các hạng vé (S-VIP, Xương Rồng, Sao Sáng, Đa Sắc...) kèm giá tiền, số lượng còn lại, số vé tối đa được mua (`max_per_user`).
- **Kết quả mong đợi:**
  - Toàn bộ thông tin hiển thị chính xác, hình ảnh và sơ đồ tải đúng định dạng.
  - Các hạng vé hết chỗ hiển thị badge `Hết vé` (Sold Out) và disable nút chọn.

---

### Suite 3: Luồng Giữ Chỗ & Đặt Vé (Ticketing & Reservation)

#### TC-TICK-01: Chọn Số Lượng Vé và Kiểm Tra Hạn Mức Tối Đa (Max Per User)
- **Tiền điều kiện:** Đã đăng nhập tài khoản Audience. Đang ở trang chi tiết concert còn vé mở bán.
- **Các bước thực hiện:**
  1. Chọn hạng vé có cấu hình `max_per_user = 4`.
  2. Thử tăng số lượng vé lên 5 hoặc 6.
- **Kết quả mong đợi:**
  - Nút `+` bị vô hiệu hóa hoặc hệ thống cảnh báo: "Bạn chỉ được mua tối đa 4 vé cho hạng vé này".
  - Không thể đặt số lượng vượt quá `max_per_user`.

#### TC-TICK-02: Giữ Chỗ Thành Công Qua Redis Lua Script (Atomic Reservation)
- **Tiền điều kiện:** Concert có hạng vé còn tồn kho.
- **Các bước thực hiện:**
  1. Chọn hạng vé còn 10 vé, số lượng: `2`.
  2. Bấm nút **"Đặt vé ngay"** / **"Mua vé"**.
- **Kết quả mong đợi:**
  - Backend thực thi Redis Lua script nguyên tử:
    1. Kiểm tra tồn kho > 2.
    2. Kiểm tra số lượng vé user đã mua chưa vượt giới hạn.
    3. Giảm biến counter tồn kho trong Redis.
    4. Bắn event vào hàng đợi RabbitMQ `orders.created`.
  - Frontend chuyển sang trang Thanh toán (`/checkout` hoặc `/orders/:id`), hiển thị:
    - Mã đơn hàng.
    - Danh sách vé đang giữ.
    - Tổng số tiền cần thanh toán.
    - Bộ đếm ngược thời gian giữ chỗ (Countdown Timer: ví dụ 10:00, 09:59...).

#### TC-TICK-03: Hết Hạn Giữ Chỗ Tự Động Nhả Vé (Order Expiry & Ticket Release)
- **Tiền điều kiện:** Tạo một đơn hàng giữ vé nhưng không tiến hành thanh toán.
- **Các bước thực hiện:**
  1. Quan sát bộ đếm ngược thời gian giữ chỗ.
  2. Chờ đến khi hết thời gian giữ chỗ (hoặc test nhanh bằng cách chỉnh sửa expires_at trong DB hoặc chạy task worker cleanup).
- **Kết quả mong đợi:**
  - Khi hết hạn: Trạng thái đơn hàng chuyển thành `CANCELLED`.
  - Số lượng vé trong Redis được tự động hoàn lại (rollback counter).
  - Người dùng khác có thể vào đặt lại số vé vừa được nhả ra.
  - Trên màn hình hiện thông báo: "Đơn hàng đã hết hạn giữ chỗ. Vui lòng đặt lại".

---

### Suite 4: Thanh Toán & Phát Hành Vé (Payment & Ticket Issuance)

#### TC-PAY-01: Tạo Giao Dịch Thanh Toán & Kiểm Tra Idempotency Key
- **Tiền điều kiện:** Đang ở trang checkout đơn hàng hợp lệ.
- **Các bước thực hiện:**
  1. Mở DevTools > Network tab.
  2. Bấm nút **"Thanh toán ngay"** liên tiếp 2 lần thật nhanh (Double-click).
  3. Kiểm tra các request gửi lên endpoint `/payments/process` (hoặc tương đương).
- **Kết quả mong đợi:**
  - Request có header `Idempotency-Key` (UUID).
  - Lần bấm thứ nhất: Backend ghi nhận key vào Redis (`SETNX`), tạo giao dịch thanh toán thành công.
  - Lần bấm thứ hai: Bị chặn ngay lập tức, trả về kết quả của giao dịch cũ, **tuyệt đối không tạo 2 giao dịch thanh toán trùng lặp** cho cùng một đơn hàng.

#### TC-PAY-02: Hoàn Tất Thanh Toán PayOS (Sandbox/Webhook)
- **Tiền điều kiện:** Chuyển hướng sang giao diện PayOS hoặc Sandbox QR.
- **Các bước thực hiện:**
  1. Quét mã VietQR thanh toán trong môi trường thử nghiệm PayOS hoặc kích hoạt giả lập Webhook thành công từ PayOS.
  2. Quan sát phản hồi từ hệ thống Backend Webhook `/payments/webhook`.
- **Kết quả mong đợi:**
  - Backend xác thực checksum chữ ký webhook hợp lệ.
  - Cập nhật trạng thái `PaymentTransaction` thành `PAID` / `SUCCESS`.
  - Cập nhật trạng thái `Order` thành `PAID`.
  - Hệ thống tự động kích hoạt tiến trình phát hành vé (`TicketIssued`):
    - Sinh ra bản ghi `Ticket` tương ứng trong PostgreSQL.
    - Mỗi vé có mã `qr_code_hash` duy nhất (được băm và gán salt bảo mật).
    - `is_scanned = false`.
  - Frontend tự động nhận được thông báo hoặc chuyển hướng đến trang "Thanh toán thành công" (`/payment/success`).

#### TC-PAY-03: Kiểm Tra Circuit Breaker Khi Cổng Thanh Toán Gặp Sự Cố
- **Tiền điều kiện:** Cấu hình mock cổng thanh toán trả về lỗi 500 hoặc Timeout liên tục.
- **Các bước thực hiện:**
  1. Thực hiện gửi 10 request thanh toán liên tục trong tình trạng cổng ngoài bị lỗi.
- **Kết quả mong đợi:**
  - Trong các lần gọi đầu: Circuit breaker ở trạng thái `CLOSED` và đếm tỷ lệ lỗi.
  - Khi tỷ lệ lỗi vượt ngưỡng: Mạch chuyển sang `OPEN`.
  - Các request tiếp theo bị từ chối tức thì (Fast-fail) mà không phải treo đợi timeout 30s.
  - Thông báo trả về người dùng: "Cổng thanh toán tạm thời gián đoạn. Vui lòng thử lại sau giây lát".

---

### Suite 5: Quản Lý Vé Cá Nhân (Audience My Tickets & E-Ticket QR)

#### TC-MYTICK-01: Xem Danh Sách Vé Đã Mua
- **Tiền điều kiện:** Tài khoản đã thanh toán thành công ít nhất 1 đơn hàng.
- **Các bước thực hiện:**
  1. Trên menu Header, bấm vào **"Vé của tôi"** (`/my-tickets`).
  2. Quan sát danh sách vé hiển thị.
- **Kết quả mong đợi:**
  - Hiển thị danh sách vé tương ứng với đơn hàng vừa mua.
  - Mỗi vé hiển thị đầy đủ:
    - Tên Concert.
    - Hạng vé & Vị trí cổng vào (Gate Number).
    - Thời gian tổ chức & Địa điểm.
    - Giá tiền.
    - Trạng thái vé: `Chưa soát` (Unscanned) màu xanh lá.

#### TC-MYTICK-02: Hiển Thị & Kiểm Tra Mã QR Soát Vé
- **Tiền điều kiện:** Đang ở trang danh sách vé `/my-tickets`.
- **Các bước thực hiện:**
  1. Bấm vào vé để mở modal hoặc trang chi tiết vé điện tử.
  2. Quan sát mã QR code được sinh ra trên màn hình.
  3. Dùng ứng dụng quét QR bất kỳ (hoặc camera điện thoại) quét thử mã QR này.
- **Kết quả mong đợi:**
  - Mã QR hiển thị rõ ràng, sắc nét.
  - Nội dung chứa chuỗi hash bảo mật đã được băm (`qr_code_hash`), không để lộ thông tin nhạy cảm ở dạng plain-text thô.

---

### Suite 6: Soát Vé Tại Cổng Mobile App (Online & Offline Gate Check-in)

#### TC-CHK-01: Đăng Nhập Nhân Viên Soát Vé & Tải Dữ Liệu Ngoại Tuyến (Pre-fetch)
- **Tiền điều kiện:** Chạy Mobile App Expo (`apps/mobile-app`). Đảm bảo kết nối tới backend.
- **Các bước thực hiện:**
  1. Mở App, đăng nhập tài khoản Checker: `quang.checker@ticketbox.local` / `123456`.
  2. Chọn ca làm việc / sự kiện được phân công.
  3. Quan sát quá trình tải trước dữ liệu vé (Pre-fetch).
- **Kết quả mong đợi:**
  - Ứng dụng tải về danh sách các `qr_code_hash` của các vé thuộc **Cổng 1 (Gate 1)** mà nhân viên Quang được phân công.
  - Dữ liệu được lưu trữ an toàn vào bộ nhớ cục bộ của máy (Local Storage / SQLite / AsyncStorage).
  - Giao diện báo: "Đã đồng bộ sẵn sàng X vé cho Cổng 1".

#### TC-CHK-02: Quét Vé Hợp Lệ Lần Đầu (Chế độ Trực Tuyến - Online)
- **Tiền điều kiện:** Mobile App đang online kết nối mạng. Có sẵn mã QR của vé hợp lệ thuộc Cổng 1.
- **Các bước thực hiện:**
  1. Bật camera quét mã trên Mobile App.
  2. Hướng camera vào mã QR vé hợp lệ (thuộc Gate 1).
- **Kết quả mong đợi:**
  - App nhận diện tức thì trong vòng < 0.5s.
  - Màn hình chuyển màu xanh lá rực rỡ, phát âm thanh thành công (Ding), hiển thị:
    - "VÉ HỢP LỆ (VALID)".
    - Tên khách hàng, Hạng vé (S-VIP 1), Cổng 1.
  - Backend cập nhật `tickets.is_scanned = true`, ghi nhận `scanned_at` và `scanned_by`.

#### TC-CHK-03: Chống Quét Trùng (Duplicate Scan / Chống Vé Giả 2 Lần)
- **Tiền điều kiện:** Giữ nguyên vé vừa quét thành công ở TC-CHK-02.
- **Các bước thực hiện:**
  1. Dùng camera quét lại chính xác mã QR đó lần thứ 2.
- **Kết quả mong đợi:**
  - Màn hình lập tức đổi sang màu đỏ cảnh báo (Alert).
  - Hiển thị thông báo lớn: "CẢNH BÁO: VÉ ĐÃ ĐƯỢC QUÉT TRƯỚC ĐÓ!".
  - Hiển thị rõ thời gian quét lần đầu và nhân viên đã thực hiện quét.
  - Chặn đứng hành vi gian lận dùng 1 vé cho 2 người vào cửa.

#### TC-CHK-04: Kiểm Tra Phân Luồng Cổng (Gate Segregation)
- **Tiền điều kiện:** Nhân viên đang trực tại Cổng 1 (Gate 1). Có mã QR của vé thuộc Cổng 2 (Gate 2 - Hạng vé Xương Rồng).
- **Các bước thực hiện:**
  1. Dùng camera Cổng 1 quét mã QR của vé Cổng 2.
- **Kết quả mong đợi:**
  - Hệ thống từ chối cho vào.
  - Hiển thị cảnh báo màu vàng/cam: "SAI CỔNG SOÁT VÉ! Vé này thuộc CỔNG 2, vui lòng hướng dẫn khách hàng di chuyển đến Cổng 2".
  - Vé không bị đánh dấu là đã quét.

#### TC-CHK-05: Soát Vé Ngoại Tuyến (Offline Mode) & Đồng Bộ Khi Có Mạng (Bulk Sync)
- **Tiền điều kiện:** Đã pre-fetch dữ liệu vé Cổng 1 trên Mobile App.
- **Các bước thực hiện:**
  1. Bật chế độ Máy bay (Airplane Mode) trên điện thoại (ngắt hoàn toàn Wi-Fi và 4G).
  2. Tiến hành quét 3 vé mới chưa từng quét thuộc Cổng 1.
  3. Thử quét lại 1 vé trong số 3 vé đó ngay khi đang offline.
  4. Tắt chế độ Máy bay (bật lại Wi-Fi/4G kết nối internet).
  5. Bấm nút **"Đồng bộ vé"** (hoặc đợi app tự động kích hoạt auto-sync).
- **Kết quả mong đợi:**
  - Khi offline: App vẫn kiểm tra được vé hợp lệ từ bộ nhớ local, báo xanh thành công cho 3 vé mới; và vẫn phát hiện được vé quét trùng ở bước 3.
  - Các lượt quét offline được ghi vào hàng đợi offline queue trên máy.
  - Khi có mạng lại: App tự động gọi API `POST /checkin/sync` (Bulk Sync) đẩy danh sách lên backend.
  - Kiểm tra Database PostgreSQL: Toàn bộ 3 vé trên được cập nhật `is_scanned = true` với timestamp chính xác lúc quét offline.

---

### Suite 7: Quản Trị Sự Kiện & Cấu Hình Hạng Vé (Admin/Organizer Event Management)

#### TC-ADM-EVT-01: Tạo Concert Mới và Cấu Hình Các Hạng Vé
- **Tiền điều kiện:** Đăng nhập tài khoản Admin (`vy.admin@ticketbox.local`) trên `http://localhost:3002`.
- **Các bước thực hiện:**
  1. Vào menu **"Quản lý sự kiện"** > Bấm nút **"Tạo sự kiện mới"** (`/create-event`).
  2. Điền thông tin:
     - Tên concert: `LIVESHOW TRI ÂM - MỸ TÂM 2026`.
     - Địa điểm: `Sân vận động Mỹ Đình, Hà Nội`.
     - Ngày giờ bắt đầu: Chọn ngày trong tương lai.
     - Mô tả sự kiện: `Đêm nhạc hoành tráng kỷ niệm...`.
  3. Thêm Hạng vé 1:
     - Tên hạng: `SUPER VIP`.
     - Giá vé: `5.000.000 đ`.
     - Tổng số lượng: `500`.
     - Giới hạn mỗi người: `2`.
     - Cổng soát vé: `1`.
  4. Thêm Hạng vé 2:
     - Tên hạng: `GA KHÁN ĐÀI`.
     - Giá vé: `1.200.000 đ`.
     - Tổng số lượng: `5000`.
     - Giới hạn mỗi người: `4`.
     - Cổng soát vé: `2`.
  5. Bấm **"Lưu và Công bố sự kiện"**.
- **Kết quả mong đợi:**
  - Sự kiện được lưu thành công vào PostgreSQL (`concerts` và `ticket_categories`).
  - Redis cache danh mục sự kiện được làm mới (Cache Invalidation).
  - Sang Web Khách hàng (`:3001`): Sự kiện mới lập tức xuất hiện trên trang chủ.

#### TC-ADM-EVT-02: Cập Nhật Trạng Thái & Thông Tin Concert
- **Tiền điều kiện:** Đang ở danh sách sự kiện trên Admin Portal.
- **Các bước thực hiện:**
  1. Chọn sự kiện vừa tạo > Bấm **"Chỉnh sửa"**.
  2. Đổi trạng thái từ `UPCOMING` sang `ON_SALE` hoặc `POSTPONED`.
  3. Bấm **"Cập nhật"**.
- **Kết quả mong đợi:**
  - Trạng thái được cập nhật thành công.
  - Giao diện Admin và Web phản ánh ngay trạng thái mới.

---

### Suite 8: Phân Công Cổng Soát Vé & Quản Lý Nhân Sự (Checker Assignment & Users)

#### TC-ADM-CHK-01: Phân Công Nhân Viên Vào Cổng Soát Vé
- **Tiền điều kiện:** Đang đăng nhập Admin trên `http://localhost:3002`.
- **Các bước thực hiện:**
  1. Vào mục **"Phân công soát vé"** (`/assignments`).
  2. Chọn sự kiện: `LIVESHOW TRI ÂM - MỸ TÂM 2026`.
  3. Chọn nhân viên: `Quang Checker` (`quang.checker@ticketbox.local`).
  4. Chọn Cổng phụ trách: `Cổng 1`.
  5. Bấm **"Xác nhận phân công"**.
- **Kết quả mong đợi:**
  - Bản ghi mới được tạo trong bảng `checker_assignments`.
  - Khi nhân viên Quang mở Mobile App, sự kiện và Cổng 1 tự động xuất hiện trong danh sách ca trực.
  - Hệ thống ngăn chặn việc phân công trùng 1 nhân viên cho 2 cổng khác nhau trong cùng 1 sự kiện.

#### TC-ADM-USR-01: Xem Danh Sách & Khóa Tài Khoản Vi Phạm
- **Tiền điều kiện:** Đang ở mục **"Quản lý người dùng"** (`/users`).
- **Các bước thực hiện:**
  1. Tìm kiếm một user theo email.
  2. Bấm đổi trạng thái từ `ACTIVE` sang `LOCKED` (Khóa).
  3. Thử dùng tài khoản đó đăng nhập trên Web App `:3001`.
- **Kết quả mong đợi:**
  - Trạng thái user đổi thành `LOCKED` trong DB.
  - Khi đăng nhập trên Web: Báo lỗi "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên".

---

### Suite 9: Dashboard Quản Trị & Báo Cáo Doanh Thu (Admin Dashboard & Revenue Analytics)

#### TC-ADM-DASH-01: Kiểm Tra Số Liệu KPI Tổng Quan Trên Dashboard
- **Tiền điều kiện:** Đăng nhập Admin vào `http://localhost:3002/dashboard`.
- **Các bước thực hiện:**
  1. Quan sát các thẻ thống kê tổng quan:
     - Tổng doanh thu (Total Revenue).
     - Tổng số vé đã bán (Tickets Sold).
     - Tổng số đơn hàng (Orders).
     - Tỷ lệ check-in thành công tại cổng.
  2. Đối chiếu số liệu với số lượng đơn hàng `PAID` thực tế trong CSDL.
- **Kết quả mong đợi:**
  - Các con số thống kê khớp với dữ liệu thực tế, định dạng tiền tệ rõ ràng (ví dụ: `15.450.000.000 ₫`).
  - Biểu đồ doanh thu theo thời gian và tỷ lệ lấp đầy sân khấu hiển thị trực quan, mượt mà.

#### TC-ADM-REV-01: Báo Cáo Doanh Thu Chi Tiết Theo Từng Sự Kiện
- **Tiền điều kiện:** Vào menu **"Doanh thu"** (`/revenue`).
- **Các bước thực hiện:**
  1. Lọc báo cáo theo sự kiện cụ thể.
  2. Xem bảng phân tích doanh thu theo từng hạng vé (S-VIP bán được bao nhiêu, GA bán được bao nhiêu).
  3. Thử bấm nút **"Xuất báo cáo Excel / CSV"** (nếu có).
- **Kết quả mong đợi:**
  - Bảng thống kê hiển thị chi tiết: Tên hạng vé, Đơn giá, Số vé đã bán, Tỷ lệ %, Doanh thu thành tiền.
  - Số liệu chính xác và trực quan.

---

### Suite 10: Tác Vụ Nền & AI (Background Jobs, CSV Guest Import & AI Bio)

#### TC-WORK-01: Import Danh Sách Khách Mời (Guest List) Bằng File CSV
- **Tiền điều kiện:** Đang ở mục **"Tác vụ nền"** (`/jobs`) trên Admin Portal. Chuẩn bị 1 file `guests.csv` gồm các cột: `email,full_name,ticket_category`.
- **Các bước thực hiện:**
  1. Chọn sự kiện cần import khách mời.
  2. Tải lên file `guests.csv` (chứa 100 - 1000 dòng).
  3. Bấm **"Bắt đầu xử lý nền"**.
  4. Quan sát thanh tiến độ (Progress Bar 0% -> 50% -> 100%).
- **Kết quả mong đợi:**
  - Hệ thống tạo `BackgroundJob` với trạng thái `PROCESSING`.
  - Quá trình xử lý chạy ngầm (chunking), không gây đơ hay nghẽn server.
  - Khi hoàn tất: Chuyển sang `COMPLETED`, hiển thị số dòng thành công / số dòng lỗi.
  - Dữ liệu khách mời được ghi đầy đủ vào bảng `guest_lists`.

#### TC-WORK-02: Tự Động Trích Xuất Tiểu Sử Nghệ Sĩ Bằng AI (AI Bio Generation)
- **Tiền điều kiện:** Mở form tạo/sửa concert.
- **Các bước thực hiện:**
  1. Nhập danh sách nghệ sĩ biểu diễn: `Soobin, Binz, Jun Phạm, Rhymastic`.
  2. Bấm nút **"Tạo tiểu sử nghệ sĩ bằng AI"** (Generate Artist Bio with AI).
- **Kết quả mong đợi:**
  - Backend gọi service tích hợp LLM (OpenAI API / fallback service).
  - Tự động sinh ra đoạn văn giới thiệu súc tích, chuyên nghiệp về phong cách âm nhạc và dấu ấn của dàn nghệ sĩ.
  - Nội dung được điền tự động vào trường `ai_bio`.

---

### Suite 11: Khả Năng Phục Hồi & Chống Quá Tải (Rate Limit & Resilience)

#### TC-RES-01: Kiểm Tra Cơ Chế Chặn Spam Token Bucket (HTTP 429 Too Many Requests)
- **Tiền điều kiện:** Backend đang chạy.
- **Các bước thực hiện:**
  1. Mở PowerShell tại thư mục gốc của dự án.
  2. Chạy script mô phỏng bắn liên tục 50 request trong 2 giây vào endpoint `/concerts` hoặc `/tickets/reserve`:
     ```powershell
     1..50 | ForEach-Object {
       Invoke-RestMethod -Uri "http://localhost:3000/concerts" -Method Get -SkipHttpErrorCheck
     }
     ```
- **Kết quả mong đợi:**
  - Các request đầu tiên vượt qua bình thường (HTTP 200).
  - Khi hết token trong bucket, các request tiếp theo lập tức nhận mã HTTP `429 Too Many Requests`.
  - Header trả về có thông tin `Retry-After`.
  - Server vẫn hoạt động ổn định, RAM và CPU không bị tràn.

#### TC-RES-02: Chạy Script K6 Kiểm Tra Chống Bán Quá Số Lượng (Oversell Resistance)
- **Tiền điều kiện:** Đã cài đặt công cụ `k6`. Hạng vé test chỉ còn đúng **10 vé**.
- **Các bước thực hiện:**
  1. Mở PowerShell tại thư mục gốc.
  2. Chạy k6 test:
     ```powershell
     .\scripts\k6-oversell-check.local.ps1
     ```
  3. Mô phỏng 30-50 người dùng ảo (VUs) đồng thời bấm mua vé cùng một tích tắc.
- **Kết quả mong đợi:**
  - Kiểm tra kết quả tổng kết trong console hoặc file `k6-oversell-summary.json`.
  - **Chỉ có chính xác 10 đơn hàng đặt vé thành công**.
  - Các request còn lại nhận thông báo hết vé.
  - Số lượng vé phát hành trong DB sau test bằng đúng 10, **tuyệt đối không bị âm vé hay bán vượt số lượng (Zero Oversell)**.

---

## 5. Checklist Nghiệm Thu Cuối Cùng (Sign-off Checklist)

Người kiểm thử đánh dấu `[x]` vào các hạng mục sau khi đã chạy thực tế:

- [ ] **1. Môi trường & Khởi động:**
  - [ ] Redis & RabbitMQ container khởi động ổn định.
  - [ ] Prisma migration và seed data hoàn tất không lỗi.
  - [ ] Cả 3 ứng dụng (API 3000, Web 3001, Admin 3002) chạy đồng thời không xung đột cổng.
- [ ] **2. Luồng Khách Hàng (Audience Flow):**
  - [ ] Đăng ký, đăng nhập, đăng xuất mượt mà.
  - [ ] Xem danh sách, tìm kiếm và xem chi tiết sự kiện tải nhanh.
  - [ ] Giữ chỗ chính xác, countdown hoạt động, chặn vượt hạn mức `max_per_user`.
  - [ ] Nhả vé tự động khi hết hạn thanh toán.
  - [ ] Thanh toán PayOS và cấp phát vé QR salted hash thành công.
  - [ ] Trang "Vé của tôi" hiển thị đầy đủ vé và QR sắc nét.
- [ ] **3. Luồng Soát Vé (Checker Flow):**
  - [ ] Pre-fetch dữ liệu theo phân luồng Gate chính xác.
  - [ ] Quét vé hợp lệ báo xanh (Ding).
  - [ ] Quét vé trùng báo đỏ cảnh báo gian lận.
  - [ ] Quét sai Gate từ chối vào cổng.
  - [ ] Quét ngoại tuyến (Offline) hoạt động tốt, tự động bulk-sync khi có mạng.
- [ ] **4. Luồng Quản Trị (Admin/Organizer Flow):**
  - [ ] Bảo vệ truy cập Admin bằng RBAC chặt chẽ.
  - [ ] Tạo sự kiện mới, cấu hình hạng vé và sơ đồ SVG thành công.
  - [ ] Phân công nhân viên vào cổng soát vé chính xác.
  - [ ] Dashboard và Báo cáo doanh thu hiển thị đúng số liệu thực tế.
  - [ ] Background job import CSV và AI bio hoạt động không treo server.
- [ ] **5. Khả Năng Chịu Tải & Phòng Vệ:**
  - [ ] Rate limit trả về HTTP 429 khi bị spam.
  - [ ] Không xảy ra oversell dưới k6 concurrency test.
  - [ ] Idempotency key ngăn chặn thành công double-charge.

---
*Tài liệu hoàn thành phục vụ kiểm thử nghiệm thu toàn diện hệ thống TicketBox.*
