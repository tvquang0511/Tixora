# HỆ THỐNG THIẾT KẾ GIAO DIỆN TIXORA ADMIN (HTCAA DESIGN SYSTEM)

> **Tài liệu chuẩn mực thiết kế (Design Specification & Style Guide)**  
> Áp dụng bắt buộc cho toàn bộ phân hệ quản trị (Admin App) của nền tảng bán vé trực tuyến **Tixora**, đồng bộ hóa 100% theo ngôn ngữ thiết kế của `htcaa-mini-app`.

---

## 1. Triết lý Thiết kế (Design Philosophy)

1. **Gam màu xanh doanh nghiệp (Unified Enterprise Blue)**:
   - Toàn bộ giao diện sử dụng sắc thái xanh hoàng gia / ngân hàng hiện đại (Coinbase & Helpdesk Blue), kết hợp với bảng màu xám trung tính (Slate Neutral Ramp).
   - **Tuyệt đối không dùng màu sắc lòe loẹt, gradient cầu vồng, hoặc mỗi trang một màu ngẫu hứng**. Mọi điểm nhấn thị giác phải phục vụ mục đích phân cấp thông tin và định hướng thao tác của người dùng.
2. **Mật độ thông tin cao (High Density & Scannability)**:
   - Thiết kế dành cho người điều hành hệ thống: lề vừa phải, phông chữ 12–14px sắc nét, số liệu tài chính và mã sự kiện định dạng `font-variant-numeric: tabular-nums` và `font-mono`.
3. **Tiêu chuẩn hóa Primitives (Zero Ad-hoc Styles)**:
   - Mọi nút, thẻ, bảng, thanh tìm kiếm đều sử dụng lớp CSS hoặc component có sẵn, không tự ý viết các class tiện ích rời rạc gây lệch pha trải nghiệm.

---

## 2. Bảng Mã Màu Tiêu Chuẩn (Color Tokens)

| Vai trò | Mã màu HEX / HSL | Ứng dụng cụ thể |
| :--- | :--- | :--- |
| **Sidebar Brand Navy** | `#0e54a3` | Nền thanh điều hướng bên trái (Sidebar). Đổ bóng `4px 0 24px -8px rgba(14, 84, 163, 0.35)`. |
| **Primary Brand Blue** | `#0052ff` (`#2563eb`) | Nút chính (`btn-primary`), đường kẻ tiêu đề H1, viền đáy bảng (`2.5px solid #0052ff`), vạch chỉ số lượng (`bar-fill`). |
| **Primary Hover** | `#003ecc` (`#1d4ed8`) | Trạng thái hover của nút bấm và liên kết chính. |
| **Active Notch Accent** | `#e62e2e` | Vạch chỉ mục màu đỏ cảnh báo (3px x 20px bo tròn) đặt ở sát mép trái menu item đang được chọn. |
| **Nav Group Label** | `#7dd3fc` | Tiêu đề nhóm menu (uppercase, font 10.5px bold, tracking 0.09em). |
| **Page Background** | `#f8fafc` | Nền tổng thể của ứng dụng. |
| **Surface (Card / Table)** | `#ffffff` | Nền của thẻ, bảng dữ liệu, popover, modal. |
| **Header Table / Sub-bg** | `#f1f5f9` | Nền của dòng tiêu đề bảng `<th>` và nút chuyển chế độ `Segmented`. |
| **Border Neutral** | `#e2e8f0` | Đường viền ngăn cách giữa các khối, viền ô nhập liệu, viền thẻ card. |
| **Heading Text** | `#0f172a` / `#0a0b0d` | Màu chữ của tiêu đề chính, tên sự kiện, số liệu chính. |
| **Muted Text** | `#64748b` (`#5b616e`) | Màu chữ chú thích phụ (`.sub`, `.row-sub`, thời gian, địa điểm phụ). |
| **Success Soft** | Chữ `#059669` / Nền `#e6f7f0` | Trạng thái hoạt động, vé miễn phí `0đ (Miễn phí)`, check-in thành công. |
| **Warning Soft** | Chữ `#d97706` / Nền `#fef3c7` | Trạng thái chờ duyệt (`PENDING_REVIEW`), tạm ngưng bán vé. |
| **Danger Soft** | Chữ `#cf202f` / Nền `#fde8e9` | Trạng thái đã hủy (`CANCELLED`), từ chối, nút xóa dữ liệu nguy hiểm. |

---

## 3. Cấu Trúc Khung Quản Trị (Admin Shell)

### 3.1. Sidebar (Thanh Điều Hướng)
- **Kích thước**: Rộng `250px` khi mở rộng, `64px` khi thu gọn (Icon-only Rail Mode).
- **Màu nền**: `#0e54a3` đồng nhất trên toàn bộ chiều cao màn hình.
- **BrandMark (Logo + Wordmark)**:
  - Icon: Khối vuông `32x32px`, bo góc `8px`, nền trắng `#ffffff`, chứa icon vé màu `#0e54a3`.
  - Wordmark: Chữ `TIXORA` font-black 24px trắng sáng, bên dưới là phụ đề `QUẢN TRỊ NỀN TẢNG` font 10px bold uppercase tracking 0.12em màu `rgba(255, 255, 255, 0.75)`.
- **Nhóm danh mục (Nav Groups)**:
  - Header: Chữ `#7dd3fc`, 10.5px, bold, uppercase, tracking `0.09em`.
  - Bên trái có icon nhóm (13px), bên phải có mũi tên `ChevronDown` (12px).
- **Mục điều hướng (Nav Items)**:
  - **Trạng thái thường**: Chữ trắng `rgba(255,255,255,0.85)`, icon nằm trong chip vuông nhỏ `bg-white/10 text-white`.
  - **Trạng thái Active**: Nền trắng ngà `rgba(255,255,255,0.92)`, chữ đổi sang `#0e54a3`, icon chip đổi sang `bg-[#0e54a3]/10 text-[#0e54a3]`.
  - **Dấu nhận diện Active (Notch)**: Một vạch đứng màu đỏ `#e62e2e`, kích thước `width: 3px; height: 20px; border-radius: 999px`, định vị tuyệt đối ở sát lề trái (`left: 0, top: 50%, -translate-y-1/2`).
  - **Huy hiệu số đếm**: Bo tròn `rounded-full`, padding `2px 8px`, nền `bg-white/20` (inactive) hoặc `bg-[#0e54a3]/15` (active).
- **Chân Sidebar**:
  - Nút chuyển đổi `« Thu gọn` / `»` nằm cố định ở đáy thanh sidebar.

---

## 4. Tiêu Đề Trang & Huy Hiệu Đếm (Page Header)

Mỗi trang chức năng bắt buộc có tiêu đề dính cố định (`.head.stickyhead`) với cấu trúc:

```tsx
<div className="head stickyhead flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
  {/* Khối bên trái: Tên trang & Huy hiệu số lượng */}
  <div className="flex items-center gap-3 flex-wrap">
    <h1 className="htcaa-h1 m-0">Sự kiện</h1>
    <span className="htcaa-badge-count-pill">
      {totalItems} sự kiện · {activeItems} đang hoạt động
    </span>
  </div>

  {/* Khối bên phải: Hành động cấp trang */}
  <div className="head-actions flex items-center gap-2 flex-wrap">
    <button className="btn">
      <Clock size={14} className="text-slate-500" />
      <span>Cài đặt</span>
    </button>
    <button className="btn">
      <RotateCw size={14} />
      <span>Tải lại</span>
    </button>
    <div className="htcaa-segmented">
      <button className="htcaa-segmented-btn active"><BarChart2 size={14} /> Danh sách</button>
      <button className="htcaa-segmented-btn"><Layers size={14} /> Bảng</button>
    </div>
    <Link href="/create" className="btn btn-primary">
      <Plus size={14} />
      <span>Tạo mới</span>
    </Link>
  </div>
</div>
```

### Chi tiết CSS của Tiêu đề H1 (`.htcaa-h1`):
- `font-size: 24px; font-weight: 800; color: #0052ff; position: relative; padding-left: 16px;`
- Thanh viền trang trí `::before`: `position: absolute; left: 0; top: 2px; bottom: 2px; width: 5px; background: linear-gradient(to bottom, #0052ff, #00c6ff); border-radius: 99px;`

### Chi tiết CSS của Huy hiệu đếm (`.htcaa-badge-count-pill`):
- Bo tròn `999px` dạng viên thuốc (pill badge).
- Nền: `rgba(0, 82, 255, 0.08)`, chữ: `#0052ff` 13px font 700, viền: `1px solid rgba(0, 82, 255, 0.2)`.

---

## 5. Quy Chuẩn Nút Bấm (Button Anatomy)

Ứng dụng sử dụng chuẩn 4 biến thể (Helpdesk 4-variant standard), tuyệt đối không sáng tạo thêm các biến thể dị biệt:

| Biến thể | Class CSS | Thuộc tính giao diện | Cách dùng |
| :--- | :--- | :--- | :--- |
| **Mặc định / Phụ (Default/Secondary)** | `.btn` hoặc `.btn-secondary` | Nền trắng `#ffffff`, viền `1.5px solid #e2e8f0`, chữ `#0a0b0d` 13px font 600, bo góc 8px. Hover: nền `#f8fafc`, viền `#cbd5e1`. | Dùng cho mọi nút phụ: Tải lại, Xuất Excel, Hủy bỏ, Cài đặt... |
| **Nút chính (Primary)** | `.btn.btn-primary` | Nền `#0052ff`, viền `1.5px solid #0052ff`, chữ trắng `#ffffff` font 700, đổ bóng `0 1px 3px rgba(0, 82, 255, 0.25)`. Hover: `#003ecc`. | Dùng cho hành động chủ đạo duy nhất trên màn hình: Tạo sự kiện, Lưu cấu hình, Xác nhận thanh toán... |
| **Nút trong suốt (Plain/Ghost)** | `.btn.btn-plain` | Không viền, nền trong suốt, chữ `#5b616e`. Hover: nền `#f1f1f4`, chữ đen. | Dùng cho thao tác phụ trong bảng dữ liệu hoặc popover. |
| **Nút cảnh báo (Danger)** | `.btn.btn-danger` | Nền đỏ `#cf202f`, viền `#cf202f`, chữ trắng. | Xóa bản ghi, Hủy vé, Khóa tài khoản. |

### Kích thước nút:
- **Chuẩn (md)**: padding `8px 14px`, text `13px`, khoảng cách icon `gap: 7px`, kích thước icon `14-15px`.
- **Nhỏ (sm)**: class `.btn-sm`, padding `6px 12px`, text `12px`.
- **Nút icon đơn vuông**: class `.btn-icon`, kích thước `32x32px`.

---

## 6. Định Dạng Thẻ (Card Format)

Mọi khối hiển thị nội dung dạng thẻ phải áp dụng class `.card`:
```css
.card {
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 16px 20px;
  background: #ffffff;
  box-shadow: 0 1px 3px rgba(10, 11, 13, 0.01), 0 8px 24px rgba(10, 11, 13, 0.03);
}
```

- Không dùng viền đen gắt hoặc góc bo quá nhỏ (dưới 8px) hay quá to (trên 20px).
- Bố cục lưới thẻ hai cột: Sử dụng class `.grid-2` (`grid-template-columns: 1.5fr 1fr; gap: 16px;`).
- Cột bên trái cố định khi cuộn: Sử dụng class `.rail` (`position: sticky; top: 78px;`).

---

## 7. Bảng Dữ Liệu Chuẩn (Data Table Anatomy)

Khung bảng dữ liệu HTCAA là thành phần quan trọng nhất trong việc quản trị dữ liệu. Bắt buộc bao gồm các đặc điểm sau:

### 7.1. Cấu trúc khung và Header:
- Bao bọc trong `<div className="htcaa-table-wrap">`.
- Header `<th>`:
  - Nền `#f1f5f9 !important`, chữ `#0f172a !important`, font 700 uppercase, size 12px, letter-spacing `0.06em`.
  - **Đường viền đáy xanh đặc trưng**: `border-bottom: 2.5px solid #0052ff !important`.

### 7.2. Hàng dữ liệu và Hiệu ứng tương tác:
- Thẻ `<tr className="row-click group">`:
  - Hover toàn hàng: Nền chuyển nhẹ sang `rgba(0, 82, 255, 0.03)`.
  - Khi hover, ô đầu tiên (`td:first-child`) hiển thị dải màu xanh hoàng gia ở mép trái: `box-shadow: inset 4px 0 0 #0052ff !important`.
- **Cột Tên Sự kiện / Đối tượng**:
  - Tên chính: Chữ đậm `#0f172a`, đổi màu `#0052ff` khi hover hàng.
  - Mã định danh bên dưới: Font `mono` màu xanh `#0052ff` cỡ 11px, ví dụ: `TIX-84A91B02`.
- **Cột Trạng thái**:
  - Sử dụng `<StatusBadge status={...} variant="concert|order|user" />` bo tròn `rounded-full` với chấm trạng thái nhỏ ở trước.
- **Cột Giá vé**:
  - Vé miễn phí: Chữ màu xanh lục `#059669` font 700 (`0đ (Miễn phí)`).
  - Vé tính phí: Chữ màu xanh dương `#2563eb` font 700 (`150.000 đ`).
- **Cột Sức chứa & Đăng ký**:
  - Dòng số lượng: `15/50 chỗ` (tabular-nums).
  - **Thanh đo tiến trình (.cap-meter)**: Chiều rộng 72px, cao 5px, bo tròn 3px, nền `#e2e8f0`, thanh màu lấp đầy `.bar-fill` màu `#0052ff`.
  - Dòng xác nhận bên dưới: `15 xác nhận` màu xám `#64748b` cỡ 11.5px.
- **Cột Điều hướng / Thao tác**:
  - Mũi tên `ChevronRight` màu xám mờ `#94a3b8`, khi hover chuyển sang xanh `#0052ff` và trượt nhẹ sang phải 2px.

---

## 8. Thanh Lọc & Điều Khiển (Filters & Toolbar)

Bao gồm 2 hàng phân lớp rõ ràng:

1. **Hàng tìm kiếm & Phân trang**:
   - Ô tìm kiếm `.search-box`: Chiều cao 38px, viền 1px, bo góc 8px. Icon kính lúp bên trái, nút '✕' xóa nhanh bên phải.
   - Dropdown số dòng `.select-trigger`: `10 dòng/trang`, `20 dòng/trang`, `50 dòng/trang`.
2. **Hàng phân loại trạng thái (Subtitle Bar)**:
   - Bên trái: Tiêu đề phụ `.sub` ("Danh sách sự kiện.").
   - Bên phải: Nhãn nhãn hoa `.over` ("TRẠNG THÁI") đi kèm dropdown `.select-trigger` ("Tất cả trạng thái", "Đang mở bán", "Chờ duyệt"...).

---

## 9. Phân Trang (Pagination)

- Thành phần `<Pagination />` đồng bộ:
  - Nút trang hiện tại: Nền xanh `#0052ff`, chữ trắng `#ffffff`, bo tròn 8px.
  - Các nút trang khác: Nền trắng, viền `#e2e8f0`, chữ xám `#334155`. Hover: nền `#f8fafc`, viền `#cbd5e1`.
  - Hiển thị văn bản tóm tắt: `Trang X trên Y (Tổng: Z bản ghi)`.

---

## 10. Checklist Kiểm Duyệt Trước Khi Hoàn Tất Giao Diện (Pre-flight QA)

- [ ] Toàn bộ trang đã kế thừa đúng `AdminShell` (nền sidebar `#0e54a3`, logo trắng, vạch đỏ active notch)?
- [ ] Tiêu đề trang sử dụng `.htcaa-h1` với vạch gradient xanh ở mép trái?
- [ ] Số lượng tổng quan đặt trong `.htcaa-badge-count-pill` bo tròn pill?
- [ ] Tất cả nút bấm đều dùng `.btn` hoặc `.btn.btn-primary` (không dùng nút màu ngẫu hứng)?
- [ ] Bảng dữ liệu có viền đáy header `2.5px solid #0052ff`?
- [ ] Hàng bảng có hiệu ứng `.row-click` (vạch xanh `inset 4px 0 0 #0052ff`) khi hover?
- [ ] Cột số lượng/sức chứa có thanh `.cap-meter` hiển thị tỷ lệ lấp đầy?
- [ ] Lệnh `npm run build` chạy thành công với 0 lỗi TypeScript và 0 lỗi cú pháp?
