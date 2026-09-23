# 01 — KIẾN TRÚC & THIẾT KẾ HỆ THỐNG (ARCHITECTURE & DESIGN)

Thư mục này chứa các tài liệu thiết kế kỹ thuật cấp cao, kiến trúc dữ liệu và các cơ chế phòng thủ chịu tải của hệ thống TIXORA.

## 📑 Danh Sách Tài Liệu

| Tài liệu | Mô tả tóm tắt | Đối tượng quan tâm |
| :--- | :--- | :--- |
| **[SYSTEM_DESIGN.md](./SYSTEM_DESIGN.md)** | Thiết kế kiến trúc tổng thể Modular Monolith + Event-Driven, sơ đồ C4 Context & Container. | Architects, Lead Devs |
| **[TECHSTACK.md](./TECHSTACK.md)** | Chi tiết công nghệ sử dụng (NestJS, Next.js 16, Postgres, Redis, RabbitMQ) & lý do lựa chọn (ADR). | Toàn bộ team |
| **[DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)** | Thiết kế Cơ sở dữ liệu, sơ đồ ERD, quan hệ bảng và từ điển dữ liệu. | Backend Devs, DBA |
| **[HIGH_LOAD_DEFENSE.md](./HIGH_LOAD_DEFENSE.md)** | Cơ chế phòng thủ tải cao: Token Bucket Rate Limiting, Redis Lua Scripts, Circuit Breaker. | Backend Devs, DevOps |
