# Interview Prep — Tixora (High-Concurrency Ticketing Platform)

> Mục tiêu của bộ tài liệu này: Giúp bạn **trả lời xuất sắc, tự tin và mạch lạc** trong buổi phỏng vấn vị trí Software Engineer (Intern / Junior / Fresher). Bộ tài liệu đi sâu vào tư duy giải quyết **2 bài toán kỹ thuật sống còn** (Flash-Sale Zero-Oversell & Offline-First Gate Check-in) và kỹ năng **AI / Vibe Coding** xuyên suốt SDLC.

---

## ⚡ Cách Dùng Nhanh (30–60 Phút Trước Giờ Phỏng Vấn)

1. **Đọc [00-overview.md](tixora/00-overview.md)**: Nắm chắc câu chuyện hệ thống end-to-end trong 2–3 phút, chuẩn bị sẵn bản Elevator Pitch 60 giây.
2. **Đọc [qa/ai-vibe-coding-questions.md](qa/ai-vibe-coding-questions.md)**: "Đóng khung" cách bạn dùng AI tăng tốc toàn bộ vòng đời phát triển phần mềm (SDLC) nhưng vẫn làm chủ hoàn toàn code, kiến trúc và độ an toàn.
3. **Chọn 3 mảng kỹ thuật cốt lõi nhất để làm "vũ khí ăn điểm"**:
   - 🚀 **Redis Lua Atomic Engine**: [tixora/03-redis-lua-engine.md](tixora/03-redis-lua-engine.md) (Chống bán lố vé Zero-Oversell nano-giây trên RAM).
   - 📱 **Offline-First Mobile Gate Check-in**: [tixora/06-offline-first-mobile.md](tixora/06-offline-first-mobile.md) (Soát vé < 100ms tại sân vận động khi mất hoàn toàn Internet).
   - 🐰 **RabbitMQ Event-Driven Broker**: [tixora/04-rabbitmq-event-driven.md](tixora/04-rabbitmq-event-driven.md) (San phẳng đỉnh tải ghi CSDL).
4. **Mở sẵn các tab kiểm thử**:
   - **Tab 1 (Audience Web)**: [https://tixora.tvquang.id.vn](https://tixora.tvquang.id.vn) (`audience@tixora.local` / `12345678`)
   - **Tab 2 (Admin Portal)**: [https://tixora-admin.tvquang.id.vn](https://tixora-admin.tvquang.id.vn) (`admin@tixora.local` / `12345678`)
   - **Tab 3 (Mobile Scanner)**: Khởi chạy local bằng `cd apps/mobile-app && pnpm start` trên điện thoại hoặc giả lập.

---

## 🧭 Cấu Trúc Bộ Tài Liệu Phỏng Vấn

### 1. Hồ Sơ Ứng Viên & Kinh Nghiệm
- **CV Bản Chuẩn Đồng Bộ**: [cv.txt](cv.txt) (Bổ sung dự án Tixora với các từ khóa công nghệ NestJS, Next.js 16, Expo, Redis Lua, RabbitMQ, k6).

### 2. Bộ Câu Hỏi Q&A Theo JD Tuyển Dụng
- **AI across SDLC & Vibe Coding Thực Chiến**: [qa/ai-vibe-coding-questions.md](qa/ai-vibe-coding-questions.md)
- **Kiến Thức Nền Tảng Web, Concurrency & Hệ Thống Phân Tán**: [qa/general-intern-questions.md](qa/general-intern-questions.md)

### 3. Tixora Deep-Dive Kỹ Thuật (12 Chuyên Đề Cốt Lõi)
- **Tổng quan kiến trúc & Luồng nghiệp vụ**: [tixora/00-overview.md](tixora/00-overview.md)
- **Monorepo Architecture (pnpm & Shared Contracts)**: [tixora/01-monorepo-pnpm.md](tixora/01-monorepo-pnpm.md)
- **NestJS Modular Backend (Architecture, Guards, DTOs)**: [tixora/02-backend-nestjs.md](tixora/02-backend-nestjs.md)
- **Redis Lua Scripting (RAM Atomic Hold & Zero-Oversell)**: [tixora/03-redis-lua-engine.md](tixora/03-redis-lua-engine.md)
- **RabbitMQ Message Broker (Traffic Leveling & DLQ)**: [tixora/04-rabbitmq-event-driven.md](tixora/04-rabbitmq-event-driven.md)
- **PostgreSQL & Prisma (Data Model, Indexing & Escrow)**: [tixora/05-db-prisma-postgres.md](tixora/05-db-prisma-postgres.md)
- **Offline-First Gate Scanner (Expo, Hash Prefetch, Bulk Sync)**: [tixora/06-offline-first-mobile.md](tixora/06-offline-first-mobile.md)
- **Stateless JWT & 5-Level RBAC Security**: [tixora/07-auth-stateless-jwt-rbac.md](tixora/07-auth-stateless-jwt-rbac.md)
- **Next.js 16 App Router & Tailwind CSS v4 Frontend**: [tixora/08-frontend-nextjs16.md](tixora/08-frontend-nextjs16.md)
- **VietQR PayOS Payment & Idempotency Key (Redis SETNX)**: [tixora/09-payment-payos-idempotency.md](tixora/09-payment-payos-idempotency.md)
- **Token Bucket Rate Limiting (DDoS & Bot Spam Defense)**: [tixora/10-rate-limiting-token-bucket.md](tixora/10-rate-limiting-token-bucket.md)
- **Testing & Benchmark (Playwright E2E & k6 Stress Test)**: [tixora/11-testing-playwright-k6.md](tixora/11-testing-playwright-k6.md)
- **Docker Compose & Deployment Infrastructure**: [tixora/12-docker-infrastructure.md](tixora/12-docker-infrastructure.md)
