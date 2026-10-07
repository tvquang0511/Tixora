# Frontend — Next.js 16 App Router & Tailwind CSS v4

## 1) Vì Sao Chọn Next.js 16 App Router Cho Tixora?
Tixora sở hữu 2 cổng Web độc lập:
1. `apps/web-app` (`:3001`): Web Khách Hàng (Audience Portal) — Cần tối ưu SEO, tốc độ tải trang ban đầu (First Contentful Paint) và giao diện mua vé Flash-Sale mượt mà.
2. `apps/admin-app` (`:3002`): Admin & Organizer Portal — Hệ thống bảng biểu, biểu đồ phân tích doanh thu thời gian thực và quản trị 5 cấp RBAC.

### Ưu Điểm Của Next.js 16 App Router:
- **Server Components (RSC):** Render trang chủ và danh sách concert trực tiếp trên server, giảm đáng kể dung lượng JavaScript tải về trình duyệt của khách hàng, tối ưu điểm Google Lighthouse và SEO.
- **Client Components (`'use client'`):** Chỉ sử dụng tại những vị trí cần tương tác động cao như: Bộ đếm ngược 10 phút giữ vé, form chọn số lượng vé, trình quét camera, widget thanh toán VietQR.
- **Streaming & Suspense:** Cho phép hiển thị khung giao diện (Skeleton) ngay lập tức trong khi dữ liệu chi tiết concert đang được tải.

---

## 2) Thiết Kế Giao Diện & HTCAA Design System
- **Tailwind CSS v4:** Sử dụng engine mới nhất của Tailwind, tối ưu hóa CSS bundle siêu nhỏ và hỗ trợ styling hiện đại.
- **Audience Web:** Tông màu tối hiện đại (Dark Mode), nhấn mạnh vào hình ảnh nghệ sĩ, banner concert và trải nghiệm săn vé hồi hộp, kịch tính.
- **Admin Portal (HTCAA Design System):** Chuẩn thiết kế doanh nghiệp với tông màu xanh Navy/Sky chuyên nghiệp, bố cục phân tầng trực quan, hệ thống bảng biểu và bộ lọc dữ liệu đa chiều.

---

## 3) Quản Lý State & Trải Nghiệm Giữ Vé Flash-Sale (UX Optimization)
- **Đồng Hồ Đếm Ngược 10 Phút:** Được đồng bộ mốc thời gian hết hạn (`expiresAt`) từ server thay vì dựa vào đồng hồ máy khách để tránh việc người dùng chỉnh lùi giờ trên máy tính cá nhân.
- **Optimistic UI:** Khi khách hàng bấm giữ vé, giao diện lập tức chuyển sang trạng thái chờ với hiệu ứng loading tinh tế, vô hiệu hóa nút bấm để chống double-click trước khi nhận phản hồi từ server.

---

## 4) Câu Hỏi Phỏng Vấn & Cách Trả Lời
1. *Khi nào bạn dùng Server Component và khi nào dùng Client Component?*
   - Mặc định toàn bộ component là Server Component (dành cho fetch data, SEO, render tĩnh). Chỉ đánh dấu `'use client'` khi component có sử dụng React Hooks (`useState`, `useEffect`), event listener (`onClick`, `onChange`) hoặc các API chỉ có ở trình duyệt (LocalStorage, Camera).
2. *Làm sao để người dùng chia sẻ link vé cho bạn bè mà không bị lỗi 404?*
   - Sử dụng Dynamic Routes của Next.js App Router (ví dụ: `app/events/[slug]/page.tsx` và `app/my-tickets/[ticketId]/page.tsx`), hỗ trợ Server-Side Rendering sinh trang động theo tham số đường dẫn.
