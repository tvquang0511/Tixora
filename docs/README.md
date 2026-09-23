# 📚 HỆ THỐNG TÀI LIỆU DỰ ÁN TIXORA (DOCUMENTATION PORTAL)

> **Chào mừng bạn đến với trung tâm tài liệu chính thức của Tixora!**  
> Toàn bộ tài liệu được chuẩn hóa theo phân tầng nghiệp vụ, giúp đội ngũ kỹ thuật, kiểm thử và quản trị dễ dàng tra cứu, vận hành và phát triển tính năng mới.

---

## 🗺️ Sơ Đồ Cấu Trúc Tài Liệu (Documentation Map)

```mermaid
graph TD
    Root["📂 docs/ (Documentation Portal)"]
    Root --> Arch["🏛️ 01-architecture<br/>Kiến trúc & Hạ tầng"]
    Root --> Mod["📦 02-modules<br/>Đặc tả từng Module"]
    Root --> Test["🧪 03-testing<br/>Kiểm thử & QA"]
    Root --> Plan["🚀 04-planning-roadmap<br/>Lộ trình & Nâng cấp"]
    Root --> Flow["👥 05-workflow<br/>Quy trình & Onboarding"]
    Root --> Tpl["📋 06-templates<br/>Biểu mẫu chuẩn"]

    Arch --> Arch1["SYSTEM_DESIGN.md"]
    Arch --> Arch2["TECHSTACK.md"]
    Arch --> Arch3["DATABASE_SCHEMA.md"]
    Arch --> Arch4["HIGH_LOAD_DEFENSE.md"]

    Mod --> Mod1["AUTH_RBAC.md"]
    Mod --> Mod2["CATALOG_EVENTS.md"]
    Mod --> Mod3["TICKETING_RESERVATION.md"]
    Mod --> Mod4["PAYMENT_TRANSACTIONS.md"]
    Mod --> Mod5["CHECKIN_OFFLINE.md"]
    Mod --> Mod6["BACKGROUND_JOBS_AI.md"]
    Mod --> Mod7["NOTIFICATIONS.md"]

    Test --> Test1["MANUAL_TEST_GUIDE.md"]
    Test --> Test2["PLAYWRIGHT_E2E.md"]
    Test --> Test3["LOAD_TESTING_K6.md"]

    Plan --> Plan1["UPGRADE_PROPOSALS.md"]
    Plan --> Plan2["PROJECT_PLAN.md"]
    Plan --> Plan3["TASK_BREAKDOWN.md"]

    Flow --> Flow1["ONBOARDING.md"]
    Flow --> Flow2["TEAM_WORKFLOW.md"]
    Flow --> Flow3["CONTRIBUTING.md"]

    Tpl --> Tpl1["PR_TEMPLATE.md"]
    Tpl --> Tpl2["BUG_REPORT_TEMPLATE.md"]
    Tpl --> Tpl3["TASK_TEMPLATE.md"]
```

---

## 🧭 Bảng Tra Cứu Nhanh Theo Vai Trò (Quick Navigation by Role)

| Bạn là ai? | Tài liệu bạn cần đọc đầu tiên |
| :--- | :--- |
| 🆕 **Lập trình viên mới vào dự án** | [Onboarding Guide](./05-workflow/ONBOARDING.md) ➔ [System Design](./01-architecture/SYSTEM_DESIGN.md) ➔ [Team Workflow](./05-workflow/TEAM_WORKFLOW.md) |
| 🧪 **Kiểm thử viên / QA Engineer** | [Manual Test Guide](./03-testing/MANUAL_TEST_GUIDE.md) ➔ [Playwright E2E Testing](./03-testing/PLAYWRIGHT_E2E.md) ➔ [Load Test k6](./03-testing/LOAD_TESTING_K6.md) |
| 💻 **Backend Developer** | [Database Schema](./01-architecture/DATABASE_SCHEMA.md) ➔ [Ticketing Reservation](./02-modules/TICKETING_RESERVATION.md) ➔ [High Load Defense](./01-architecture/HIGH_LOAD_DEFENSE.md) |
| 🎨 **Frontend / Mobile Developer** | [Catalog Events](./02-modules/CATALOG_EVENTS.md) ➔ [Payment Transactions](./02-modules/PAYMENT_TRANSACTIONS.md) ➔ [Checkin Offline](./02-modules/CHECKIN_OFFLINE.md) |
| 🚀 **Tech Lead / Architect** | [Upgrade Proposals](./04-planning-roadmap/UPGRADE_PROPOSALS.md) ➔ [Project Plan](./04-planning-roadmap/PROJECT_PLAN.md) ➔ [System Design](./01-architecture/SYSTEM_DESIGN.md) |

---

## 📂 Chi Tiết Từng Phân Hệ Tài Liệu

### 1. [01-architecture/](./01-architecture/README.md) — Kiến Trúc & Thiết Kế Hệ Thống
Chứa các bản vẽ kiến trúc, thiết kế dữ liệu và giải pháp chịu tải cao:
- **[SYSTEM_DESIGN.md](./01-architecture/SYSTEM_DESIGN.md):** Kiến trúc Modular Monolith + Event-Driven, sơ đồ C4 System Context & Container, luồng điều phối dữ liệu qua RabbitMQ.
- **[TECHSTACK.md](./01-architecture/TECHSTACK.md):** Đánh giá công nghệ (NestJS, Next.js 16, PostgreSQL, Redis, RabbitMQ) và các quyết định kỹ thuật then chốt (ADR).
- **[DATABASE_SCHEMA.md](./01-architecture/DATABASE_SCHEMA.md):** Bản thiết kế CSDL hoàn chỉnh, sơ đồ ERD, các bảng, khóa ngoại và chỉ mục (Indexes).
- **[HIGH_LOAD_DEFENSE.md](./01-architecture/HIGH_LOAD_DEFENSE.md):** Cơ chế bảo vệ hệ thống trước đợt bùng nổ 80.000 users (Token Bucket Rate Limiting, Redis Lua script nguyên tử, Opossum Circuit Breaker).

### 2. [02-modules/](./02-modules/README.md) — Đặc Tả Nghiệp Vụ Các Module
Đặc tả chi tiết đầu vào/đầu ra, API contracts, DTOs và luồng xử lý nội bộ:
- **[AUTH_RBAC.md](./02-modules/AUTH_RBAC.md):** Quản lý định danh, Stateless JWT, phân quyền Role-Based Access Control (Admin, Organizer, Checker, Audience).
- **[CATALOG_EVENTS.md](./02-modules/CATALOG_EVENTS.md):** Quản lý concert, hạng vé, sơ đồ ghế, tối ưu tốc độ đọc bằng Redis Cache-aside.
- **[TICKETING_RESERVATION.md](./02-modules/TICKETING_RESERVATION.md):** Luồng giữ vé RAM nguyên tử, chống bán quá số lượng (Zero Oversell), giới hạn per-user và cơ chế hủy đơn quá hạn.
- **[PAYMENT_TRANSACTIONS.md](./02-modules/PAYMENT_TRANSACTIONS.md):** Tích hợp PayOS, chữ ký Webhook bảo mật, khóa lũy đẳng (Idempotency Key) chống trừ tiền hai lần.
- **[CHECKIN_OFFLINE.md](./02-modules/CHECKIN_OFFLINE.md):** Giải pháp soát vé di động khi mất kết nối Internet, phân luồng Gate Segregation tránh xung đột và bulk-sync khi có mạng.
- **[BACKGROUND_JOBS_AI.md](./02-modules/BACKGROUND_JOBS_AI.md):** Tác vụ nền chia nhỏ (chunking) nạp danh sách khách mời CSV và trích xuất tiểu sử nghệ sĩ bằng AI (LLM).
- **[NOTIFICATIONS.md](./02-modules/NOTIFICATIONS.md):** Hệ thống gửi thông báo và cơ chế chống gửi trùng bằng Deduplication Key.

### 3. [03-testing/](./03-testing/README.md) — Kiểm Thử & Đảm Bảo Chất Lượng
Hướng dẫn kiểm thử đầy đủ các cấp độ từ thủ công đến tự động:
- **[MANUAL_TEST_GUIDE.md](./03-testing/MANUAL_TEST_GUIDE.md):** Bộ kịch bản kiểm thử thủ công 11 Test Suites (> 35 test cases) bao phủ mọi tính năng của Web, Admin và Mobile kèm bảng tài khoản seed và checklist nghiệm thu.
- **[PLAYWRIGHT_E2E.md](./03-testing/PLAYWRIGHT_E2E.md):** Hướng dẫn cài đặt, cấu hình và chạy bộ test E2E Playwright tự động trên Web App (`:3001`) và Admin Portal (`:3002`).
- **[LOAD_TESTING_K6.md](./03-testing/LOAD_TESTING_K6.md):** Hướng dẫn chạy k6 script kiểm chứng Rate Limiting (HTTP 429) và chống Oversell dưới tải cao đồng thời.

### 4. [04-planning-roadmap/](./04-planning-roadmap/README.md) — Kế Hoạch & Đề Xuất Nâng Cấp
Định hướng phát triển và kế hoạch thực thi:
- **[UPGRADE_PROPOSALS.md](./04-planning-roadmap/UPGRADE_PROPOSALS.md):** 9 đề xuất nâng cấp kiến trúc đột phá: RabbitMQ DLX giải phóng vé chính xác, Realtime SSE, Bản đồ ghế tương tác trực quan (Interactive Seatmap), Chữ ký số ECDSA cho QR Code, Phòng chờ ảo (Virtual Waiting Room), Đa cổng thanh toán và Observability.
- **[PROJECT_PLAN.md](./04-planning-roadmap/PROJECT_PLAN.md):** Kế hoạch chi tiết 3 Sprint thực chiến (Sprint 1: Nền móng, Sprint 2: Tải cao & Đặt vé, Sprint 3: Ngoại tuyến & Hoàn thiện).
- **[TASK_BREAKDOWN.md](./04-planning-roadmap/TASK_BREAKDOWN.md):** Phân rã công việc từng Issue, Checklist và Tiêu chí nghiệm thu (Acceptance Criteria).

### 5. [05-workflow/](./05-workflow/README.md) — Quy Trình Làm Việc Nhóm
Tiêu chuẩn vận hành và phối hợp nội bộ:
- **[ONBOARDING.md](./05-workflow/ONBOARDING.md):** Hướng dẫn từng bước thiết lập môi trường máy tính cho thành viên mới (Node.js, pnpm, Docker, .env, DB seed).
- **[TEAM_WORKFLOW.md](./05-workflow/TEAM_WORKFLOW.md):** Chiến lược Git Branching, quy ước đặt tên nhánh, Conventional Commits và quy trình Code Review.
- **[CONTRIBUTING.md](./05-workflow/CONTRIBUTING.md):** Tiêu chuẩn mã nguồn (TypeScript Strict, Prettier, ESLint) và Quality Gates trước khi đẩy code.

### 6. [06-templates/](./06-templates/README.md) — Biểu Mẫu Chuẩn
Biểu mẫu dùng cho công việc hàng ngày:
- **[PR_TEMPLATE.md](./06-templates/PR_TEMPLATE.md):** Biểu mẫu tạo Pull Request.
- **[BUG_REPORT_TEMPLATE.md](./06-templates/BUG_REPORT_TEMPLATE.md):** Biểu mẫu báo cáo lỗi phần mềm.
- **[TASK_TEMPLATE.md](./06-templates/TASK_TEMPLATE.md):** Biểu mẫu khởi tạo Task/Feature mới.

---

## ⚡ Các Lệnh Nhanh Cho Dự Án (Quick Commands)

```powershell
# 1. Khởi động hạ tầng Docker (Redis & RabbitMQ)
cd infrastructure; docker compose up -d; cd ..

# 2. Cài đặt package & seed CSDL
pnpm install
pnpm db:seed

# 3. Khởi động 3 ứng dụng đồng thời
pnpm start:api:dev   # Backend API (Port 3000)
pnpm start:web       # Web Khách Hàng (Port 3001)
pnpm start:admin     # Admin Portal (Port 3002)

# 4. Chạy kiểm thử tự động Playwright E2E
pnpm test:e2e        # Chạy kiểm thử ngầm
pnpm test:e2e:ui     # Chạy với giao diện trực quan Playwright UI
```

---
*Tài liệu được bảo trì và cập nhật liên tục cùng sự phát triển của hệ thống TIXORA.*
