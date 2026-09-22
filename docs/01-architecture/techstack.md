## 1. TẦNG CƠ SỞ DỮ LIỆU CHÍNH (PRIMARY DATABASE)

Hệ thống quản lý vé và tài chính yêu cầu tính toàn vẹn dữ liệu tuyệt đối (ACID). Nếu xảy ra hiện tượng lệch pha dữ liệu (Data anomaly), ban tổ chức sẽ phải đối mặt với thảm họa bán trùng vé (Overbooking).

### Phân tích các phương án & Trade-offs:

* **Phương án 1: MongoDB (NoSQL Document)**
* *Ưu điểm:* Mở rộng theo chiều ngang (Horizontal Scaling) rất tốt, ghi dữ liệu nhanh, lưu thông tin concert có cấu trúc động linh hoạt.
* *Tại sao LOẠI BỎ:* Mặc dù MongoDB đã hỗ trợ ACID transaction ở các phiên bản mới, nhưng cơ chế khóa (locking) và kiểm soát tranh chấp đồng thời của nó không tối ưu bằng RDBMS cho các bảng có ràng buộc chéo phức tạp (như Orders và Tickets). Rủi ro xuất hiện "phantom read" (đọc ảo) khi tải cực cao là rất lớn.

**Phương án 2: PostgreSQL (Relational Database) - ĐỀ XUẤT CHỌN** 
*Lý do chọn:* PostgreSQL là ông vua về tính nhất quán và tuân thủ chặt chẽ chuẩn ACID. Nó hỗ trợ kiểu dữ liệu `JSONB` cực mạnh (giúp ta vừa lưu được dữ liệu quan hệ chặt chẽ của vé, vừa lưu được dữ liệu động linh hoạt như log phản hồi từ cổng thanh toán VNPAY hoặc metadata của các AI Job ). Hệ thống indexing (B-Tree, GiST) của Postgres rất chín muồi để tối ưu các câu lệnh query báo cáo doanh thu.

---

## 2. TẦNG ĐỆM VÀ XỬ LÝ ĐỒNG THỜI (CACHING & CONCURRENCY LOCK)

Tầng này là "khiên đỡ" cho PostgreSQL chống lại cơn bão 80.000 truy cập.

### Phân tích các phương án & Trade-offs:

* **Phương án 1: Memcached**
* *Ưu điểm:* Tốc độ đọc/ghi Key-Value thuần túy cực nhanh, kiến trúc đa luồng (Multi-threaded).
* *Tại sao LOẠI BỎ:* Memcached quá đơn giản. Nó không hỗ trợ các cấu trúc dữ liệu nâng cao và đặc biệt là **không hỗ trợ Lua Script**. Trong luồng mua vé, chúng ta bắt buộc phải chạy kịch bản nguyên tử (Atomic) ngay trên RAM để vừa check giới hạn vé của user, vừa trừ số lượng tồn. Memcached hoàn toàn bất lực trước bài toán này.

**Phương án 2: Redis - ĐỀ XUẤT CHỌN** 
*Lý do chọn:* Chạy đơn luồng (Single-threaded) trên RAM , biến mọi yêu cầu đồng thời thành tuần tự mà không gây lock blocking. Khả năng biên dịch và chạy **Lua Script** trực tiếp giúp giải quyết triệt để bài toán tranh chấp 200 vé SVIP. Redis cũng hỗ trợ TTL tốt cho chiến lược Cache-Aside thông tin sự kiện.

---

## 3. HÀNG ĐỢI VÀ TRUYỀN TIN BẤT ĐỒNG BỘ (MESSAGE BROKER)

Đóng vai trò "hồ điều hòa" giải tỏa áp lực ghi xuống DB và phân tách các service (Decoupling).

### Phân tích các phương án & Trade-offs:

* **Phương án 1: Apache Kafka**
* *Ưu điểm:* Khả năng xử lý luồng dữ liệu (Stream) với throughput khủng khiếp, lưu trữ dữ liệu vĩnh viễn trên đĩa cứng (Log retention).
* *Tại sao LOẠI BỎ:* Quá cồng kềnh cho bài toán TicketBox. Kafka không hỗ trợ cơ chế hàng đợi công việc (Task Queue) linh hoạt theo mặc định. Quan trọng nhất, việc triển khai **Delay Message (hẹn giờ 10 phút hủy phiên giữ chỗ)**  trên Kafka cực kỳ phức tạp, đòi hỏi phải tạo nhiều topic phân mảnh hoặc dùng thêm công cụ phụ trợ bên ngoài.

**Phương án 2: RabbitMQ - ĐỀ XUẤT CHỌN** 
* *Lý do chọn:* Là một Message Broker hướng tác vụ mẫu mực (Task-oriented). RabbitMQ hỗ trợ cơ chế **Dead Letter Exchange (DLX) / Delayed Message** một cách native. Điều này khớp hoàn chỉnh với kịch bản giữ chỗ vé trong 10 phút: nếu quá thời gian mà chưa thanh toán, message tự động kích hoạt tiến trình hủy đơn và hoàn vé.

---

## 4. NGÔN NGỮ & FRAMEWORK BACKEND (BACKEND ECOSYSTEM)

Nơi thực thi toàn bộ logic nghiệp vụ, tích hợp AI và cổng thanh toán.

### Phân tích các phương án & Trade-offs:

* **Phương án 1: Node.js (NestJS / Express)**
* *Ưu điểm:* Lập trình bất đồng bộ (Asynchronous Non-blocking I/O) rất mạnh cho các ứng dụng Read-Heavy, tốc độ phát triển dự án nhanh nhờ hệ sinh thái JavaScript/TypeScript phong phú.
* *Nhược điểm:* Đơn luồng CPU-bound. Khi phải thực hiện các tác vụ nặng (như xử lý file CSV hàng nghìn dòng hoặc tính toán mã hóa chuỗi QR ), Node.js có thể làm nghẽn Event Loop nếu không code kỹ.

* **Phương án 2: Go (Golang)**
* *Ưu điểm:* Hiệu năng tiệm cận C/C++, cơ chế Concurrency (Goroutines & Channels) cực nhẹ, tốn rất ít RAM.
* 
*Nhược điểm:* Ngôn ngữ tối giản, thiếu các framework "mì ăn liền" toàn diện (Batteries-included) như Spring hay NestJS, tốn nhiều thời gian viết code boilerplate hơn cho các tính năng phân quyền (RBAC) hoặc quản trị.

* ** Giải pháp Đề xuất: Java (Spring Boot) HOẶC NestJS kết hợp với Python Worker**
* *Lựa chọn 1 (Nếu làm Monolith/Microservices chuẩn chỉ):* **Java Spring Boot**. Hệ sinh thái này có thư viện **Resilience4j** hỗ trợ Circuit Breaker chuẩn mực nhất cho luồng Payment. Tính năng Multi-threading giúp xử lý tác vụ ngầm ổn định.

* *Lựa chọn 2 (Tối ưu cho Đồ án sinh viên - Khuyên dùng):* Dùng **NestJS** làm API chính để phục vụ Frontend nhanh chóng. Riêng phần xử lý file CSV và trích xuất PDF/gọi LLM cho AI Artist Bio , hãy viết một **Worker Service bằng Python** (dùng các thư viện như `Celery`  hoặc `FastAPI`) để tận dụng sức mạnh xử lý dữ liệu và AI của Python.

---

## 5. CƠ SỞ DỮ LIỆU CỤC BỘ TRÊN MOBILE APPS (OFFLINE STORAGE)

Dùng cho ứng dụng soát vé của nhân sự tại sân vận động khi mất mạng.

### Phân tích các phương án & Trade-offs:

* **Phương án 1: Realm Mobile Database**
* *Ưu điểm:* Là NoSQL cho mobile, tốc độ đọc ghi cực nhanh, cú pháp lập trình hướng đối tượng hướng hiện đại.
* 
*Tại sao LOẠI BỎ:* Thêm thư viện nặng vào ứng dụng, khó bảo trì dài hạn và không thực sự cần thiết khi cấu trúc bảng dữ liệu soát vé offline cực kỳ đơn giản (chỉ cần tra cứu chuỗi QR băm).

**Phương án 2: SQLite (Room cho Android / CoreData cho iOS) - ĐỀ XUẤT CHỌN** 
*Lý do chọn:* Có sẵn trong hệ điều hành của điện thoại di động, không tốn thêm dung lượng app. Khả năng indexing trường `qr_code_hash` trên SQLite đem lại tốc độ tra cứu gần như tức thì (< 1 mili-giây) , đảm bảo luồng quét vé diễn ra liên tục.

---

## TỔNG KẾT BẢNG TECH STACK ĐỀ XUẤT (SUMMARY)

| Thành phần (Component) | Công nghệ lựa chọn (Tech Chosen) | Vai trò trong TicketBox (Specific Role) |
| --- | --- | --- |
| **API Gateway** | **Nginx** hoặc **Kong API Gateway** | Chặn bot, cấu hình thuật toán Token Bucket để Rate Limiting. |
| **Backend API** | **Node.js (NestJS)** hoặc **Java (Spring Boot)** | Xử lý các luồng nghiệp vụ chính, validate dữ liệu, điều phối API.|
| **AI/Sync Worker** | **Python (FastAPI / Celery)** | Đọc file CSV khách mời , thực hiện OCR PDF và kết nối LLM API.|
| **Primary Database** | **PostgreSQL (v15+)** | Lưu trữ Orders, Tickets, Users, đảm bảo tính toàn vẹn tài chính.|
| **Caching & Lock** | **Redis (v7+)** | Chứa bộ đếm số vé, chạy Lua Script giữ chỗ, lưu Idempotency Key 24h.|
| **Message Broker** | **RabbitMQ** | Nhận yêu cầu mua vé chuyển cho Worker ghi DB , chạy Delay Queue 10 phút.|
| **Mobile App (Check-in)** | **Flutter / Native (Android/iOS)** | Sử dụng **SQLite (Room)** để quét và lưu vết soát vé offline tại cổng.|
| **Static Delivery** | **Cloudflare / AWS S3** | Lưu trữ và phân phối sơ đồ chỗ ngồi SVG và hình ảnh concert.|
