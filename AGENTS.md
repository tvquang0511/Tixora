# AGENTS.md - TicketBox Architecture & Agent Guidelines

Tài liệu này là kim chỉ nam bắt buộc cho AI Agent (Antigravity) khi làm việc trên kho mã nguồn TicketBox.

---

## 1. Tech Stack & Hạ Tầng Cổng (Ports)
- **Package Manager**: Bắt buộc dùng `pnpm` (Monorepo Workspaces). TUYỆT ĐỐI KHÔNG dùng `npm` hoặc `yarn`.
- **Phân bổ Cổng**:
  - Backend API: `http://localhost:3000` (NestJS + Prisma + PostgreSQL)
  - Web Khách Hàng: `http://localhost:3001` (Next.js 16 App Router + Tailwind CSS)
  - Admin Portal: `http://localhost:3002` (Next.js 16 App Router + Tailwind CSS)
  - Mobile Scanner: Expo React Native (Port `8081`)
  - Redis: Port `6379`, RabbitMQ: Port `5672`

---

## 2. Quy tắc Bất biến về Phân quyền (Auth & RBAC Invariants)
- **Hệ thống phân 5 Cấp vai trò (Roles)**:
  1. `SuperAdmin`: Toàn bộ 9 quyền (bao gồm quyền độc quyền `MANAGE_ADMINS`). Bất khả xâm phạm (Immune), không thể bị sửa/xóa bởi Admin khác.
  2. `Admin`: Vận hành nghiệp vụ (quản lý concert, doanh thu, tạo tài khoản cấp dưới). BỊ CHẶN không được cấp quyền `Admin`/`SuperAdmin` (403 Forbidden).
  3. `Organizer`: Ban tổ chức sự kiện (quản lý concert của mình, doanh thu riêng).
  4. `Checker`: Nhân viên soát vé tại cổng.
  5. `Audience`: Khán giả mua vé.
- **Server-Shell Security Model**:
  - TUYỆT ĐỐI KHÔNG CÓ API TẠO SUPER ADMIN.
  - `SuperAdmin` chỉ được khởi tạo qua Shell/máy chủ bằng lệnh: `pnpm cli:create-admin`.
- **Rào cản Checker**:
  - `Checker` BỊ CHẶN HOÀN TOÀN khỏi Admin Portal (`:3002`). Chỉ được dùng Mobile App (`SCAN_TICKET`).

---

## 3. Quy tắc Kỹ thuật Trọng yếu (Critical Engineering Invariants)
- **Chống bán lố vé (Anti-Oversell)**:
  - Mọi thao tác giữ vé (Hold ticket) BẮT BUỘC thực thi qua **Redis Lua Script nguyên tử**. Tuyệt đối không query DB trực tiếp để trừ tồn kho.
- **Bootstrapping vs Seeding**:
  - `RolesPermissionsSyncService` (Bootstrap): Tự động chạy khi server start, CHỈ đồng bộ metadata 5 Roles & 9 Permissions, KHÔNG BAO GIỜ sinh tài khoản ngẫu nhiên hay đụng tới bảng User.
  - `pnpm db:seed`: Chỉ dùng cho môi trường local test data, chứa lệnh destructive `TRUNCATE CASCADE`.
- **Next.js Admin Proxy**:
  - Frontend gọi backend qua proxy `/api/proxy/*` (được cấu hình qua `REMOTE_API_URL` hoặc `NEXT_PUBLIC_API_URL`).

---

## 4. Kiểm định Chất lượng trước khi Commit
- Luôn đảm bảo lệnh sau vượt qua trước khi commit:
  ```bash
  pnpm verify:push
  ```
- Unit test Backend:
  ```bash
  pnpm test:api:unit
  ```
- Quy chuẩn tài liệu: Mọi file tài liệu trong `docs/` phải đặt tên viết hoa: `UPPER_CASE.md`.
