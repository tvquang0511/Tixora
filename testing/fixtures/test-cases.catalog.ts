/**
 * BẢNG TỪ ĐIỂN ĐẶC TẢ NGHIỆP VỤ KIỂM THỬ TIXORA (QA TEST SPECIFICATIONS CATALOG)
 * Chuẩn hóa theo tiêu chuẩn kiểm thử quốc tế ISO/IEC/IEEE 29119.
 * Mỗi mã Test Case (TC-xxx) chứa đầy đủ thông tin: Phân hệ, Tiền điều kiện, Các bước, Kết quả mong đợi.
 */

export interface TestSpecification {
  module: string;
  preconditions: string;
  steps: string;
  expected: string;
}

export const TEST_SPECIFICATIONS: Record<string, TestSpecification> = {
  'TC-AUTH-01': {
    module: 'Authentication & Security',
    preconditions: 'Khách hàng chưa đăng nhập hệ thống, truy cập từ trình duyệt web',
    steps: '1. Điều hướng tới /login\n2. Kiểm tra input Email (#email)\n3. Kiểm tra input Password (#password)\n4. Kiểm tra nút Đăng nhập và liên kết Đăng ký',
    expected: 'Form đăng nhập hiển thị đầy đủ các trường, chuẩn thiết kế, không lỗi vỡ giao diện',
  },
  'TC-AUTH-02': {
    module: 'Authentication & Security',
    preconditions: 'Đang mở form đăng nhập tại /login',
    steps: '1. Nhập email hợp lệ từ test data\n2. Nhập mật khẩu cố tình sai lệch\n3. Nhấp nút Đăng nhập',
    expected: 'Hệ thống từ chối đăng nhập, hiển thị Toast cảnh báo lỗi rõ ràng và giữ nguyên form',
  },
  'TC-AUTH-03': {
    module: 'Authentication & Security',
    preconditions: 'Người dùng ở trạng thái khách vãng lai (chưa có session/token)',
    steps: '1. Nhập trực tiếp URL trang bảo vệ /my-tickets trên thanh địa chỉ',
    expected: 'Route Guard của Next.js kích hoạt chặn truy cập, tự động chuyển hướng về /login',
  },
  'TC-AUTH-04': {
    module: 'Authentication & Security',
    preconditions: 'Tài khoản Audience hợp lệ đã tồn tại trên Database',
    steps: '1. Nhập email và mật khẩu tài khoản Audience\n2. Bấm nút Đăng nhập\n3. Chờ xác thực session',
    expected: 'Đăng nhập thành công, token được lưu trữ an toàn, chuyển hướng về Trang chủ kèm trạng thái đã đăng nhập',
  },
  'TC-AUTH-05': {
    module: 'Authentication & Security',
    preconditions: 'Truy cập trang đăng ký tại /register',
    steps: '1. Mở trang đăng ký tài khoản mới\n2. Kiểm tra các ô nhập liệu Họ tên, Email, Mật khẩu',
    expected: 'Giao diện đăng ký hiển thị đầy đủ các trường thông tin bắt buộc',
  },
  'TC-AUTH-06': {
    module: 'Authentication & RBAC',
    preconditions: 'Người dùng sử dụng tài khoản Audience hoặc Organizer',
    steps: '1. Mở Cổng Quản trị Admin Portal (:3002)\n2. Nhập thông tin tài khoản không có quyền Admin/SuperAdmin\n3. Bấm Đăng nhập',
    expected: 'Hàng rào RBAC chặn đứng truy cập, thông báo không có thẩm quyền quản trị sàn, tuyệt đối không vào /dashboard',
  },
  'TC-AUTH-07': {
    module: 'Authentication & RBAC',
    preconditions: 'Tài khoản có quyền Admin/SuperAdmin đã kích hoạt trên Database',
    steps: '1. Mở Admin Portal (:3002)\n2. Nhập thông tin Quản trị viên hợp lệ\n3. Bấm Đăng nhập',
    expected: 'Xác thực thành công, lưu phiên đăng nhập quản trị và chuyển hướng vào Dashboard Cockpit',
  },
  'TC-CAT-01': {
    module: 'Audience Discovery',
    preconditions: 'Cơ sở dữ liệu có ít nhất 1 sự kiện hòa nhạc đã xuất bản (PUBLISHED)',
    steps: '1. Truy cập trang chủ Web App (:3001)\n2. Kiểm tra Header Banner và danh mục concert nổi bật',
    expected: 'Trang chủ tải mượt mà, hiển thị đầy đủ các thẻ sự kiện kèm hình ảnh poster và giá vé khởi điểm',
  },
  'TC-CAT-02': {
    module: 'Audience Discovery',
    preconditions: 'Đang ở trang chủ hoặc trang danh mục sự kiện',
    steps: '1. Nhập từ khóa tìm kiếm vào ô Search\n2. Nhấn Enter để gửi truy vấn lọc',
    expected: 'Danh sách sự kiện tự động cập nhật, hiển thị chính xác các concert có tên khớp với từ khóa',
  },
  'TC-CAT-03': {
    module: 'Audience Discovery',
    preconditions: 'Chọn 1 sự kiện từ trang chủ',
    steps: '1. Nhấp vào card sự kiện\n2. Kiểm tra URL chuyển sang /concerts/:id\n3. Kiểm tra hiển thị thông tin địa điểm, thời gian và bảng hạng vé',
    expected: 'Trang chi tiết tải đầy đủ mô tả, sơ đồ địa điểm và các hạng vé (VIP, Standard) kèm trạng thái còn vé',
  },
  'TC-BOOK-01': {
    module: 'Audience Booking Flow',
    preconditions: 'Khách hàng đã đăng nhập, đang ở trang chi tiết sự kiện',
    steps: '1. Xem danh sách hạng vé còn mở bán\n2. Kiểm tra nút chọn số lượng vé (+ / -) hoặc nút Đặt vé',
    expected: 'Các thành phần chọn vé phản hồi nhạy bén, hiển thị rõ ràng số lượng và tạm tính tổng tiền',
  },
  'TC-BOOK-02': {
    module: 'Audience Booking Flow',
    preconditions: 'Khách hàng đã đăng nhập vào tài khoản',
    steps: '1. Điều hướng tới trang Vé của tôi (/my-tickets)\n2. Kiểm tra danh sách vé điện tử',
    expected: 'Trang hiển thị tiêu đề Vé của tôi, danh sách các vé đã mua kèm mã QR Code kiểm soát vé',
  },
  'TC-BOOK-03': {
    module: 'Audience Booking Flow',
    preconditions: 'Khách hàng đã đăng nhập',
    steps: '1. Truy cập trang Quản lý tài khoản cá nhân (/profile)\n2. Kiểm tra thông tin tài khoản',
    expected: 'Trang thông tin cá nhân tải thành công, hiển thị đầy đủ thông tin người dùng',
  },
  'TC-ORG-01': {
    module: 'Organizer Hub',
    preconditions: 'Đăng nhập bằng tài khoản Ban tổ chức (Organizer)',
    steps: '1. Truy cập /organizer/dashboard\n2. Kiểm tra các thẻ KPI tổng quan',
    expected: 'Giao diện Hub Ban tổ chức tải đầy đủ các thông số tổng quan: sự kiện đang chạy, số vé bán, doanh thu ước tính',
  },
  'TC-ORG-02': {
    module: 'Organizer Hub',
    preconditions: 'Đã đăng nhập tài khoản Ban tổ chức',
    steps: '1. Truy cập /organizer/profile\n2. Kiểm tra thông tin pháp nhân và người đại diện',
    expected: 'Hiển thị chuẩn xác tên đơn vị tổ chức, email liên hệ, số điện thoại và mô tả giới thiệu',
  },
  'TC-ORG-03': {
    module: 'Organizer Hub',
    preconditions: 'Đã đăng nhập tài khoản Ban tổ chức',
    steps: '1. Truy cập mục Quản lý sự kiện (/organizer/events)\n2. Kiểm tra danh sách show diễn',
    expected: 'Bảng sự kiện hiển thị đúng các show do đơn vị này khởi tạo kèm trạng thái kiểm duyệt',
  },
  'TC-ORG-04': {
    module: 'Organizer Hub',
    preconditions: 'Đã đăng nhập tài khoản Ban tổ chức',
    steps: '1. Điều hướng tới trang Tạo sự kiện mới (/organizer/create-event)\n2. Kiểm tra các trường cấu hình',
    expected: 'Form tạo sự kiện hiển thị đầy đủ các trường: Tên sự kiện, Thời gian, Địa điểm, Cấu hình các hạng vé',
  },
  'TC-ORG-05': {
    module: 'Organizer Revenue',
    preconditions: 'Ban tổ chức có sự kiện phát sinh doanh thu bán vé',
    steps: '1. Truy cập Báo cáo doanh thu (/organizer/revenue)\n2. Kiểm tra các thẻ chỉ số tài chính',
    expected: 'Hiển thị rõ ràng Tổng GMV, Tỷ lệ phí sàn 5%, Số tiền thực nhận sau quyết toán và số đơn đã thanh toán',
  },
  'TC-ORG-06': {
    module: 'Organizer Revenue',
    preconditions: 'Đang xem trang báo cáo tài chính BTC',
    steps: '1. Quan sát định dạng các trường tiền tệ\n2. Kiểm tra biểu đồ xu hướng doanh thu',
    expected: 'Các số liệu tài chính được format chuẩn tiền tệ VNĐ và biểu đồ trực quan hóa dữ liệu theo ngày',
  },
  'TC-ADM-01': {
    module: 'Admin Cockpit',
    preconditions: 'Đã đăng nhập tài khoản Quản trị viên cấp cao (Admin)',
    steps: '1. Mở trang Tổng quan (/dashboard) của Admin Portal\n2. Kiểm tra các thẻ KPI Cockpit trung tâm',
    expected: 'Hiển thị tổng thể tình trạng hệ sinh thái: Doanh thu sàn, Số vé bán toàn hệ thống, Số lượng tài khoản người dùng',
  },
  'TC-ADM-02': {
    module: 'Admin Cockpit',
    preconditions: 'Đang ở Admin Portal',
    steps: '1. Kiểm tra Sidebar điều hướng 8 menu chính\n2. Thử nghiệm nhấp chuột chuyển sang các trang con',
    expected: 'Sidebar điều hướng mượt mà, chuyển trang chính xác không xảy ra hiện tượng vỡ layout hay lỗi console',
  },
  'TC-ADM-03': {
    module: 'Admin Management',
    preconditions: 'Đã đăng nhập Admin Portal',
    steps: '1. Truy cập Quản trị sự kiện (/events)\n2. Kiểm tra cột Vé đã bán / Tổng vé',
    expected: 'Cột hiển thị rõ ràng số lượng {sold} / {total} vé kèm thanh tiến độ phân trăm lấp đầy',
  },
  'TC-ADM-04': {
    module: 'Admin Management',
    preconditions: 'Đã đăng nhập Admin Portal',
    steps: '1. Truy cập mục Quản lý người dùng (/users)\n2. Kiểm tra phân loại các vai trò nhân sự',
    expected: 'Bảng người dùng hiển thị danh sách tài khoản kèm nhãn huy hiệu vai trò: SuperAdmin, Admin, Organizer, Checker',
  },
  'TC-ADM-05': {
    module: 'Admin Management',
    preconditions: 'Đã đăng nhập Admin Portal',
    steps: '1. Truy cập Báo cáo tài chính toàn sàn (/revenue)\n2. Kiểm tra thống kê doanh số GMV',
    expected: 'Hiển thị biểu đồ xu hướng doanh thu toàn nền tảng và bảng xếp hạng các Ban tổ chức có doanh thu cao nhất',
  },
  'TC-ADM-06': {
    module: 'Admin Management',
    preconditions: 'Đã đăng nhập Admin Portal',
    steps: '1. Truy cập Quản trị đối soát & quyết toán (/settlements)\n2. Kiểm tra các quỹ bảo chứng Escrow',
    expected: 'Hiển thị trang Đối soát & Quyết toán Ban tổ chức, các thẻ Sẵn sàng giải ngân và Quỹ bảo chứng Escrow',
  },
};
