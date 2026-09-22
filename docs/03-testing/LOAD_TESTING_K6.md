# HƯỚNG DẪN KIỂM THỬ TẢI & CHỐNG OVERSELL VỚI K6 (LOAD TESTING GUIDE)

> **Mục tiêu:** Kiểm chứng độ chịu tải, cơ chế Rate Limiting (Token Bucket) và chứng minh hệ thống không bị bán quá số lượng (Zero Oversell) khi có nhiều người dùng đặt vé đồng thời.

---

## 1. Yêu cầu Tiền đề (Prerequisites)
1. **Cài đặt k6:**
   - Windows (PowerShell/winget): `winget install k6 --source winget` hoặc tải từ [k6.io](https://k6.io).
   - macOS: `brew install k6`
   - Linux: `sudo apt-get install k6`
2. **Backend & Hạ tầng đang chạy:**
   - Redis container đang bật (`localhost:6379`).
   - RabbitMQ container đang bật (`localhost:5672`).
   - Backend API đang chạy tại `http://localhost:3000`.
   - Đã nạp seed data: `pnpm db:seed`.

---

## 2. Kịch Bản 1: Kiểm Tra Rate Limiting (Token Bucket)

### Mục đích:
Chứng minh khi có lượng lớn request gửi dồn dập vào API, hệ thống tự động trả về mã `HTTP 429 Too Many Requests` và bảo vệ tài nguyên server.

### Lệnh chạy (PowerShell):
```powershell
.\scripts\k6-ticketing-flow.local.ps1
```

### Kết quả mong đợi:
- Các request trong hạn mức token bucket: `HTTP 200 OK` hoặc `HTTP 201 Created`.
- Khi vượt ngưỡng: Server trả về `HTTP 429 Too Many Requests`.
- Không xảy ra lỗi `500 Internal Server Error`.
- CPU và RAM của Backend API duy trì ở mức an toàn.

---

## 3. Kịch Bản 2: Kiểm Tra Chống Bán Quá Số Lượng (Concurrency & Zero Oversell)

### Mục đích:
Mô phỏng 30 - 50 người dùng ảo (Virtual Users - VUs) đồng thời tranh mua cùng một hạng vé chỉ còn tồn kho **10 vé**. Chứng minh chỉ đúng 10 người mua được vé, các lượt còn lại bị từ chối sạch sẽ mà không xảy ra hiện tượng âm kho (Oversell).

### Lệnh chạy (PowerShell):
```powershell
.\scripts\k6-oversell-check.local.ps1
```

### Cơ chế hoạt động:
1. Script tạo ra hàng chục request giữ chỗ `/tickets/reserve` song song trong cùng một mili-giây.
2. Backend gọi Redis Lua script:
   - Kiểm tra tồn kho nguyên tử (`HGET` và `HINCRBY`).
   - Đảm bảo tính tuần tự (Single-threaded atomic execution).
3. 10 request đầu tiên nhận `HTTP 201 Created` kèm order id.
4. Toàn bộ các request sau nhận thông báo hết vé.
5. Sau khi test xong, script kiểm tra lại số lượng vé phát hành trong DB: **chính xác 10 vé**.

---

## 4. File Kết Quả Mẫu
- `k6-oversell-summary.json`: Kết quả chi tiết về latency p95, p99 và số lượng request thành công/thất bại.
- `k6-ticketing-summary.json`: Kết quả chi tiết của kịch bản luồng đặt vé chịu tải thường.
