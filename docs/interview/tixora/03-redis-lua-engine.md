# Động Cơ Chống Bán Lố Bằng Redis Lua (Atomic Zero-Oversell Engine)

## 1) Bài Toán "Ác Mộng Flash-Sale"
Khi một concert hot (như *Anh Trai Say Hi*) mở bán vé:
- 50.000 khán giả cùng bấm nút "Mua vé" trong vòng 1 giây.
- **Nếu dùng Database Transaction thông thường (`SELECT ... FOR UPDATE`):**  
  Database phải lock hàng dữ liệu của bảng `TicketTier`. Hàng ngàn kết nối sẽ xếp hàng chờ nhau để giải phóng lock, dẫn đến việc cạn kiệt Connection Pool của PostgreSQL, đẩy CPU lên 100% và toàn bộ backend bị sập (Cascading Failure).
- **Nếu không lock:**  
  Race Condition sẽ xảy ra khi nhiều request cùng đọc thấy còn vé và cùng trừ, dẫn đến bán lố hàng ngàn vé so với số ghế thực tế trong hội trường (**Overselling**).

---

## 2) Giải Pháp: Xử Lý Nguyên Tử Trên RAM Bằng Redis Lua Script

### Tại Sao Lại Là Redis Lua Script?
- **Redis chạy đơn luồng (Single-Threaded Execution):** Tại một thời điểm, chỉ có 1 lệnh hoặc 1 script được thực thi trên server Redis.
- **Tính nguyên tử (Atomicity):** Khi một Lua Script đang chạy, Redis cam kết không cho bất kỳ lệnh nào khác xen vào giữa. Toàn bộ logic kiểm tra và trừ tồn kho được thực hiện như **một thao tác đơn nhất**.
- **Tốc độ xử lý trên RAM:** Thời gian thực thi một script chỉ mất vài micro-giây, phản hồi cho client gần như tức thì.

---

## 3) Cấu Trúc Script Giữ Vé Nguyên Tử Trong Tixora

```lua
-- KEYS[1]: tier_stock_key (e.g., 'tier:stock:123')
-- KEYS[2]: user_hold_key  (e.g., 'user:hold:123:user_456')
-- ARGV[1]: requested_quantity (e.g., 2)
-- ARGV[2]: max_allowed_per_user (e.g., 4)
-- ARGV[3]: hold_ttl_seconds (e.g., 600)

local current_stock = tonumber(redis.call('GET', KEYS[1]) or '-1')
if current_stock == -1 then
    return { err = "TIER_NOT_FOUND" }
end

local requested = tonumber(ARGV[1])
local max_per_user = tonumber(ARGV[2])
local ttl = tonumber(ARGV[3])

-- 1. Kiểm tra tồn kho
if current_stock < requested then
    return { err = "OUT_OF_STOCK", remaining = current_stock }
end

-- 2. Kiểm tra hạn mức mua của user
local current_user_hold = tonumber(redis.call('GET', KEYS[2]) or '0')
if (current_user_hold + requested) > max_per_user then
    return { err = "EXCEEDED_MAX_PER_USER", current_held = current_user_hold }
end

-- 3. Trừ tồn kho & Ghi nhận phiên giữ chỗ
redis.call('DECRBY', KEYS[1], requested)
redis.call('SET', KEYS[2], current_user_hold + requested, 'EX', ttl)

return { ok = 1, remaining = current_stock - requested, held = requested }
```

---

## 4) Cơ Chế Đếm Ngược 10 Phút & Hoàn Vé Tự Động
- Khi Lua script thực thi thành công, vé được trừ trên RAM và được cấp **TTL là 600 giây (10 phút)**.
- **Nếu thanh toán thành công trong 10 phút:** Webhook PayOS xác nhận -> backend xóa key giữ chỗ trên Redis và lưu trạng thái `PAID` vĩnh viễn vào CSDL PostgreSQL.
- **Nếu quá 10 phút không thanh toán:**  
  1. Key giữ chỗ trên Redis tự động hết hạn và biến mất.
  2. RabbitMQ Dead Letter Exchange (DLX) hoặc cron worker phát hiện đơn hàng ở trạng thái `PENDING` quá hạn -> thực hiện script cộng lại tồn kho vào `tier:stock:123` để nhường vé cho người khác.

---

## 5) Câu Hỏi Phỏng Vấn & Cách Trả Lời
1. *Nếu Redis bị sập thì số lượng vé tồn kho có bị mất không?*
   - Tixora bật cấu hình lưu trữ bền vững **AOF (Append-Only File)** với `appendfsync everysec` và **RDB Snapshot**. Khi Redis khởi động lại, dữ liệu được phục hồi gần như nguyên vẹn. Ngoài ra, trước đợt mở bán, tồn kho được nạp (warm up) từ PostgreSQL lên Redis.
2. *Làm sao bạn chứng minh hệ thống không bán lố vé?*
   - Em đã viết kịch bản kiểm thử tải cao bằng **k6** (`testing/load/k6-oversell-check.js`), mô phỏng **1.000 người dùng ảo đồng thời tranh mua 50 vé**. Kết quả kiểm thử đạt 100% Zero-Oversell: Đúng 50 vé được giữ thành công, 950 request bị từ chối an toàn với mã lỗi tồn kho.
