# 02 — ĐẶC TẢ CHI TIẾT CÁC MODULE (MODULE SPECIFICATIONS)

Thư mục này chứa đặc tả nghiệp vụ, API DTOs, luồng xử lý và dữ liệu của từng module độc lập trong Monolith TIXORA.

## 📑 Danh Sách Tài Liệu

| Module / Tài liệu | Trách nhiệm chính |
| :--- | :--- |
| **[AUTH_RBAC.md](./AUTH_RBAC.md)** | Đăng ký, đăng nhập, JWT stateless, quản lý Role (Admin, Organizer, Checker, Audience) & Permissions. |
| **[CATALOG_EVENTS.md](./CATALOG_EVENTS.md)** | Quản lý thông tin concert, hạng vé, sơ đồ ghế, tối ưu đọc với Redis Cache-aside. |
| **[TICKETING_RESERVATION.md](./TICKETING_RESERVATION.md)** | Giữ chỗ vé nguyên tử bằng Redis Lua Script, chống overbooking, hủy đơn tự động khi hết hạn. |
| **[PAYMENT_TRANSACTIONS.md](./PAYMENT_TRANSACTIONS.md)** | Tích hợp PayOS, chống trừ tiền hai lần bằng Idempotency Key, xử lý Webhook an toàn. |
| **[CHECKIN_OFFLINE.md](./CHECKIN_OFFLINE.md)** | Soát vé di động, phân luồng Gate Segregation, giải quyết Split-Brain khi mất mạng, Bulk-sync khi online. |
| **[BACKGROUND_JOBS_AI.md](./BACKGROUND_JOBS_AI.md)** | Tác vụ nền xử lý file CSV khách mời hàng chục nghìn dòng, trích xuất tiểu sử nghệ sĩ bằng AI (LLM). |
| **[NOTIFICATIONS.md](./NOTIFICATIONS.md)** | Quản lý thông báo người dùng, deduplication key chống gửi trùng, nhắc lịch concert. |
