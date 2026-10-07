# 🎯 CẨM NANG PHỎNG VẤN & KỊCH BẢN DEMO DỰ ÁN TIXORA (INTERVIEW PLAYBOOK)

> **Dành cho ứng viên Intern / Fresher Software Engineer**  
> Dự án: **Tixora — High-Concurrency Ticketing & Offline Gate Check-in Platform**  
> Tác giả: **Trần Vũ Quang**

---

## 💡 Tư Duy Phỏng Vấn: Biến "Đồ Án CRUD" Thành "Hệ Thống Enterprise Chịu Tải Cao"

> [!IMPORTANT]
> **Điểm yếu chí mạng của 90% ứng viên Intern:**  
> Đa phần sinh viên khi demo chỉ làm các thao tác CRUD cơ bản: *"Em đăng ký tài khoản, em đăng nhập, em tạo sự kiện, em sửa tên, em xóa..."*. Người phỏng vấn (Tech Lead / Senior Engineer) sẽ lập tức mất tập trung vì hàng trăm ứng viên đều làm như vậy.
> 
> **Cách bạn ghi điểm tuyệt đối với Tixora:**  
> Bạn không bán "tính năng CRUD". Bạn bán **tư duy giải quyết 2 bài toán kỹ thuật thực tế hóc búa**:
> 1. **High Concurrency Flash-Sale**: Xử lý hàng chục ngàn người tranh mua vé cùng 1 giây mà **không sập server, không nghẽn DB, 100% Zero-Oversell**.
> 2. **Offline-First Gate Check-in**: Soát vé sân vận động 40.000 người khi **sóng 4G/Wifi tê liệt hoàn toàn**, phản hồi dưới **100ms** và đồng bộ an toàn khi có mạng.

---

## ⏱️ PHẦN 1: Mở Đầu Ấn Tượng (The 60-Second Elevator Pitch)

Khi người phỏng vấn nói: *"Em hãy giới thiệu ngắn gọn về bản thân và dự án tâm đắc nhất của em"*, hãy trả lời theo cấu trúc sau:

```text
"Dạ chào anh/chị, dự án tâm đắc nhất của em là Tixora - nền tảng phân phối vé và soát vé sự kiện quy mô lớn 
được thiết kế theo mô hình pnpm Monorepo với 4 phân hệ (Web Khách hàng, Admin Portal, Mobile Scanner và Backend API).

Thay vì chỉ làm một website bán vé thông thường, em tập trung giải quyết 2 bài toán kỹ thuật sống còn của ngành sự kiện:
Thứ nhất là bài toán Flash-sale: Tránh race condition bán vượt quá số lượng vé khi hàng ngàn người bấm mua cùng lúc. 
Em giải quyết bằng Redis Lua script xử lý nguyên tử trên RAM và RabbitMQ đệm ghi CSDL bất đồng bộ.

Thứ hai là bài toán Sân vận động nghẽn mạng: Thiết bị quét vé di động của nhân viên vẫn kiểm soát vé chính xác < 100ms 
ngay cả khi mất hoàn toàn Internet nhờ cơ chế Gate Segregation, Prefetch băm vé bảo mật và Bulk-sync chống conflict.

Hệ thống đã có Live Demo trên Cloud, tài liệu kiến trúc C4 đầy đủ và bộ kiểm thử tự động k6 stress test 
chứng minh Zero-Oversell. Em rất hào hứng được demo chi tiết cho anh/chị ạ!"
```

---

## 🎬 PHẦN 2: Kịch Bản Demo 7 Phút Thực Chiến (Minute-by-Minute Script)

Chuẩn bị trước các tab trình duyệt, thiết bị di động và terminal sẵn sàng để chuyển cảnh mượt mà:
- **Tab 1 (Live Cloud):** Web Khách Hàng (`https://tixora.tvquang.id.vn`) — Tài khoản: `audience@tixora.local` / `12345678`.
- **Tab 2 (Live Cloud):** Admin & Organizer Portal (`https://tixora-admin.tvquang.id.vn`) — Tài khoản: `admin@tixora.local` / `12345678`.
- **Thiết Bị 3 (Local Mobile):** Điện thoại mở **Expo Go** quét mã chạy từ `cd apps/mobile-app && pnpm start` (hoặc mở máy ảo phím `a`/`i`), đăng nhập `checker@tixora.local` / `12345678`.
- **Terminal 4 (Engineering Proof):** Sẵn sàng chạy lệnh kiểm chứng tải cao: `pnpm test:load:oversell`.

---

### Phút 00:00 – 01:30 | Tổng Quan Kiến Trúc & Hệ Sinh Thái 4 Phân Hệ
- **Hành động:** Mở sơ đồ kiến trúc tại [docs/01-architecture/SYSTEM_DESIGN.md](file:///d:/document/projects/persional-projects/Tixora/docs/01-architecture/SYSTEM_DESIGN.md) hoặc trang bìa README.
- **Lời thoại:**
  > *"Em xây dựng Tixora với kiến trúc Monorepo thống nhất gồm: Backend NestJS tối ưu hiệu năng, 2 cổng Web/Admin bằng Next.js 16 App Router, và Mobile Scanner viết bằng Expo React Native. Toàn bộ code tuân thủ nghiêm ngặt chuẩn Typescript Strict và Quality Gates."*

---

### Phút 01:30 – 03:30 | Hero Feature 1: Săn Vé Flash-Sale & Cơ Chế Giữ Chỗ Nguyên Tử (Atomic Hold)
- **Hành động:**
  1. Mở Web Khách hàng, đăng nhập tài khoản `audience@tixora.local`.
  2. Chọn một concert đang mở bán (ví dụ: *Anh Trai Say Hi* hoặc *Hà Anh Tuấn Live Concert*).
  3. Chọn hạng vé VIP, bấm **"Giữ vé / Mua ngay"**.
  4. Chỉ vào **đồng hồ đếm ngược 10 phút**.
- **Lời thoại:**
  > *"Tại bước này, hệ thống không ghi trực tiếp xuống PostgreSQL bằng `SELECT FOR UPDATE` vì sẽ làm cạn kiệt connection pool khi có bùng nổ truy cập.  
  > Thay vào đó, backend gọi **Redis Lua Script** để kiểm tra tồn kho, kiểm tra hạn mức mua tối đa mỗi tài khoản và trừ vé trực tiếp trên RAM trong nano-giây. Vé được cấp TTL 10 phút. Nếu trong 10 phút khách không thanh toán, worker hoặc Redis key expiration sẽ tự động hoàn vé lại kho cho người khác."*
- **Điểm nhấn ăn tiền:** Mở thêm 1 tab ẩn danh hoặc tab khác để cho thấy số lượng vé còn lại cập nhật tức thì, không thể giữ vượt số lượng tồn.

---

### Phút 03:30 – 04:30 | Hero Feature 2: Thanh Toán VietQR & Idempotency Key
- **Hành động:**
  1. Chuyển sang màn hình thanh toán PayOS.
  2. Hiển thị mã VietQR động chứa mã đơn hàng và số tiền chính xác.
  3. Giới thiệu cơ chế Webhook.
- **Lời thoại:**
  > *"Khi thanh toán, để đảm bảo an toàn tài chính:  
  > 1. Mỗi giao dịch gắn một **Idempotency-Key** duy nhất trong Redis, phòng trường hợp mạng chập chờn khách bấm đúp nút thanh toán thì hệ thống không bao giờ trừ tiền 2 lần.  
  > 2. Webhook từ cổng PayOS được kiểm tra chữ ký HMAC SHA256 bảo mật. Khi tiền vào tài khoản, hệ thống sinh mã vé điện tử QR Code với chữ ký băm muối (salted hash) an toàn."*

---

### Phút 04:30 – 06:00 | Hero Feature 3: Soát Vé Ngoại Tuyến Tại Cổng (Offline-First Gate Check-in)
*(Đây là tính năng độc đáo nhất giúp bạn vượt trội hoàn toàn so với các ứng viên khác!)*
- **Hành động:**
  1. Mở trang vé của Audience, mở mã QR vé vừa mua.
  2. Mở ứng dụng Mobile Scanner (hoặc giao diện giả lập check-in).
  3. **Tắt kết nối mạng (Bật chế độ Offline trong DevTools Network hoặc tắt Wifi)**.
  4. Quét/Nhập mã QR vé: Màn hình hiện màu **Xanh lá (HỢP LỆ - CỬA GA 01)** dưới **100ms**.
  5. Quét lại chính mã đó: Màn hình lập tức báo **Đỏ (CẢNH BÁO: VÉ ĐÃ SỬ DỤNG LÚC 19:42)**.
  6. Bật lại mạng: Hiển thị thông báo dữ liệu đã tự động đồng bộ (Bulk-Sync) về máy chủ trung tâm.
- **Lời thoại:**
  > *"Tại các concert 40.000 khán giả, trạm phát sóng di động thường sập vì nghẽn tải. Nếu máy quét phụ thuộc vào API server thì cổng vào sẽ kẹt cứng.  
  > Giải pháp của em là **Gate Segregation**: Thiết bị của nhân viên Cổng 1 chỉ tải trước danh sách băm của các vé thuộc Cổng 1 về Local Storage trước giờ mở cửa.  
  > Khi quét ngoại tuyến, máy đối chiếu băm tại chỗ trong < 100ms. Khi có mạng trở lại, ứng dụng đẩy mảng logs check-in lên server theo cơ chế Bulk Sync và giải quyết xung đột dựa trên mốc thời gian nguyên tử."*

---

### Phút 06:00 – 07:00 | Admin Dashboard & Bằng Chứng Chịu Tải (Proof of Scale)
- **Hành động:**
  1. Mở Admin Portal (`https://tixora-admin.tvquang.id.vn`), đăng nhập `admin@tixora.local`.
  2. Cho xem Dashboard doanh thu, biểu đồ tỷ lệ lấp đầy vé realtime.
  3. Mở terminal gõ: `pnpm verify:push` hoặc mở ảnh kết quả kiểm thử **k6 Stress Test** trong tài liệu.
- **Lời thoại:**
  > *"Admin Portal được thiết kế theo chuẩn Enterprise Design System HTCAA với tông màu Navy/Sky chuyên nghiệp.  
  > Để chứng minh hệ thống không chỉ chạy được trên lý thuyết, em đã viết kịch bản k6 mô phỏng **1.000 người dùng ảo đồng thời tranh cướp 50 vé**. Kết quả kiểm thử đạt **100% Zero-Oversell**: Đúng 50 vé được bán ra, 950 yêu cầu bị từ chối an toàn và Rate Limiter Token Bucket bảo vệ server không bị quá tải."*

---

## PHẦN 3: Top 10 Câu Hỏi Hóc Búa Interviewer Chắc Chắn Sẽ Hỏi & Câu Trả Lời Chuẩn Mực

### Câu 1: "Tại sao em dùng Redis Lua Script thay vì dùng Database Transaction (`SELECT FOR UPDATE`)?"
> **Trả lời xuất sắc:**  
> *"Dạ, `SELECT ... FOR UPDATE` tạo ra lock ở cấp độ hàng của CSDL quan hệ. Khi có hàng ngàn request cùng tranh chấp 1 hàng vé, các kết nối sẽ phải xếp hàng chờ giải phóng lock. Việc này làm cạn kiệt Connection Pool của PostgreSQL, đẩy CPU lên 100% và gây sập lan truyền (cascading failure).  
> Trong khi đó, Redis thực thi đơn luồng (single-threaded). Lua Script cho phép em gom các thao tác: 'kiểm tra tồn kho -> kiểm tra giới hạn khách -> trừ vé -> tạo khóa giữ chỗ' thành một khối lệnh nguyên tử (atomic) chạy hoàn toàn trên RAM. Tốc độ xử lý chỉ tính bằng micro-giây, không block database và loại trừ 100% race condition."*

---

### Câu 2: "Nếu người dùng giữ vé xong rồi bỏ đi không thanh toán thì vé có bị mất vĩnh viễn không?"
> **Trả lời xuất sắc:**  
> *"Dạ không ạ. Khi giữ vé thành công trên Redis, em gán một thời gian sống TTL là 600 giây (10 phút).  
> Hệ thống có 2 lớp bảo vệ để hoàn vé:  
> 1. Lớp thời gian thực: Client hiển thị đếm ngược 10 phút, khi hết giờ thì UI báo hết hạn.  
> 2. Lớp Backend Worker: Khi đơn hàng ở trạng thái PENDING quá 10 phút mà chưa có webhook thanh toán thành công, hệ thống sẽ thực hiện release vé (cộng lại tồn kho trong Redis và đánh dấu đơn hàng EXPIRED). Em cũng đề xuất mô hình RabbitMQ Dead Letter Exchange (DLX) để lập lịch hủy chính xác từng giây."*

---

### Câu 3: "Soát vé ngoại tuyến (Offline) thì làm sao phòng tránh vé giả mạo và chụp ảnh màn hình gửi cho người khác?"
> **Trả lời xuất sắc:**  
> *"Dạ, em thiết kế bảo mật 3 lớp:  
> 1. **Dữ liệu mã QR không lưu plain text** mà được sinh từ chuỗi ngẫu nhiên kết hợp thuật toán băm HMAC SHA256 kèm secret key bí mật của hệ thống. Kẻ gian tự tạo QR sẽ không bao giờ khớp với danh sách băm nạp sẵn trên máy quét.  
> 2. **Cơ chế vé chỉ được quét 1 lần**: Khi máy quét đọc vé lần đầu, nó ghi ngay cờ `USED` vào SQLite/Local Storage trên máy. Nếu người thứ hai cầm ảnh chụp màn hình quét lại ở cùng cổng, máy sẽ cảnh báo đỏ 'Vé đã sử dụng'.  
> 3. **Phân luồng cổng (Gate Segregation)**: Vé khán đài B không thể vào cổng khán đài A, giảm thiểu rủi ro 1 vé mang đi thử ở nhiều cửa khác nhau."*

---

### Câu 4: "Tại sao em chọn mô hình pnpm Monorepo thay vì tách thành nhiều repository độc lập?"
> **Trả lời xuất sắc:**  
> *"Dạ, em chọn pnpm Monorepo vì 3 lý do:  
> 1. **Chia sẻ Type Definition và DTO thống nhất**: Backend và 2 ứng dụng Frontend cùng chia sẻ các interface/contract, giúp phát hiện lỗi lệch API ngay khi biên dịch (typecheck) thay vì đợi đến lúc runtime.  
> 2. **Quản lý dependencies tiết kiệm và tốc độ cao**: pnpm sử dụng Content-Addressable Storage và hard link, giúp tiết kiệm gigabyte dung lượng ổ đĩa và cài đặt cực nhanh.  
> 3. **Quality Gate đồng bộ**: Em có thể chạy `pnpm verify:push` để kiểm tra lint, prettier và typecheck toàn bộ 4 phân hệ trong một lệnh duy nhất trước khi merge code."*

---

### Câu 5: "Nếu cổng thanh toán PayOS gửi Webhook 2 lần cùng lúc do mạng bị lặp gói tin thì sao?"
> **Trả lời xuất sắc:**  
> *"Dạ, đây là bài toán bảo đảm tính lũy đẳng (Idempotency). Em xử lý bằng 2 tầng:  
> Tầng 1: Sử dụng **Redis `SETNX`** với key `payment:webhook:{transaction_id}` và thời gian sống TTL 24h. Request đầu tiên sẽ lấy được lock và xử lý tiếp; request trùng lặp đến sau sẽ bị từ chối ngay lập tức.  
> Tầng 2: Trong PostgreSQL, em bọc cập nhật trạng thái đơn hàng trong Database Transaction và kiểm tra điều kiện `WHERE status = 'PENDING'`. Nếu trạng thái đã là `PAID`, câu lệnh update sẽ không tác động thêm."*

---

### Câu 6: "Tại sao dùng RabbitMQ trong kiến trúc này mà không ghi thẳng vào database?"
> **Trả lời xuất sắc:**  
> *"Dạ, mục đích chính của RabbitMQ là **san phẳng đỉnh tải (Traffic Leveling / Peak Shaving)**.  
> Khi mở bán vé, nếu 10.000 request cùng lúc ghi dữ liệu đơn hàng và lịch sử giao dịch vào PostgreSQL, đĩa I/O sẽ bị quá tải.  
> Bằng cách đẩy message `TicketReserved` vào RabbitMQ, API server có thể phản hồi cho người dùng ngay lập tức với độ trễ thấp (< 50ms). Các Worker phía sau sẽ tiêu thụ message với tốc độ mà cơ sở dữ liệu có thể chịu tải ổn định nhất mà không bị crash."*

---

### Câu 7: "Hệ thống phân quyền RBAC được triển khai như thế nào?"
> **Trả lời xuất sắc:**  
> *"Dạ, Tixora phân quyền theo 5 vai trò rõ rệt:  
> - **SuperAdmin:** Quản trị tối cao, kiểm toán đối soát tài chính toàn sàn.  
> - **Admin:** Duyệt sự kiện, cấu hình danh mục và giám sát hệ thống.  
> - **Organizer:** Tạo concert, quản lý sơ đồ hạng vé, theo dõi doanh thu của chính sự kiện mình tổ chức.  
> - **Checker:** Nhân viên soát vé tại cổng, chỉ có quyền prefetch và quét vé.  
> - **Audience:** Khán giả mua vé và xem vé của chính mình.  
> Em triển khai bằng NestJS Guard kết hợp Stateless JWT Claims và Custom Decorators `@Roles()`, kiểm tra quyền hạn ngay tại tầng controller."*

---

### Câu 8: "Em đã tối ưu hiệu năng đọc (Read Performance) cho danh mục sự kiện như thế nào?"
> **Trả lời xuất sắc:**  
> *"Dạ, trang chủ và danh sách concert là nơi có tần suất đọc cực lớn nhưng dữ liệu ít thay đổi.  
> Em áp dụng chiến lược **Cache-Aside Pattern với Redis**:  
> Khi người dùng xem concert, hệ thống kiểm tra Redis trước. Nếu có (Cache Hit), trả về ngay lập tức với độ trễ < 5ms.  
> Nếu Cache Miss, đọc từ PostgreSQL, lưu kết quả vào Redis với TTL hợp lý.  
> Khi Organizer hoặc Admin cập nhật thông tin sự kiện hoặc trạng thái vé, hệ thống phát sinh sự kiện vô hiệu hóa cache (Cache Invalidation) để đảm bảo tính nhất quán dữ liệu."*

---

### Câu 9: "Nếu em có thêm 1 tháng nữa để phát triển dự án, em sẽ cải tiến điều gì tiếp theo?"
> **Trả lời xuất sắc:**  
> *(Câu này thể hiện tầm nhìn và tư duy kỹ thuật của bạn!)*  
> *"Dạ, em đã lập sẵn bản đề xuất kiến trúc trong [docs/04-planning-roadmap/UPGRADE_PROPOSALS.md](file:///d:/document/projects/persional-projects/Tixora/docs/04-planning-roadmap/UPGRADE_PROPOSALS.md). Ba mục tiêu em ưu tiên nâng cấp tiếp theo gồm:  
> 1. **Virtual Waiting Room (Phòng chờ ảo)**: Sử dụng Redis Sorted Set (ZSET) xếp hàng FIFO có số thứ tự công bằng trước khi cho khán giả vào trang chọn vé.  
> 2. **Chữ ký số ECDSA (Elliptic Curve Cryptography)** cho vé QR: Cho phép máy quét offline xác thực chữ ký bằng Public Key mà thậm chí không cần prefetch trước danh sách hash.  
> 3. **Interactive SVG Seating Map**: Sơ đồ chọn chỗ ngồi trực quan theo từng ghế thời gian thực kết hợp WebSockets/SSE."*

---

### Câu 10: "Em đã gặp khó khăn kỹ thuật nào lớn nhất trong dự án và em đã giải quyết ra sao?"
> **Trả lời xuất sắc:**  
> *"Dạ, khó khăn lớn nhất của em là xử lý bài toán **Split-Brain và xung đột dữ liệu khi soát vé Offline**.  
> Ban đầu em lo ngại trường hợp nhân viên cầm máy offline quét xong nhưng thiết bị hỏng không đồng bộ được, hoặc hai máy quét cùng quét 1 vé ở hai cửa khác nhau.  
> Em đã giải quyết bằng cách áp dụng nguyên lý **Gate Segregation**: Mỗi cổng chỉ được phân bổ danh sách vé thuộc cổng đó. Đồng thời, cấu trúc dữ liệu sync được thiết kế lũy đẳng kèm trường `scanned_at` timestamp và `device_id`. Khi đồng bộ lên server, nếu vé đã được ghi nhận check-in ở một thiết bị khác với timestamp sớm hơn, server sẽ ghi nhận cảnh báo nghi vấn gian lận vào bảng Audit Log để bảo vệ tính toàn vẹn dữ liệu."*

---

## PHẦN 4: Checklist Chuẩn Bị Trước Giờ G (Pre-Interview Checklist)

Hãy rà soát kỹ bảng kiểm tra sau 30 phút trước buổi phỏng vấn:

- [ ] **Mạng & Trình duyệt:** Kiểm tra kết nối mạng ổn định, mở sẵn 3 tab trình duyệt (Audience Web, Admin Portal, Swagger Docs).
- [ ] **Tài khoản ghi nhớ sẵn:**
  - Khán giả: `audience@tixora.local` | Mật khẩu: `12345678`
  - Quản trị viên: `admin@tixora.local` | Mật khẩu: `12345678`
  - Soát vé: `checker@tixora.local` | Mật khẩu: `12345678`
- [ ] **Terminal dự phòng (Nếu phỏng vấn tại chỗ hoặc cần chạy local):**
  - Đã chạy Docker Redis & RabbitMQ: `cd infrastructure && docker compose up -d`
  - Đã seed dữ liệu mẫu: `pnpm db:seed`
  - Lệnh test kiểm chứng sẵn sàng: `pnpm verify:push`
- [ ] **Tâm lý tự tin:** Nói to, rõ ràng, tập trung vào **lý do lựa chọn giải pháp (Trade-offs & Rationale)** chứ không chỉ kể tính năng.
