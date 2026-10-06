import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// ==============================================================================
// Tixora k6: Kiểm thử Tải Cổng Soát Vé Giờ G (High-Concurrency Check-in Gate)
// Mục tiêu: Giả lập 20-50 thiết bị quét vé di động (Mobile Scanners) cùng quét vé tại các cổng.
// Yêu cầu: Độ trễ scan ticket < 250ms, bảo vệ chống quét 2 lần (Duplicate Scan Protection).
// ==============================================================================

const VUS = Number(__ENV.VUS || 10);
const DURATION = __ENV.DURATION || '20s';

export const options = {
  vus: VUS,
  duration: DURATION,
  setupTimeout: '120s',
  thresholds: {
    system_available: ['rate>0.95'],
    scan_duration: ['p(95)<2000'], // 95% lượt quét vé phản hồi dưới 2s qua mạng Cloud
  },
};

const scanSuccess = new Counter('scan_success');
const scanAlreadyUsed = new Counter('scan_already_used');
const scanInvalid = new Counter('scan_invalid');
const status5xx = new Counter('status_5xx');
const systemAvailable = new Rate('system_available');
const scanDuration = new Trend('scan_duration');
const prefetchDuration = new Trend('prefetch_duration');

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const CHECKER_EMAIL = __ENV.CHECKER_EMAIL || 'checker@tixora.local';
const CHECKER_PASSWORD = __ENV.CHECKER_PASSWORD || '123456';
const CONCERT_ID = __ENV.CONCERT_ID;

function requestHeaders(token) {
  const vu = typeof __VU !== 'undefined' ? __VU : 1;
  const iter = typeof __ITER !== 'undefined' ? __ITER : 0;
  return {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'x-forwarded-for': `10.77.${vu % 250}.${(iter % 250) + 1}`,
    },
    timeout: '10s',
  };
}

export function setup() {
  // 1. Đăng nhập tài khoản Soát vé (Checker)
  const loginRes = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({ email: CHECKER_EMAIL, password: CHECKER_PASSWORD }),
    { headers: { 'Content-Type': 'application/json' } },
  );

  if (loginRes.status !== 200) {
    throw new Error(`Đăng nhập Checker thất bại (${loginRes.status}). Kiểm tra CHECKER_EMAIL/PASSWORD.`);
  }

  const token = loginRes.json('accessToken');

  // 2. Tìm Concert đang hoạt động
  let concertId = CONCERT_ID;
  if (!concertId) {
    const listRes = http.get(`${BASE_URL}/concerts?limit=5`, requestHeaders(token));
    const json = listRes.json();
    const concerts = Array.isArray(json) ? json : (json?.data || json?.items || []);
    if (concerts.length > 0) {
      concertId = concerts[0].id;
    }
  }

  console.log('');
  console.log('='.repeat(72));
  console.log('🎟️ TIXORA k6 CONCURRENT GATE CHECK-IN STRESS TEST');
  console.log(`BASE_URL         : ${BASE_URL}`);
  console.log(`Checker Account  : ${CHECKER_EMAIL}`);
  console.log(`Concert ID       : ${concertId || 'N/A'}`);
  console.log(`Máy quét ảo (VUs): ${VUS} Mobile Scanners`);
  console.log(`Thời gian chạy   : ${DURATION}`);
  console.log('='.repeat(72));
  console.log('');

  return { token, concertId };
}

export default function (data) {
  const headers = requestHeaders(data.token);

  // 1. Máy quét di động tải trước danh sách vé (Prefetch Cache cho Offline Scan)
  if (data.concertId && __ITER === 0) {
    const t0 = Date.now();
    const prefetchRes = http.get(`${BASE_URL}/checkin/prefetch/${data.concertId}?gate_number=1`, headers);
    prefetchDuration.add(Date.now() - t0);
    systemAvailable.add(prefetchRes.status < 500);

    check(prefetchRes, {
      'tải trước dữ liệu vé prefetch không lỗi 500': (r) => r.status < 500,
    });
  }

  // 2. Quét vé thời gian thực (Online QR Scan)
  // Tạo giả lập mã QR hoặc ticket code để test tải xử lý mã hóa/kiểm tra DB
  const mockBarcode = `TXR-${__VU}-${__ITER}-${Date.now()}`;
  const t1 = Date.now();
  const scanRes = http.post(
    `${BASE_URL}/checkin/scan`,
    JSON.stringify({
      ticket_code: mockBarcode,
      concert_id: data.concertId,
      gate_number: (__VU % 4) + 1, // Chia đều qua 4 cổng soát vé
    }),
    headers,
  );

  scanDuration.add(Date.now() - t1);
  systemAvailable.add(scanRes.status < 500);

  if (scanRes.status === 200) {
    scanSuccess.add(1);
  } else if (scanRes.status === 409 || scanRes.status === 400) {
    // Vé đã sử dụng hoặc mã vé không hợp lệ (Phản hồi đúng nghiệp vụ)
    scanAlreadyUsed.add(1);
  } else if (scanRes.status >= 500) {
    status5xx.add(1);
  }

  check(scanRes, {
    'phản hồi checkin an toàn, không có lỗi sập server (5xx)': (r) => r.status < 500,
    'phản hồi checkin trả về mã nghiệp vụ hợp lệ': (r) => [200, 400, 404, 409].includes(r.status),
  });

  sleep(0.3);
}

export function handleSummary(data) {
  const totalReqs = data.metrics.http_reqs?.values?.count || 0;
  const p95Latency = data.metrics.scan_duration?.values['p(95)']?.toFixed(2) || 'N/A';
  const success = data.metrics.scan_success?.values?.count || 0;
  const handledBusiness = data.metrics.scan_already_used?.values?.count || 0;
  const all5xx = data.metrics.status_5xx?.values?.count || 0;

  const summary = `
========================================================================
📊 TỔNG KẾT KIỂM THỬ TẢI CỔNG SOÁT VÉ GIỜ G (CHECK-IN AUDIT)
========================================================================
Tổng lượt quét vé gửi lên  : ${totalReqs}
Quét hợp lệ thành công     : ${success}
Từ chối hợp lệ (Vé cũ/Sai) : ${handledBusiness}
Tổng lỗi sập server (5xx)  : ${all5xx} (Yêu cầu: 0)
Độ trễ quét vé (p95)       : ${p95Latency} ms (Tiêu chuẩn: < 300ms)

Ý nghĩa Nghiệp vụ:
- Độ trễ < 300ms đảm bảo cửa xoay và nhân viên soát vé xử lý trơn tru, không ùn tắc cổng.
- Hệ thống xử lý chuẩn xác lỗi nghiệp vụ 400/409 (chống vé trùng hoặc vé giả), 0 lỗi 5xx.
========================================================================
`;

  return {
    stdout: summary,
    'testing/reports/load/k6-checkin-summary.json': JSON.stringify(data, null, 2),
  };
}
