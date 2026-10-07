# Q&A: Ứng Dụng AI & Vibe Coding Xuyên Suốt SDLC Trong Tixora

> Tài liệu này chuẩn bị cho câu hỏi phỏng vấn theo xu hướng mới nhất: **Nhà tuyển dụng đánh giá cao khả năng sử dụng AI để tăng tốc phát triển (Vibe Coding)**, nhưng yêu cầu ứng viên phải **làm chủ hoàn toàn hệ thống, hiểu sâu từng dòng code, kiểm soát kiến trúc và loại trừ rủi ro bảo mật**.

---

## 1) "Bạn đã ứng dụng AI như thế nào trong suốt vòng đời phát triển (SDLC) của Tixora?"

### 💡 Trả lời mẫu (60 giây):
> *"Em không dùng AI để 'nhờ viết hộ một trang web hoàn chỉnh rồi copy-paste'. Thay vào đó, em xem AI như một **Senior Pair-Programmer** và cộng sự kỹ thuật xuyên suốt 6 giai đoạn của SDLC:
> 
> 1. **Giai đoạn Thiết kế & Kiến trúc (Architecture & System Design):** Em dùng AI để brainstorm các phương án giải quyết bài toán Flash-sale (so sánh Database Lock `SELECT FOR UPDATE` vs Redis Lua Script vs Distributed Lock Redlock). AI giúp liệt kê nhanh các trade-offs về CPU, Connection Pool và Latency.
> 2. **Giai đoạn Thiết kế Dữ liệu & DTO:** Em mô tả nghiệp vụ bán vé, yêu cầu AI đề xuất schema Prisma quan hệ, sau đó em tinh chỉnh lại các Composite Index và kiểm tra tính toàn vẹn khóa ngoại.
> 3. **Giai đoạn Sinh Dữ liệu Giả lập (Seed Data at Scale):** Em dùng AI viết script sinh 80.000 vé mẫu chia thành các cụm Cổng (Gate A, B, C) và hàng chục ngàn mã băm QR HMAC chuẩn thực tế.
> 4. **Giai đoạn Lập trình Lõi (Core Implementation):** Em giao cho AI viết khung sườn (skeleton) của Redis Lua Script và NestJS Guards, sau đó em trực tiếp rà soát từng điều kiện rẽ nhánh (if/else), đảm bảo tính nguyên tử (atomic) và xử lý lỗi fail-open/fail-closed.
> 5. **Giai đoạn Kiểm thử Chịu Tải (Stress Testing & k6):** AI hỗ trợ sinh kịch bản test k6 mô phỏng 1.000 virtual users tranh chấp đồng thời 50 vé để chứng minh Zero-Oversell.
> 6. **Giai đoạn Tích hợp AI Tiên tiến (MCP Server):** Em xây dựng một package `mcp-server` trong Monorepo giúp các mô hình ngôn ngữ lớn (LLM) có thể truy vấn số liệu doanh thu và vé trực tiếp qua Model Context Protocol."*

---

## 2) "Nếu AI viết code rất nhanh và tốt, thì vai trò thực sự của bạn là gì?"

### 💡 Trả lời mẫu:
> *"AI là công cụ khuếch đại năng suất, nhưng **quyết định kỹ thuật (engineering judgment), trách nhiệm và tính đúng đắn (correctness) 100% thuộc về em**. Có 5 việc quan trọng chỉ con người mới kiểm soát được:
> 
> 1. **Định hình bài toán & Đặt ra biên giới (Scope & Constraints):** Xác định rõ ràng hệ thống cần gì (ví dụ: cần Zero-Oversell nano-giây, cần offline check-in < 100ms). AI không thể tự hiểu ngữ cảnh thực tế của sân vận động mất mạng nếu em không đặt ra bài toán.
> 2. **Kiểm tra Race Condition & Edge Cases:** AI thường sinh code trông rất đẹp nhưng hay mắc lỗi bất đồng bộ. Chính em là người phát hiện và chuyển thao tác kiểm tra tồn kho từ nhiều lệnh Redis riêng lẻ sang **1 file Lua script duy nhất** để đảm bảo tính nguyên tử.
> 3. **Bảo mật & Tính lũy đẳng (Security & Idempotency):** Đảm bảo webhook thanh toán phải được bọc trong Redis SETNX 24h và kiểm tra chữ ký HMAC SHA256, không bao giờ tin tưởng dữ liệu client gửi lên.
> 4. **Tối ưu hóa Database & Query Indexing:** Rà soát query xem có bị N+1 không, đánh chỉ mục B-Tree đúng trên các cột `event_id`, `tier_id` và `status`.
> 5. **Chạy thực tế & Đo lường:** Tự tay chạy `k6 run testing/load/k6-oversell-check.js` trên terminal để kiểm chứng kết quả thực tế bằng số liệu chứ không tin mù quáng vào code AI."*

---

## 3) "Bạn định nghĩa 'Vibe Coding' như thế nào và quy trình làm việc của bạn ra sao?"

### 💡 Trả lời mẫu:
> *"Theo em, **Vibe Coding** là phương pháp phát triển hiện đại nơi kỹ sư tập trung vào **ý tưởng kiến trúc, tư duy thiết kế hệ thống và trải nghiệm người dùng**, tận dụng AI để giảm bớt thời gian gõ code boilerplate lặp lại. Nhưng để Vibe Coding không biến thành 'thảm họa rác code', em luôn tuân thủ quy trình 5 bước nghiêm ngặt:
> 
> - **Bước 1: Thin-Slice Specification (Đặc tả lát cắt mỏng):** Không bao giờ prompt yêu cầu 'viết cho tôi cả hệ thống bán vé'. Em chia nhỏ thành từng tính năng cụ thể: 'Viết NestJS Guard kiểm tra 5 Role JWT', 'Viết Redis Lua script nhận KEYS[1] là tồn kho và ARGV[1] là số vé mua'.
> - **Bước 2: Review Code như một Pull Request thực tế:** Đọc kỹ từng dòng code AI sinh ra: biến có đặt tên rõ nghĩa không, có leak bộ nhớ không, lỗi có được catch đàng hoàng không.
> - **Bước 3: Verification (Xác minh tức thì):** Chạy lệnh kiểm tra ngay trên Swagger `/api/docs` hoặc viết test k6 để kiểm chứng phản hồi.
> - **Bước 4: Hardening (Gia cố chất lượng):** Bổ sung validation bằng Zod/class-validator, thêm cờ Idempotency và thiết lập Rate Limiting.
> - **Bước 5: Quality Gate:** Chạy lệnh `pnpm verify:push` để đảm bảo toàn bộ mã nguồn pass 100% typecheck và linting trước khi đưa lên Git."*

---

## 4) "Bạn đã từng phát hiện và sửa lỗi nghiêm trọng nào do AI sinh ra chưa?"

### 💡 Ví dụ thực tế từ Tixora:
> *"Có ạ! Khi em nhờ AI viết luồng trừ vé Flash-Sale ban đầu, AI đã đề xuất dùng Prisma Transaction với `SELECT ... FOR UPDATE`:
> ```typescript
> await prisma.$transaction(async (tx) => {
>   const tier = await tx.ticketTier.findUnique({ where: { id }, select: { available: true } });
>   if (tier.available < quantity) throw new Error();
>   await tx.ticketTier.update({ where: { id }, data: { available: { decrement: quantity } } });
> });
> ```
> 
> **Lỗi em phát hiện ra:**  
> Về mặt lý thuyết code này đúng logic. Nhưng khi em phân tích dưới góc độ chịu tải cao (50.000 requests/giây), `SELECT FOR UPDATE` sẽ giữ Database Row Lock. Hàng ngàn kết nối sẽ xếp hàng chờ, khiến PostgreSQL Connection Pool cạn kiệt trong 2 giây, CPU chạm 100% và server crash toàn bộ.
> 
> **Cách em xử lý:**  
> Em yêu cầu loại bỏ hoàn toàn việc khóa hàng ở database và chuyển toàn bộ cơ chế sang **Redis Lua Script trên RAM**. Cơ sở dữ liệu chỉ tiếp nhận lệnh ghi đơn hàng bất đồng bộ thông qua **RabbitMQ Queue**. Nhờ vậy hệ thống phản hồi cực nhanh dưới 5ms và không bao giờ bị nghẽn connection pool."*

---

## 5) "MCP Server trong Tixora được thiết kế như thế nào và AI đóng vai trò gì trong đó?"

### 💡 Trả lời mẫu:
> *"Trong Monorepo của Tixora, em có xây dựng một ứng dụng riêng tại `apps/mcp-server` sử dụng chuẩn **Model Context Protocol (MCP)** của Anthropic.  
> 
> Mục đích: Cung cấp cho các trợ lý AI khả năng 'hiểu' trực tiếp dữ liệu nghiệp vụ của Tixora mà không cần lập trình viên phải copy-paste số liệu thủ công.
> - **Tools được expose cho AI:**
>   - `get_event_sales_metrics`: Truy vấn tỷ lệ bán vé, doanh thu và số vé còn lại theo từng hạng ghế.
>   - `check_gate_checkin_status`: Kiểm tra lưu lượng quét vé thời gian thực tại các Cổng A, B, C của sân vận động.
>   - `detect_fraud_anomalies`: Phát hiện các cảnh báo vé quét trùng lặp hoặc vé sai cổng.
> 
> Điều này biến Tixora từ một hệ thống bán vé truyền thống thành một nền tảng **AI-Ready Platform**, nơi Ban tổ chức có thể hỏi bằng ngôn ngữ tự nhiên: *'Tình hình Cổng B hiện tại có đang ùn ứ không và tỷ lệ vé VIP đã vào sân là bao nhiêu?'* và nhận câu trả lời chính xác trong vài giây."*
