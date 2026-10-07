# Tixora — Tổng Quan Hệ Thống (Dành Cho Thuyết Trình 2–3 Phút)

## 1) Elevator Pitch (30–45 Giây)
Tixora là nền tảng phân phối và kiểm soát vé sự kiện quy mô lớn (mô hình *Ticketbox / Ticketmaster*) được thiết kế theo cấu trúc **pnpm Monorepo** với 4 phân hệ độc lập: **Audience Web**, **Admin Portal**, **Mobile Scanner** và **Backend Core API**.

Khác với các ứng dụng CRUD thông thường, Tixora tập trung giải quyết **2 bài toán kỹ thuật sống còn** của ngành sự kiện:
1. **Flash-Sale Cực Đại (Zero-Oversell)**: Khi 50.000 người cùng bấm mua vé trong 1 giây, hệ thống cam kết không sập server, không nghẽn database và **100% Zero-Oversell** nhờ động cơ **Redis Lua Script** nguyên tử trên RAM và **RabbitMQ** đệm ghi CSDL bất đồng bộ.
2. **Soát Vé Ngoại Tuyến (Offline-First Gate Check-in)**: Tại sân vận động 40.000 khán giả khi sóng 4G/Wifi bị nghẽn hoàn toàn, thiết bị di động của nhân viên vẫn xác thực vé hợp lệ trong **< 100ms** nhờ cơ chế **Gate Segregation**, đối chiếu mã băm Salted HMAC cục bộ và tự động đồng bộ khi có mạng.

---

## 2) Kiến Trúc Chạy End-to-End

### Các Phân Hệ Ứng Dụng (Monorepo Workspaces)
- `apps/web-app`: Next.js 16 Client Portal — Khám phá concert, đặt chỗ đếm ngược 10 phút, thanh toán VietQR PayOS.
- `apps/admin-app`: Next.js 16 Admin Dashboard — Báo cáo doanh thu thời gian thực, duyệt sự kiện, phân quyền 5 cấp RBAC.
- `apps/mobile-app`: Expo (React Native) — Quét mã QR vé tại cổng kiểm soát, hỗ trợ hoạt động ngoại tuyến khi mất sóng Internet.
- `apps/backend-api`: NestJS Core API — Kiến trúc Modular, Stateless JWT, Redis Lua Engine, RabbitMQ Producer/Consumer.
- `apps/mcp-server`: MCP Server — Chuẩn Model Context Protocol tích hợp AI trợ lý phân tích dữ liệu vé.

### Hạ Tầng & Dịch Vụ Lưu Trữ
- `postgresql`: CSDL chính quản lý quan hệ thực thể, bọc trong Prisma ORM.
- `redis`: Bộ nhớ RAM tốc độ cao cho động cơ trừ vé Lua Script, Token Bucket Rate Limiting, Cache-Aside và Idempotency Key.
- `rabbitmq`: Message Broker đệm sự kiện mua vé và xử lý các tác vụ ngầm bất đồng bộ.

---

## 3) Mô Hình Dữ Liệu Cốt Lõi (Core Data Model)
- **User & Roles**: Quản lý định danh với 5 vai trò: `SUPERADMIN`, `ADMIN`, `ORGANIZER`, `AUDIENCE`, `CHECKER`.
- **Event & TicketTier**: Sự kiện có nhiều hạng vé (VIP, GA, Early Bird). Mỗi hạng vé lưu `total_quantity`, `price`, và `max_per_user`.
- **TicketReservation (RAM)**: Phiên giữ chỗ nguyên tử lưu trên Redis với thời hạn TTL 600 giây (10 phút).
- **Order & Ticket**: Đơn hàng lưu trạng thái `PENDING -> PAID -> CANCELLED/EXPIRED`. Vé điện tử lưu mã băm HMAC-SHA256 (`qr_code_hash`) và trạng thái `AVAILABLE -> CHECKED_IN`.
- **Gate & CheckinLog**: Phân bổ vé theo cổng kiểm soát (`Gate A`, `Gate B`), ghi nhận nhật ký quét kèm `device_id` và mốc thời gian `scanned_at`.

---

## 4) 4 Luồng Nghiệp Vụ "Hay Bị Xoáy" Nhất Trong Phỏng Vấn

### 4.1 Săn Vé Flash-Sale & Giữ Chỗ Nguyên Tử (Atomic Hold)
- Client gửi yêu cầu giữ vé kèm `Idempotency-Key`.
- Backend gọi Redis Lua script: kiểm tra số lượng tồn và giới hạn của user -> nếu hợp lệ thì trừ tồn kho và ghi nhận phiên giữ vé với TTL 10 phút.
- Đẩy sự kiện `TicketReserved` vào RabbitMQ để Worker ghi nhận đơn hàng tạm thời xuống PostgreSQL.

### 4.2 Thanh Toán PayOS & Khóa Lũy Đẳng (Idempotency Key)
- Client quét mã VietQR tự động sinh từ cổng PayOS.
- PayOS gửi Webhook về server -> Backend kiểm tra chữ ký điện tử HMAC-SHA256.
- Bọc cập nhật trạng thái đơn hàng bằng Redis `SETNX` (TTL 24h) để chống trùng lặp khi mạng bị lặp gói tin.

### 4.3 Soát Vé Ngoại Tuyến Tại Cổng (Offline Gate Check-in)
- Trước giờ mở cửa, máy quét tải trước danh sách băm `qr_code_hash` của các vé thuộc cổng đó.
- Khi mất mạng, camera quét QR -> máy băm chuỗi QR và so khớp trực tiếp trong SQLite/Local Storage (< 100ms).
- Khi có mạng trở lại, ứng dụng đẩy mảng logs check-in lên máy chủ trung tâm để hợp nhất dữ liệu.

### 4.4 Phòng Thủ Quá Tải & Rate Limiting (Token Bucket Guard)
- Thuật toán Token Bucket kiểm soát lưu lượng request tại tầng Middleware/Guard.
- Khi user spam F5 hoặc bot quét vé vượt quá quota, trả về mã lỗi `HTTP 429 Too Many Requests` ngay lập tức để bảo vệ tài nguyên server.

---

## 5) Top 10 Câu Hỏi Nhà Tuyển Dụng Hay Xoáy Về Kiến Trúc Tixora
1. Vì sao không dùng `SELECT FOR UPDATE` để trừ vé trong Database?
2. Khách giữ vé 10 phút xong thoát ứng dụng thì vé được hoàn lại như thế nào?
3. Khi soát vé Offline, làm sao ngăn chặn trường hợp kẻ gian dùng ảnh chụp màn hình vé đã quét ở cửa khác?
4. RabbitMQ mang lại lợi ích gì so với gọi API đồng bộ trong luồng mua vé?
5. Nếu Redis bị sập đột ngột trong lúc đang mở bán Flash-Sale thì hệ thống xử lý ra sao?
6. Bạn cấu hình Rate Limiting theo địa chỉ IP hay theo User ID? Ưu nhược điểm là gì?
7. Tại sao lại chọn pnpm Monorepo thay vì chia thành các Git Repository riêng biệt?
8. Tại sao chọn NestJS thay vì Express.js cho dự án này?
9. Cơ chế Bulk-Sync giải quyết xung đột dữ liệu như thế nào khi 2 máy quét cùng quét 1 vé lúc mất mạng?
10. Bạn đã dùng công cụ gì để chứng minh hệ thống đạt 100% Zero-Oversell?
