# Backend — Kiến Trúc NestJS Modular & Design Patterns

## 1) Vì Sao Chọn NestJS Thay Vì Express.js?
Mặc dù Express.js rất nhẹ và linh hoạt, đối với một hệ thống phân tán cấp doanh nghiệp có nhiều module phức tạp (Auth, Ticketing, Payment, Checkin, RabbitMQ), Express dễ trở thành "spaghetti code" nếu không có quy chuẩn chặt chẽ.

NestJS cung cấp:
- **Kiến trúc phân tầng chuẩn hóa (Modular Architecture):** Controller -> Service -> Repository.
- **Dependency Injection (IoC Container):** Giúp code khớp nối lỏng (loosely coupled), cực kỳ dễ viết Unit Test và mock service.
- **Bộ công cụ cấp hệ thống:** Guards (Bảo mật/Phân quyền), Interceptors (Biến đổi response/Logging), Pipes (Xác thực dữ liệu đầu vào) và Exception Filters.

---

## 2) Phân Tầng Các Module Trong Tixora
Backend Core API (`apps/backend-api`) được tổ chức thành các Feature Modules độc lập:
1. `AuthModule`: Quản lý người dùng, đăng ký, đăng nhập, sinh Stateless JWT.
2. `EventsModule`: Quản lý danh mục concert, sơ đồ hạng vé, tích hợp Redis Cache-aside.
3. `TicketingModule`: Động cơ xử lý giữ chỗ Flash-Sale với Redis Lua Script và xuất vé.
4. `PaymentModule`: Tích hợp PayOS Webhook, kiểm tra chữ ký HMAC và Idempotency Key.
5. `CheckinModule`: Phục vụ API prefetch danh sách vé theo Cổng và tiếp nhận bulk sync ngoại tuyến.
6. `RabbitMQModule`: Đóng gói logic kết nối AMQP, phát hành và tiêu thụ sự kiện đặt vé ngầm.

---

## 3) Luồng Xử Lý Request Trong NestJS (Request Lifecycle)
Mỗi request gửi tới Backend đi qua các trạm kiểm soát nghiêm ngặt:
1. **Global Guards (`JwtAuthGuard`, `RolesGuard`):** Kiểm tra tính hợp lệ của token và quyền hạn (RBAC) của người dùng trước khi chạm vào controller.
2. **Validation Pipe (`ZodValidationPipe` / `ValidationPipe`):** Kiểm tra và ép kiểu dữ liệu đầu vào theo DTO, từ chối request sai định dạng ngay từ đầu với mã lỗi `400 Bad Request`.
3. **Controller:** Chỉ làm nhiệm vụ điều phối (Routing) và gọi Service tương ứng.
4. **Service:** Chứa 100% logic nghiệp vụ cốt lõi, gọi Redis Lua Script hoặc Prisma Database.
5. **Exception Filter (`AllExceptionsFilter`):** Bắt toàn bộ lỗi chưa xử lý và chuẩn hóa định dạng JSON phản hồi: `{ success: false, statusCode, message, timestamp }`.

---

## 4) Câu Hỏi Phỏng Vấn & Cách Trả Lời
1. *Dependency Injection trong NestJS hoạt động như thế nào?*
   - NestJS khởi tạo một IoC (Inversion of Control) container. Khi một class được đánh dấu `@Injectable()`, container sẽ tự động phân giải và tiêm (inject) các phụ thuộc vào constructor của các class khác khi khởi động ứng dụng.
2. *Guard và Middleware trong NestJS khác nhau ở điểm nào?*
   - Middleware chạy trước nhưng không có quyền truy cập vào `ExecutionContext` để biết route handler nào chuẩn bị được thực thi. Guard chạy sau Middleware, có quyền truy cập vào metadata của route (ví dụ: các decorator `@Roles('ADMIN')`) để đưa ra quyết định cho phép hoặc từ chối request.
