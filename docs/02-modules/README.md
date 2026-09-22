# 02 — ĐẶC TẢ CHI TIẾT CÁC MODULE (MODULE SPECIFICATIONS)

Thư mục này chứa đặc tả nghiệp vụ, API DTOs, luồng xử lý và dữ liệu của từng module độc lập trong Monolith TicketBox.

## 📑 Danh Sách Tài Liệu

| Module / Tài liệu | Trách nhiệm chính |
| :--- | :--- |
| **[auth-rbac.md](./auth-rbac.md)** | Đăng ký, đăng nhập, JWT stateless, quản lý Role (Admin, Organizer, Checker, Audience) & Permissions. |
| **[catalog-events.md](./catalog-events.md)** | Quản lý thông tin concert, hạng vé, sơ đồ ghế, tối ưu đọc với Redis Cache-aside. |
| **[ticketing-reservation.md](./ticketing-reservation.md)** | Giữ chỗ vé nguyên tử bằng Redis Lua Script, chống overbooking, hủy đơn tự động khi hết hạn. |
| **[payment-transactions.md](./payment-transactions.md)** | Tích hợp PayOS, chống trừ tiền hai lần bằng Idempotency Key, xử lý Webhook an toàn. |
| **[checkin-offline.md](./checkin-offline.md)** | Soát vé di động, phân luồng Gate Segregation, giải quyết Split-Brain khi mất mạng, Bulk-sync khi online. |
| **[background-jobs-ai.md](./background-jobs-ai.md)** | Tác vụ nền xử lý file CSV khách mời hàng chục nghìn dòng, trích xuất tiểu sử nghệ sĩ bằng AI (LLM). |
| **[notifications.md](./notifications.md)** | Quản lý thông báo người dùng, deduplication key chống gửi trùng, nhắc lịch concert. |
