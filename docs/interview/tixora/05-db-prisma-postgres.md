# Cơ Sở Dữ Liệu — PostgreSQL & Prisma ORM Optimization

## 1) Thiết Kế Mô Hình Thực Thể Quan Hệ (ERD & Relations)
Cơ sở dữ liệu của Tixora được chuẩn hóa theo dạng 3NF với các bảng chính:
- `User`: Lưu thông tin tài khoản, mật khẩu băm bcrypt và vai trò `role` (SUPERADMIN, ADMIN, ORGANIZER, AUDIENCE, CHECKER).
- `Event`: Thông tin concert, địa điểm (venue), thời gian bắt đầu/kết thúc, trạng thái duyệt (`DRAFT`, `PUBLISHED`, `PAUSED`, `ENDED`, `CANCELLED`).
- `TicketTier`: Các phân hạng vé (VIP, GA, Early Bird), giá tiền, tổng số lượng ghế phát hành, số lượng tối đa mỗi tài khoản được mua (`max_per_user`).
- `Order`: Đơn hàng, tổng tiền, phương thức thanh toán, mã định danh lũy đẳng (`idempotency_key`), trạng thái (`PENDING`, `PAID`, `EXPIRED`, `REFUNDED`).
- `Ticket`: Từng vé cụ thể được xuất sau khi thanh toán thành công, chứa mã định danh duy nhất, chuỗi băm bảo mật (`qr_code_hash`), cổng vào được phân bổ (`gate_id`) và cờ trạng thái `is_checked_in`.
- `Gate` & `CheckinLog`: Danh sách cổng sân vận động và lịch sử quét vé phục vụ đối soát và hậu kiểm.

---

## 2) Chiến Lược Tối Ưu Chỉ Mục (Database Indexing Strategy)
Để đảm bảo truy vấn đọc/lọc cực nhanh khi có hàng triệu bản ghi:
- **Index B-Tree đơn cột:**
  - `idx_events_status` trên `Event(status)`: Lọc nhanh các sự kiện đang mở bán ở trang chủ.
  - `idx_tickets_qr_hash` trên `Ticket(qr_code_hash)`: Tìm kiếm vé trong nano-giây khi máy quét đối chiếu.
  - `idx_orders_user_id` trên `Order(user_id)`: Tải danh sách vé của khán giả.
- **Composite Index (Chỉ mục kết hợp):**
  - `idx_tickets_tier_status` trên `Ticket(tier_id, is_checked_in)`: Thống kê tỷ lệ khách đã vào sân theo từng hạng vé trong Dashboard của Admin.
  - `idx_events_organizer_status` trên `Event(organizer_id, status)`: Phục vụ Portal dành riêng cho Ban tổ chức.

---

## 3) Quản Lý Dòng Tiền Ký Quỹ (Escrow & Financial Settlement)
Mô hình bán vé yêu cầu quản lý tài chính chuẩn mực như Ticketbox:
- Tiền bán vé từ khán giả không chuyển ngay cho Ban tổ chức mà được giữ trong **Tài khoản Ký Quỹ (Escrow Account)** của sàn.
- Sau khi sự kiện kết thúc thành công và không có khiếu nại hủy show, hệ thống đối soát tự động trừ phí hoa hồng sàn (Platform Fee, ví dụ 5%) và giải ngân phần doanh thu ròng (Net Payout) cho Organizer.

---

## 4) Câu Hỏi Phỏng Vấn & Cách Trả Lời
1. *Tại sao dùng Prisma ORM mà không dùng Raw SQL hoặc TypeORM?*
   - Prisma cung cấp khả năng Type-Safe tuyệt đối (Auto-generated Types từ Schema), giúp phát hiện lỗi lệch kiểu dữ liệu ngay từ bước compile code. Ngoài ra Prisma Migration giúp quản lý phiên bản CSDL nhất quán giữa môi trường local và staging.
2. *Khi truy vấn dữ liệu lớn thì làm sao tránh lỗi N+1 trong Prisma?*
   - Sử dụng cú pháp `include` hoặc `select` để Prisma tự động gộp truy vấn bằng câu lệnh `JOIN` hoặc `IN (...)` thay vì lặp qua từng bản ghi để query bảng con.
