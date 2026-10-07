# Kiến Trúc Monorepo — pnpm Workspaces & Shared Contracts

## 1) Vì Sao Chọn pnpm Monorepo?
Trong các dự án phân tán có nhiều phân hệ (Audience Web, Admin Portal, Mobile Scanner, Backend API và MCP Server), việc chia thành nhiều git repository riêng lẻ thường dẫn đến các vấn đề nghiêm trọng:
- **Lệch pha Contract/API (Drifted Types):** Backend thay đổi trường dữ liệu nhưng Frontend không nhận được cảnh báo, chỉ phát hiện lỗi lúc runtime.
- **Lãng phí tài nguyên đĩa cứng:** Mỗi repository tải riêng hàng trăm MB thư mục `node_modules`.
- **Quy trình CI/CD rời rạc:** Rất khó để kiểm tra xem một thay đổi ở backend có làm gãy logic ở web hay mobile không.

### Giải Pháp Của Tixora
Tixora sử dụng **pnpm Workspaces** (`pnpm-workspace.yaml`):
```yaml
packages:
  - 'apps/*'
```
- **Content-Addressable Storage:** pnpm dùng hard links đến một kho lưu trữ chung trên máy, tiết kiệm hàng GB dung lượng ổ đĩa.
- **Unified TypeScript Config:** Sử dụng chung cấu hình TypeScript nghiêm ngặt (`tsconfig.json`), bắt lỗi Type ngay khi gõ code.

---

## 2) Cấu Trúc Các Package Trong Monorepo
```text
Tixora/
├── apps/
│   ├── backend-api/    # NestJS Core API (:3000)
│   ├── web-app/        # Next.js 16 Audience Portal (:3001)
│   ├── admin-app/      # Next.js 16 Admin Dashboard (:3002)
│   ├── mobile-app/     # Expo React Native Gate Scanner (:8081)
│   └── mcp-server/     # Model Context Protocol Server for AI Tools
├── infrastructure/     # Docker Compose (Postgres, Redis, RabbitMQ)
└── testing/            # Kịch bản kiểm thử tích hợp (Playwright & k6)
```

---

## 3) Quality Gate & Lệnh Kiểm Tra Tập Trung (`pnpm verify:push`)
Để đảm bảo bất kỳ đoạn mã nào commit lên nhánh chính đều đạt chuẩn chất lượng cao nhất, Tixora cài đặt script điều phối:
- `pnpm verify:push`: Chạy đồng thời linting, typechecking trên toàn bộ 4 phân hệ.
- Hỗ trợ chạy theo phạm vi:
  - `pnpm verify:push:be`: Chỉ kiểm tra backend-api.
  - `pnpm verify:push:fe`: Chỉ kiểm tra web-app.
  - `pnpm verify:push:admin`: Chỉ kiểm tra admin-app.
  - `pnpm verify:push:mobile`: Chỉ kiểm tra mobile-app.

---

## 4) Câu Hỏi Phỏng Vấn & Cách Trả Lời
1. *pnpm khác gì so với npm hay yarn?*
   - npm/yarn phẳng hóa (hoist) cây dependency dễ dẫn đến phantom dependencies. pnpm dùng cấu trúc symlink và hard link từ global store, cài đặt cực nhanh và bảo vệ tính cô lập của gói.
2. *Làm sao để deploy riêng từng app khi dùng Monorepo?*
   - Vercel hỗ trợ chỉ định `Root Directory` (ví dụ: `apps/web-app` hoặc `apps/admin-app`) cùng lệnh build tương ứng. Backend có thể build Docker image độc lập từ thư mục `apps/backend-api`.
