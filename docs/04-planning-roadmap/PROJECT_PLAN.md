### TÀI LIỆU KẾ HOẠCH DỰ ÁN (PROJECT PLAN V3 - THỰC CHIẾN)

**Kiến trúc cốt lõi:** Modular Monolith kết hợp Event-Driven.
**Công nghệ sử dụng:** NestJS, Prisma, PostgreSQL (Supabase), Redis, RabbitMQ.

---

#### SPRINT 1: NỀN MÓNG DỮ LIỆU, XÁC THỰC VÀ DANH MỤC (Tuần 1)

**Epic 1: Hạ tầng và Dữ liệu**

* **Issue 1.1: Khởi tạo Hạt giống dữ liệu (Seed Data)**
* **Mô tả:** Viết script `prisma/seed.ts` để nạp dữ liệu Admin, cấu hình TicketCategory và 4 concert mẫu.
* **Yêu cầu hoàn thành:** Lệnh `npx prisma db seed` chạy thành công, DB có sẵn dữ liệu test.

**Epic 2: Quản lý định danh và Phân quyền (AuthModule)**

* **Issue 2.1: Khởi tạo Module, DTOs và API Đăng ký/Đăng nhập**
* **Mô tả:** Tạo `AuthController`, `AuthService`. Định nghĩa `LoginDto`, `RegisterDto` (validate email, password). Viết logic băm mật khẩu (bcrypt).
* **Yêu cầu hoàn thành:** API `/auth/login` và `/auth/register` hoạt động, trả về HTTP 200.

---

* **Issue 2.2: Cấp phát JWT và Middleware Phân quyền (RBAC Guard)**
* **Mô tả:** Tích hợp `@nestjs/jwt`. Viết `RolesGuard` để đọc JWT payload và chặn request.
* **Yêu cầu hoàn thành:** API trả về mã JWT hợp lệ. Các request sai quyền bị từ chối với mã 403 Forbidden.

**Epic 3: Quản lý Sự kiện (CatalogModule)**

* **Issue 3.1: Khởi tạo API CRUD cho Concerts**
* **Mô tả:** Xây dựng các endpoint `GET /concerts`, `GET /concerts/:id`. Định nghĩa DTO trả về thông tin sự kiện, sơ đồ SVG và danh sách loại vé.
* **Yêu cầu hoàn thành:** API trả về đúng định dạng JSON, có phân trang (pagination).

---

* **Issue 3.2: Tích hợp Cache-aside với Redis**
* **Mô tả:** Áp dụng Redis Cache cho các API đọc Concert. Thiết lập TTL 24h.
* **Yêu cầu hoàn thành:** Lần gọi API thứ 2 không sinh ra câu lệnh query xuống PostgreSQL.

#### SPRINT 2: XỬ LÝ TẢI CAO, ĐẶT VÉ VÀ THANH TOÁN (Tuần 2)

**Epic 4: Luồng Đặt vé cốt lõi (TicketingModule)**

* **Issue 4.1: Khởi tạo API Đặt vé và DTOs**
* **Mô tả:** Tạo endpoint `POST /tickets/reserve`. Định nghĩa `ReserveTicketDto` (chứa `concert_id`, `category_id`, `quantity`).
* **Yêu cầu hoàn thành:** API nhận đúng payload và validate được dữ liệu đầu vào.

---

* **Issue 4.2: Xử lý tranh chấp bằng Redis Lua Script**
* **Mô tả:** Tích hợp tập lệnh Lua vào `TicketingService` để kiểm tra vé tồn, giới hạn user và trừ vé nguyên tử.
* **Yêu cầu hoàn thành:** Chặn đứng Overbooking dưới tải cao giả lập.

---

* **Issue 4.3: Tích hợp RabbitMQ và Hủy đơn tự động (Delay Queue)**
* **Mô tả:** Viết Publisher đẩy message giữ chỗ vào RabbitMQ. Viết Consumer tạo record vào bảng `orders` (PENDING). Cài đặt Dead Letter Exchange hủy đơn sau 10 phút.
* **Yêu cầu hoàn thành:** Đơn hàng lưu thành công vào DB. Quá 10 phút tự động cập nhật CANCELLED.

**Epic 5: Tích hợp Thanh toán (PaymentModule)**

* **Issue 5.1: Khởi tạo API Thanh toán và Cổng Mockup**
* **Mô tả:** Tạo endpoint `POST /payments/process`. Định nghĩa `CreatePaymentDto`. Viết một service giả lập API của VNPAY/MoMo (nhận request và trả về random Success/Timeout).
* **Yêu cầu hoàn thành:** Có API để Frontend gọi thanh toán và nhận về URL/kết quả.

---

* **Issue 5.2: Chống trừ tiền hai lần (Idempotency Key)**
* **Mô tả:** Viết Middleware/Interceptor đọc Header `Idempotency-Key`. Dùng lệnh `SETNX` trên Redis với TTL 24h.
* **Yêu cầu hoàn thành:** Request trùng lặp bị chặn ngay tại controller, trả về kết quả cũ.

---

* **Issue 5.3: Xử lý lỗi cổng thanh toán (Circuit Breaker)**
* **Mô tả:** Tích hợp thư viện Circuit Breaker bọc hàm gọi Mockup VNPAY.
* **Yêu cầu hoàn thành:** Mạch tự động ngắt (OPEN) khi tỷ lệ lỗi > 50%, trả về Fast-fail.
 
#### SPRINT 3: TÁC VỤ NGOẠI TUYẾN, XỬ LÝ NỀN VÀ HOÀN THIỆN (Tuần 3)

**Epic 6: Soát vé Ngoại tuyến (CheckinModule)**

* **Issue 6.1: API Tải trước dữ liệu (Pre-fetch)**
* **Mô tả:** Viết endpoint `GET /checkin/prefetch/:concert_id` trả về danh sách Hashed QR cho Mobile App.
* **Yêu cầu hoàn thành:** Trả về tập dữ liệu chuẩn JSON, có lọc theo luồng cổng (Gate).

---

* **Issue 6.2: API Đồng bộ dữ liệu hàng loạt (Bulk-sync)**
* **Mô tả:** Viết endpoint `POST /checkin/sync` nhận một mảng các vé đã quét từ Mobile App để cập nhật PostgreSQL.
* **Yêu cầu hoàn thành:** Trạng thái soát vé cập nhật chính xác mà không gây Deadlock DB.
 
**Epic 7: Tác vụ nền và Tích hợp (WorkerModule)**

* **Issue 7.1: Xử lý Upload file CSV Khách mời**
* **Mô tả:** Viết API upload multipart/form-data. Cài đặt luồng cắt nhỏ file (Chunking) và nạp bằng UPSERT.
* **Yêu cầu hoàn thành:** Import thành công file 10.000 dòng không block Event Loop.

---

* **Issue 7.2: Trích xuất hồ sơ nghệ sĩ bằng AI**
* **Mô tả:** Viết API upload PDF, trả về Job ID. Viết Background Worker bóc tách text và gọi API LLM (Gemini/OpenAI).
* **Yêu cầu hoàn thành:** Cập nhật thành công đoạn Bio vào bảng Concerts thông qua xử lý ngầm.
  
**Epic 8: Nghiệm thu và Báo cáo**

* **Issue 8.1: Đóng gói tài liệu (README, Design)**
* **Mô tả:** Hoàn thiện `README.md` theo yêu cầu đồ án.
* **Yêu cầu hoàn thành:** Người chấm có thể chạy `docker-compose up` thành công.

---

* **Issue 8.2: Sản xuất Video báo cáo kỹ thuật**
* **Mô tả:** Quay màn hình demo (Luồng mua vé, Circuit Breaker, Offline, Idempotency).
* **Yêu cầu hoàn thành:** Video FullHD (1080p), định dạng MP4.
