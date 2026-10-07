# Xác Thực & Phân Quyền — Stateless JWT & 5-Level RBAC

## 1) Mô Hình Phân Quyền 5 Cấp (5-Level RBAC Hierarchy)
Tixora phân tách ranh giới bảo mật rõ rệt giữa 5 đối tượng người dùng:
1. `SUPERADMIN`: Toàn quyền quản trị hệ thống, kiểm toán tài chính ký quỹ (Escrow), giải ngân cho Ban tổ chức và quản trị toàn bộ người dùng.
2. `ADMIN`: Phê duyệt hoặc tạm ngưng sự kiện concert, xem báo cáo doanh thu tổng quan toàn sàn, quản lý danh mục và xem nhật ký Audit Logs.
3. `ORGANIZER`: Tạo và chỉnh sửa sự kiện của mình, cấu hình các hạng vé, sơ đồ ghế, quản lý danh sách vé đã bán và theo dõi doanh thu thực tế.
4. `CHECKER`: Nhân viên soát vé tại cổng sân vận động, chỉ có quyền tải danh sách băm vé theo Cổng được phân công và đẩy nhật ký check-in.
5. `AUDIENCE`: Khán giả thông thường, xem danh sách sự kiện, đặt giữ chỗ vé Flash-Sale, thanh toán PayOS và quản lý ví vé điện tử cá nhân.

---

## 2) Cơ Chế Triển Khai Trong NestJS
- **Custom Decorator `@Roles(...)`:** Gắn metadata các vai trò được phép truy cập vào từng Route Handler:
  ```typescript
  @Post('events')
  @Roles(Role.ORGANIZER, Role.ADMIN)
  async createEvent(@Body() dto: CreateEventDto) { ... }
  ```
- **NestJS `RolesGuard`:** Đọc metadata từ `Reflector` và so khớp với `user.role` được trích xuất từ JWT Payload đã giải mã. Nếu không đủ quyền, trả về ngay mã lỗi `403 Forbidden`.

---

## 3) Tại Sao Dùng Stateless JWT?
- **Không phụ thuộc vào Database Session:** Không cần phải query bảng `Session` hoặc Redis mỗi khi có request gửi đến. Token tự mang theo chữ ký điện tử HMAC-SHA256, giúp giảm tải tối đa cho cơ sở dữ liệu trong các đợt mở bán vé cao điểm.
- **Dễ dàng mở rộng đa dịch vụ:** Bất kỳ ứng dụng nào trong Monorepo (Web, Admin, Mobile, MCP Server) đều có thể giải mã và xác thực token cục bộ bằng khóa bí mật `JWT_SECRET`.

---

## 4) Câu Hỏi Phỏng Vấn & Cách Trả Lời
1. *Nếu Stateless JWT bị lộ thì làm sao thu hồi trước khi hết hạn?*
   - Tixora thiết lập thời gian sống ngắn cho Access Token (ví dụ: 15–30 phút) kết hợp Refresh Token Rotation. Trong trường hợp khẩn cấp cần khóa tài khoản ngay, hệ thống duy trì một danh sách đen (Blacklist Token) trong Redis với thời gian hết hạn bằng đúng thời gian còn lại của token đó.
2. *Làm sao ngăn chặn việc Audience cố tình gọi API duyệt sự kiện của Admin?*
   - Cả hai lớp bảo vệ: Ở Frontend, UI ẩn các nút thao tác; ở Backend, `RolesGuard` chặn ở cấp độ controller và từ chối request trước khi bất kỳ đoạn code nghiệp vụ nào được thực thi.
