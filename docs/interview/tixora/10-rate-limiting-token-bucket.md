# Phòng Thủ Quá Tải — Thuật Toán Token Bucket Rate Limiting

## 1) Vì Sao Cần Rate Limiting Trong Hệ Thống Bán Vé?
Trong các sự kiện "cháy vé", hệ thống đối mặt với 2 nguy cơ tấn công lớn:
1. **Bot cào vé tự động (Automated Scalper Bots):** Hàng chục script tự động gửi hàng ngàn request mỗi giây nhằm chiếm giữ toàn bộ vé VIP để bán lại ngoài chợ đen.
2. **Hành vi người dùng hoảng loạn:** Hàng chục ngàn người liên tục bấm F5 hoặc spam nút "Mua vé" khi thấy màn hình quay chậm, gây hiệu ứng DDoS tự phát lên máy chủ API.

---

## 2) Thuật Toán Token Bucket (Chiếc Thùng Chứa Token)
Khác với thuật toán Fixed Window (cửa sổ cố định) dễ bị dồn tải ở thời điểm giao thoa giữa 2 cửa sổ thời gian, **Token Bucket** cho phép xử lý lưu lượng bùng nổ (Burst traffic) một cách mượt mà và công bằng.

### Nguyên Lý:
1. Một "thùng" (Bucket) có sức chứa tối đa là $C$ tokens (Capacity).
2. Token được bổ sung vào thùng với tốc độ cố định $R$ tokens mỗi giây (Refill Rate).
3. Mỗi khi có 1 request gửi tới:
   - Nếu trong thùng còn $\ge 1$ token: Rút 1 token ra và cho phép request đi tiếp.
   - Nếu thùng rỗng (hết token): Request lập tức bị từ chối với mã lỗi `HTTP 429 Too Many Requests`.

---

## 3) Triển Khai Trong Tixora Bằng Redis
Tixora sử dụng Redis để lưu trữ trạng thái token của từng client (theo IP hoặc User ID):
- **Hiệu năng cao:** Tính toán số token được nạp thêm dựa trên độ chênh lệch thời gian (`current_time - last_refill_time`) mà không cần chạy cron job ngầm liên tục nạp token.
- **Fail-Open Strategy:** Nếu Redis gặp sự cố kết nối, Rate Limiter được cấu hình ở chế độ **Fail-Open** (cho phép request đi qua kèm log cảnh báo) để không làm gián đoạn việc mua vé của khán giả bình thường.

---

## 4) Headers Phản Hồi Chuẩn Cấp Doanh Nghiệp
Khi một request đi qua Gateway/Guard, hệ thống trả về các headers chuẩn:
- `X-RateLimit-Limit`: Giới hạn tối đa trong chu kỳ.
- `X-RateLimit-Remaining`: Số lượng token còn lại.
- `Retry-After`: Số giây client cần chờ trước khi thử gửi lại request nếu bị dính lỗi 429.

---

## 5) Câu Hỏi Phỏng Vấn & Cách Trả Lời
1. *Bạn áp dụng Rate Limiting theo địa chỉ IP hay theo User ID?*
   - Cả hai lớp: Với các endpoint công khai chưa đăng nhập (Xem sự kiện, Đăng nhập), hệ thống giới hạn theo IP để chặn Bot. Với các endpoint nhạy cảm (Giữ vé, Thanh toán), hệ thống áp dụng theo `User ID` để công bằng cho các khán giả cùng ngồi chung mạng quán cafe hoặc văn phòng (trùng IP Public).
2. *Làm sao bạn kiểm chứng Rate Limiter hoạt động đúng?*
   - Em đã viết kịch bản test k6 (`testing/load/k6-ticketing-flow.js`) bắn liên tục 200 request trong 1 giây từ một client ảo. Kết quả kiểm thử ghi nhận chính xác: Sau khi đạt ngưỡng cho phép, server phản hồi `HTTP 429` với header `Retry-After`.
