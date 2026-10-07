# Q&A: Kiến Thức Nền Tảng Web, Concurrency & Hệ Thống Phân Tán

> Bộ câu hỏi dành cho ứng viên Software Engineer Intern / Junior khi phỏng vấn vị trí Backend / Full-Stack. Trả lời ngắn gọn, chắc chắn và gắn liền với kinh nghiệm thực tế từ dự án Tixora.

---

## 1) Concurrency (Đồng thời) khác Parallelism (Song song) như thế nào?

- **Concurrency (Xử lý đồng thời):** Là khả năng hệ thống giải quyết nhiều tác vụ cùng một lúc bằng cách xen kẽ (interleaving / context switching). Ví dụ: Node.js là đơn luồng (Single-threaded) nhưng có tính Concurrent cao nhờ Event Loop và non-blocking I/O.
- **Parallelism (Xử lý song song):** Là việc nhiều tác vụ thực sự chạy cùng một thời điểm vật lý trên nhiều CPU cores khác nhau.
- **Liên hệ Tixora:** Redis xử lý các lệnh đơn luồng (Single-threaded Concurrency), nghĩa là các lệnh Lua Script được xếp hàng chạy tuần tự trên RAM mà không có 2 lệnh nào chạy song song làm tranh chấp bộ nhớ, nhờ đó loại trừ 100% race condition mà không cần khóa luồng phức tạp.

---

## 2) Race Condition là gì? Làm thế nào để phòng tránh?

- **Định nghĩa:** Race Condition (Tranh chấp điều kiện) xảy ra khi hai hoặc nhiều tiến trình cùng truy cập và cố gắng thay đổi dữ liệu dùng chung tại cùng một thời điểm, và kết quả cuối cùng phụ thuộc vào thứ tự thực thi của các tiến trình đó.
- **Hậu quả trong bán vé:** Nếu còn 1 vé cuối cùng, 2 người cùng kiểm tra thấy vé còn và cùng đặt mua, hệ thống sẽ bán ra 2 vé cho 1 ghế duy nhất (**Overselling**).
- **Cách phòng tránh:**
  1. **Pessimistic Locking:** `SELECT FOR UPDATE` trong SQL (nhược điểm: dễ nghẽn kết nối khi tải cao).
  2. **Optimistic Locking:** Sử dụng cột `version` để kiểm tra điều kiện trước khi commit (`WHERE version = current_version`).
  3. **Atomic Operations trên RAM (Cách Tixora dùng):** Dùng Redis Lua Script để kiểm tra và trừ tồn kho trong cùng một thao tác nguyên tử duy nhất.

---

## 3) Tại sao dùng Redis Lua Script thay vì chạy nhiều lệnh Redis riêng lẻ?

- Nếu gửi các lệnh riêng biệt:
  ```text
  1. GET stock:tier_1        -> Trả về: 5
  2. DECRBY stock:tier_1 1   -> Trừ xuống 4
  ```
  Giữa bước 1 và bước 2, một request khác có thể xen vào giữa và cũng đọc được số 5, dẫn đến dữ liệu không nhất quán.
- **Redis Lua Script:** Redis thực thi toàn bộ script Lua như một khối lệnh nguyên tử duy nhất (Atomic block). Trong thời gian script đang chạy, không có bất kỳ lệnh hoặc script nào khác được xen vào giữa. Điều này đảm bảo tính toàn vẹn dữ liệu 100%.

---

## 4) Cache-Aside Pattern là gì? Khi nào xảy ra rủi ro Cache Stampede (Thundering Herd)?

- **Cache-Aside Pattern:**
  1. Ứng dụng nhận request đọc dữ liệu.
  2. Kiểm tra Cache (Redis): Nếu có (**Cache Hit**), trả về ngay.
  3. Nếu không có (**Cache Miss**), truy vấn Database, nạp kết quả vào Cache với thời gian sống TTL, sau đó trả về cho client.
- **Cache Stampede (Thundering Herd):** Xảy ra khi một key rất "hot" (ví dụ: thông tin concert mở bán vé) vừa hết hạn TTL đúng thời điểm có hàng ngàn request cùng đổ về. Tất cả các request đồng loạt thấy Cache Miss và cùng lúc tấn công vào Database để đọc, làm sập Database.
- **Cách Tixora phòng chống:**
  - Thiết lập TTL ngẫu nhiên (Jitter) để các key không hết hạn cùng lúc.
  - Sử dụng Mutex / Single-flight lock để chỉ cho phép duy nhất 1 request đi xuống Database nạp lại cache, các request khác chờ kết quả từ request này.

---

## 5) Message Broker (RabbitMQ) giúp gì so với gọi API đồng bộ (Synchronous HTTP)?

- **Khớp nối lỏng (Decoupling):** Service gửi không cần biết Service nhận đang bận hay rảnh, chỉ cần đẩy tin nhắn vào hàng đợi.
- **San phẳng đỉnh tải (Traffic Leveling / Peak Shaving):** Khi có bùng nổ truy cập, tin nhắn được giữ an toàn trong hàng đợi (Queue), các Worker phía sau sẽ tiêu thụ từ từ theo công suất tối đa của database mà không làm nghẽn đĩa cứng hay crash server.
- **Độ bền vững & Khả năng chịu lỗi (Durability & Fault Tolerance):** Nếu Worker gặp sự cố và khởi động lại, tin nhắn vẫn nằm an toàn trên RabbitMQ (nhờ cờ `durable` và `ack`), không bị mất mát giao dịch của khách hàng.

---

## 6) Database Indexing hoạt động như thế nào? Trade-off khi đánh Index là gì?

- **Cơ chế:** Index thường được tổ chức dưới cấu trúc cây cân bằng (**B-Tree**). Thay vì phải quét toàn bộ bảng dữ liệu (Full Table Scan O(N)), database chỉ cần duyệt cây theo độ phức tạp O(log N) để tìm ra bản ghi.
- **Trade-off:**
  - **Tăng tốc độ đọc (Read performance):** Tìm kiếm và sắp xếp (`WHERE`, `ORDER BY`, `JOIN`) nhanh hơn nhiều lần.
  - **Giảm tốc độ ghi (Write overhead):** Mỗi khi thực hiện `INSERT`, `UPDATE`, `DELETE`, database phải cập nhật lại cấu trúc cây của toàn bộ các index liên quan.
  - **Tốn dung lượng ổ đĩa:** Các index được lưu trữ như những bảng phụ trợ trên đĩa.
- **Áp dụng trong Tixora:** Chỉ đánh chỉ mục trên các cột thường xuyên truy vấn và lọc như `event_id`, `tier_id`, `status` và tạo Composite Index `[event_id, status]`.

---

## 7) Stateless JWT vs Stateful Session: Ưu nhược điểm và tại sao Tixora chọn JWT?

- **Stateful Session:** Server lưu trữ session data trong RAM/Database và gửi Cookie chứa Session ID cho client. Nhược điểm: Khó mở rộng ngang (Horizontal Scaling) khi chạy nhiều server pods vì cần đồng bộ session qua Redis.
- **Stateless JWT:** Toàn bộ thông tin định danh (User ID, Role, Permissions) được mã hóa và ký số điện tử (Digital Signature) nằm ngay trong Payload của Token.
- **Lý do Tixora chọn Stateless JWT:**
  - **Hiệu năng cao:** Bất kỳ Gateway hay Microservice nào cũng có thể tự xác thực token bằng Secret Key mà không cần query vào CSDL mỗi khi có request gửi tới.
  - Phù hợp hoàn hảo cho hệ thống phân tán Monorepo với 4 phân hệ (Web Khách hàng, Admin Portal, Mobile Scanner và Backend API).

---

## 8) Idempotency (Tính lũy đẳng) trong thanh toán và Webhook là gì?

- **Khái niệm:** Một thao tác được gọi là lũy đẳng (Idempotent) nếu việc thực hiện nó 1 lần hay lặp lại N lần thì kết quả cuối cùng của hệ thống vẫn giống hệt nhau và không sinh ra tác dụng phụ (side-effect).
- **Thực tế trong Tixora:**
  - Khi khách hàng nhấn thanh toán, client sinh ra một `Idempotency-Key` ngẫu nhiên.
  - Server dùng **Redis `SETNX`** (`SET if Not eXists`) để lưu key này với TTL 24 giờ.
  - Nếu request trùng lặp gửi đến cùng lúc hoặc webhook từ PayOS gửi lại lần thứ 2, hệ thống kiểm tra thấy key đã tồn tại và sẽ trả về kết quả trước đó mà không trừ tiền hay sinh vé lần thứ 2.
