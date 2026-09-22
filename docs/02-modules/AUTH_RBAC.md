# Đặc tả: Auth APIs

## API: `POST /auth/register`

### Mô tả
API đăng ký tài khoản audience mới bằng email, mật khẩu và họ tên. User mới được tạo ở trạng thái `PENDING` và cần xác thực email trước khi đăng nhập.

### Luồng chính
1. Client gửi email, password và full name.
2. Backend kiểm tra email đã tồn tại chưa.
3. Backend hash password bằng bcrypt.
4. Backend tạo user trạng thái `PENDING`.
5. Backend gán role mặc định `Audience`.
6. Backend tạo verification token và gửi email xác thực.
7. API trả thông tin đăng ký thành công.

### Kịch bản lỗi
- Email đã tồn tại: request bị từ chối.
- Email sai định dạng: `400 Bad Request`.
- Password không đạt yêu cầu tối thiểu: `400 Bad Request`.
- Gửi email xác thực thất bại: backend log lỗi hoặc trả lỗi tùy cấu hình.
- Database lỗi: API trả lỗi server.

### Ràng buộc
- Không lưu password plain text.
- User mới không được `ACTIVE` trước khi xác thực email.
- Role mặc định phải là role người mua vé, không phải admin/checker.
- Không trả password hash trong response.

### Tiêu chí chấp nhận
- Email mới tạo được user `PENDING`.
- Email trùng không tạo user mới.
- Password trong DB là hash.
- User mới có role `Audience`.
- Verification token được tạo để xác thực email.

## API: `GET /auth/verify`

### Mô tả
API xác thực email bằng token được gửi cho user sau khi đăng ký.

### Luồng chính
1. User mở link xác thực email.
2. Client/backend gửi token lên `GET /auth/verify`.
3. Backend kiểm tra token tồn tại, đúng user và còn hạn.
4. Backend chuyển user từ `PENDING` sang `ACTIVE`.
5. Token đã dùng không được dùng lại.

### Kịch bản lỗi
- Thiếu token: `400 Bad Request`.
- Token sai hoặc hết hạn: request bị từ chối.
- User không tồn tại: request bị từ chối.
- User đã active: có thể trả thành công idempotent hoặc thông báo đã xác thực.

### Ràng buộc
- Token xác thực phải có thời hạn.
- Token đã dùng không nên dùng lại.
- Chỉ user xác thực email mới được đăng nhập.

### Tiêu chí chấp nhận
- Token hợp lệ chuyển user sang `ACTIVE`.
- Token sai/hết hạn không active user.
- User active có thể đăng nhập.

## API: `POST /auth/resend-verification`

### Mô tả
API gửi lại email xác thực cho user chưa active.

### Luồng chính
1. Client gửi email.
2. Backend tìm user theo email.
3. Backend kiểm tra user chưa `ACTIVE`.
4. Backend tạo verification token mới.
5. Backend gửi lại email xác thực.

### Kịch bản lỗi
- Email không tồn tại: request bị từ chối hoặc trả thông báo chung để tránh lộ user.
- User đã active: không cần gửi lại verification.
- Gửi email lỗi: backend trả/log lỗi.

### Ràng buộc
- Không nên tiết lộ quá nhiều về việc email có tồn tại hay không.
- Token cũ nên hết hiệu lực hoặc không còn được ưu tiên.
- Có thể cần rate limit nếu endpoint bị spam.

### Tiêu chí chấp nhận
- User `PENDING` nhận được verification mới.
- User `ACTIVE` không cần resend.
- Token mới xác thực được email.

## API: `POST /auth/login`

### Mô tả
API đăng nhập bằng email/password. API trả access token, refresh token, thông tin user, roles và permissions nếu credential hợp lệ.

### Luồng chính
1. Client gửi email và password.
2. Request đi qua Token Bucket login rate limit.
3. Backend tìm user theo email.
4. Backend kiểm tra user `ACTIVE`.
5. Backend so sánh password bằng bcrypt.
6. Backend lấy roles và permissions của user.
7. Backend tạo access token và refresh token.
8. API trả token và profile.

### Kịch bản lỗi
- Email/password sai: `401 Unauthorized`.
- User chưa verify email: request bị từ chối.
- User bị inactive/banned: request bị từ chối.
- Spam login vượt ngưỡng: `429 Too Many Requests`.
- Redis rate limit lỗi: hệ thống ưu tiên cho request đi tiếp để tránh tê liệt login.

### Ràng buộc
- Password compare phải dùng bcrypt.
- Access token nên có TTL ngắn.
- Refresh token có TTL dài hơn nhưng phải có thể vô hiệu hóa.
- Login phải có rate limit để giảm brute-force.
- Không trả password hash.
- Trade-off: Token Bucket bảo vệ login tốt hơn fixed window ở burst nhỏ, nhưng cần cấu hình hợp lý để không chặn user thật.

### Tiêu chí chấp nhận
- User `ACTIVE` đăng nhập đúng nhận token.
- User chưa verify không đăng nhập được.
- Password sai trả `401`.
- Spam login trả `429`.
- Response có roles và permissions đúng.

## API: `GET /auth/me`

### Mô tả
API trả profile của user hiện tại dựa trên access token.

### Luồng chính
1. Client gửi request kèm access token.
2. `JwtAuthGuard` xác minh token.
3. Backend lấy user id từ token.
4. Backend trả thông tin profile, roles và permissions.

### Kịch bản lỗi
- Thiếu token: `401 Unauthorized`.
- Token sai/hết hạn: `401 Unauthorized`.
- User không tồn tại: request bị từ chối.

### Ràng buộc
- Không trả password hash hoặc thông tin nhạy cảm.
- Chỉ trả profile của user trong token.
- API phải hoạt động thống nhất cho web/mobile.

### Tiêu chí chấp nhận
- Token hợp lệ trả đúng profile.
- Token thiếu/sai trả `401`.
- Response không chứa password hash.

## API: `POST /auth/refresh`

### Mô tả
API cấp access token mới khi access token cũ hết hạn, dựa trên refresh token hợp lệ.

### Luồng chính
1. Client gửi refresh token.
2. Backend kiểm tra refresh token tồn tại, còn hạn và chưa bị vô hiệu hóa.
3. Backend xác định user tương ứng.
4. Backend phát hành access token mới.
5. API trả token mới cho client.

### Kịch bản lỗi
- Thiếu refresh token: `401 Unauthorized`.
- Refresh token sai/hết hạn: `401 Unauthorized`.
- Refresh token đã logout/reset password: `401 Unauthorized`.
- User không còn active: request bị từ chối.

### Ràng buộc
- Refresh token phải có thể bị revoke.
- Reset password/logout phải làm refresh token cũ mất hiệu lực.
- Không dùng refresh token để truy cập API nghiệp vụ trực tiếp.

### Tiêu chí chấp nhận
- Refresh token hợp lệ cấp access token mới.
- Refresh token cũ sau logout không dùng được.
- Refresh token cũ sau reset password không dùng được.

## API: `POST /auth/logout`

### Mô tả
API đăng xuất user bằng cách làm mất hiệu lực refresh token hiện tại.

### Luồng chính
1. Client gọi logout.
2. Backend xác định refresh token/session hiện tại.
3. Backend revoke refresh token.
4. Client xóa token local.
5. Các request refresh sau đó bằng token cũ bị từ chối.

### Kịch bản lỗi
- Thiếu/sai token: `401 Unauthorized`.
- Refresh token đã logout: có thể trả thành công idempotent hoặc từ chối.
- Database/session store lỗi: API trả lỗi server.

### Ràng buộc
- Logout phải làm refresh token cũ mất hiệu lực.
- Access token có thể vẫn sống đến khi hết TTL nếu không có blacklist.
- Client phải xóa token local sau logout.

### Tiêu chí chấp nhận
- Logout thành công.
- Refresh token cũ không refresh được nữa.
- Client quay lại trạng thái chưa đăng nhập.

## API: `POST /auth/change-password`

### Mô tả
API cho user đã đăng nhập đổi mật khẩu.

### Luồng chính
1. User gửi mật khẩu hiện tại và mật khẩu mới.
2. Backend xác minh access token.
3. Backend so sánh mật khẩu hiện tại bằng bcrypt.
4. Backend hash mật khẩu mới.
5. Backend cập nhật password hash.
6. Backend vô hiệu hóa refresh token cũ.

### Kịch bản lỗi
- Thiếu/sai access token: `401 Unauthorized`.
- Mật khẩu hiện tại sai: request bị từ chối.
- Mật khẩu mới không đạt yêu cầu: `400 Bad Request`.
- DB lỗi: API trả lỗi server.

### Ràng buộc
- Mật khẩu mới phải được hash.
- Không cho đổi mật khẩu nếu không biết mật khẩu hiện tại.
- Refresh token cũ nên mất hiệu lực sau đổi mật khẩu.

### Tiêu chí chấp nhận
- Đổi mật khẩu với mật khẩu hiện tại đúng thành công.
- Đăng nhập bằng mật khẩu mới thành công.
- Mật khẩu cũ không còn đăng nhập được.
- Refresh token cũ bị vô hiệu hóa.

## API: `POST /auth/forgot-password`

### Mô tả
API yêu cầu gửi link reset password cho email của user.

### Luồng chính
1. Client gửi email.
2. Backend tìm user theo email.
3. Backend tạo reset password token.
4. Backend gửi email reset password.
5. API trả thông báo đã xử lý.

### Kịch bản lỗi
- Email không tồn tại: nên trả thông báo chung để tránh lộ user.
- Gửi email lỗi: backend log/trả lỗi tùy cấu hình.
- User bị khóa: có thể từ chối reset.

### Ràng buộc
- Reset token phải có thời hạn.
- Không nên tiết lộ email có tồn tại hay không.
- Có thể cần rate limit để tránh spam email.

### Tiêu chí chấp nhận
- Email hợp lệ nhận reset token/link.
- Token được lưu với hạn dùng.
- API không lộ thông tin nhạy cảm.

## API: `POST /auth/reset-password`

### Mô tả
API đặt lại mật khẩu bằng reset token từ email.

### Luồng chính
1. User gửi reset token và mật khẩu mới.
2. Backend kiểm tra token tồn tại và còn hạn.
3. Backend hash mật khẩu mới.
4. Backend cập nhật password hash.
5. Backend vô hiệu hóa reset token.
6. Backend vô hiệu hóa refresh token cũ.

### Kịch bản lỗi
- Token sai/hết hạn: request bị từ chối.
- Mật khẩu mới không hợp lệ: `400 Bad Request`.
- User không tồn tại: request bị từ chối.
- Token đã dùng: request bị từ chối.

### Ràng buộc
- Reset token chỉ dùng một lần.
- Password mới phải hash bằng bcrypt.
- Refresh token cũ phải mất hiệu lực sau reset.
- Không tự động đăng nhập nếu hệ thống không chủ đích làm vậy.

### Tiêu chí chấp nhận
- Token hợp lệ reset password thành công.
- Đăng nhập bằng password mới thành công.
- Token reset không dùng lại được.
- Refresh token cũ không dùng được sau reset.

---

# Kiến trúc Phân quyền PBAC (Permission-Based Access Control) & Quản trị Nhân sự

## 1. Mô hình Phân cấp Thứ bậc: 5 Roles + 9 Permissions

Hệ thống TicketBox áp dụng mô hình phân quyền kép có thứ bậc (Hierarchical RBAC + PBAC):
- **5 Vai trò Hệ thống (System Roles):**
  1. **`SuperAdmin`**: Tổng Quản trị Hệ thống / Chủ sở hữu nền tảng. Nắm giữ toàn bộ 9 quyền và là vai trò duy nhất có quyền quản trị, cấp phát vai trò `Admin` / `SuperAdmin`.
  2. **`Admin`**: Quản trị viên Vận hành Nghiệp vụ. Quản lý sự kiện, xem doanh thu, quản lý khách hàng `Audience`, phân công `Checker`, tạo tài khoản `Organizer` và `Checker`. Bị chặn không được tạo hoặc can thiệp tài khoản `Admin` khác hay `SuperAdmin`.
  3. **`Organizer`**: Ban tổ chức sự kiện. Quản lý concert của mình, phân công checker, import danh sách khách VIP, xem doanh thu sự kiện.
  4. **`Checker`**: Nhân viên soát vé tại cổng. Chỉ hoạt động trên Mobile App, bị chặn khỏi Admin Portal.
  5. **`Audience`**: Khách hàng mua vé thông thường.

### Ma trận Quyền hạn (Permission Matrix)

| Permission Code | Ý nghĩa nghiệp vụ | SuperAdmin | Admin | Organizer | Checker | Audience |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| `MANAGE_ADMINS` | Cấp phát, chỉnh sửa, hạ quyền vai trò Admin/SuperAdmin | ✅ | ❌ | ❌ | ❌ | ❌ |
| `MANAGE_USERS` | Tạo/khóa nhân sự Organizer, Checker và Audience | ✅ | ✅ | ❌ | ❌ | ❌ |
| `CREATE_CONCERT` | Tạo sự kiện concert mới | ✅ | ✅ | ✅ | ❌ | ❌ |
| `UPDATE_CONCERT` | Chỉnh sửa thông tin concert, sơ đồ vé, AI bio | ✅ | ✅ | ✅ | ❌ | ❌ |
| `DELETE_CONCERT` | Xóa / ẩn concert | ✅ | ✅ | ❌ | ❌ | ❌ |
| `VIEW_REVENUE` | Xem báo cáo tài chính, doanh thu hệ thống / sự kiện | ✅ | ✅ | ✅ | ❌ | ❌ |
| `ASSIGN_CHECKER` | Phân công nhân viên soát vé vào từng cổng sự kiện | ✅ | ✅ | ✅ | ❌ | ❌ |
| `IMPORT_GUESTS` | Tải danh sách khách mời VIP bằng CSV vào hệ thống | ✅ | ✅ | ✅ | ❌ | ❌ |
| `SCAN_TICKET` | Quét mã QR, xác thực vé vào cổng trực tuyến & ngoại tuyến | ✅ | ❌ | ❌ | ✅ | ❌ |

---

## 2. Mô hình Bảo mật Máy chủ (Server-Shell Security Model)

Để đảm bảo an toàn tuyệt đối, hệ thống TicketBox tuân thủ chặt chẽ nguyên tắc **Phân định quyền lực hạ tầng**:

### Không có API tạo Super Admin:
- Không có bất kỳ API endpoint công khai hay nội bộ nào cho phép tự do đăng ký hoặc nâng cấp lên `SuperAdmin`.
- Khi Backend khởi động trên Production/Render, service `RolesPermissionsSyncService` **chỉ đồng bộ danh mục Roles và Permissions vào CSDL**, tuyệt đối **không tự động tạo bất kỳ tài khoản hay mật khẩu nào trong code**.

### Chỉ người nắm giữ Máy chủ / VM Shell mới có thể tạo Super Admin:
Tài khoản `SuperAdmin` đầu tiên chỉ được khởi tạo khi kỹ sư vận hành có quyền truy cập trực tiếp vào máy chủ / Shell container thông qua lệnh CLI:
```bash
# Khởi tạo tương tác hoặc sử dụng tham số mặc định:
pnpm cli:create-admin

# Khởi tạo với thông tin chỉ định:
pnpm cli:create-admin --email sếp@ticketbox.vn --password "MatKhauBaoMat123!" --name "Super Administrator"
```
Cơ chế của CLI:
1. Kết nối an toàn trực tiếp CSDL.
2. Kiểm tra/nạp 5 Roles và 9 Permissions.
3. Băm mật khẩu bằng `bcrypt` an toàn.
4. Tạo tài khoản ở trạng thái `ACTIVE` ngay lập tức và gán vai trò `SuperAdmin`.

---

## 3. Quy trình Cấp tài khoản Nhân sự Trực tiếp (Direct Staff Provisioning)

Sau khi Super Admin đầu tiên được tạo, mọi quy trình cấp phát nhân sự diễn ra trực tiếp trên **Admin Portal (`:3002`)**:

1. **Super Admin tạo Admin hoặc Organizer/Checker:**
   - Đăng nhập vào Admin Portal với vai trò `SuperAdmin`.
   - Vào `Quản lý Người dùng` ➔ `Tạo người dùng`.
   - Có thể chọn bất kỳ vai trò nào (`Admin`, `Organizer`, `Checker`).
2. **Admin thường tạo nhân sự nghiệp vụ:**
   - Các tài khoản có vai trò `Admin` đăng nhập vào Admin Portal.
   - Khi tạo hoặc sửa người dùng, giao diện **tự động ẩn các tùy chọn `SuperAdmin` và `Admin`** (chỉ cho phép tạo `Organizer`, `Checker`, `Audience`).
   - Nếu Admin thường cố tình gửi API request nâng quyền Admin ➔ Backend lập tức trả về `403 Forbidden: Only SuperAdmin can provision administrator roles`.
3. **Bảo vệ Bất khả xâm phạm (SuperAdmin Immunity):**
   - Tài khoản `SuperAdmin` được bảo vệ ở cả tầng Frontend và Backend: Admin thường không thể khóa (Banned/Inactive) hoặc thay đổi vai trò của bất kỳ tài khoản SuperAdmin nào.

---

## 4. Rào chắn Vai trò Soát vé (Checker Role Barrier)

Theo thiết kế hệ thống và yêu cầu an ninh:
- **Tài khoản Soát vé (`Checker`) CHỈ ĐƯỢC PHÉP hoạt động trên Mobile App (`:8081`)** với quyền quét vé `SCAN_TICKET`.
- **Tuyệt đối ngăn chặn Checker truy cập Admin Portal (`:3002`):**
  - **Tầng Giao diện & Đăng nhập (`apps/admin-app`):** Khi tài khoản chỉ có role `Checker` thực hiện đăng nhập, hệ thống sẽ từ chối và hiển thị thông báo: *"Truy cập bị từ chối: Tài khoản Soát vé (Checker) chỉ được sử dụng trên ứng dụng di động Mobile App."*
  - **Tầng Guard Route:** Trang `/access-denied` chuyên biệt giải thích rõ lý do tài khoản Checker không thuộc phạm vi quản trị trên web.
  - **Tầng Backend API Guards (`RolesGuard`):** Mọi API quản trị (`/admin/*`, `/checkin/assignments/*`) đều bắt buộc role `SuperAdmin`, `Admin` hoặc `Organizer` kèm permission tương ứng, trả về `403 Forbidden` nếu Checker cố tình gọi API.


