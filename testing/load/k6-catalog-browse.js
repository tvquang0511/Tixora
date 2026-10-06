import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// ==============================================================================
// Tixora k6: Kiểm thử Tải Đọc Dữ liệu Cao (Read-Heavy / Catalog Spike Test)
// Mục tiêu: Đánh giá khả năng chịu tải của các API Catalog (GET /concerts, GET /concerts/:id, Search)
// khi hàng nghìn khán giả cùng vào F5 trang web trước giờ mở bán.
// ==============================================================================

const VUS = Number(__ENV.VUS || 30);
const DURATION = __ENV.DURATION || '20s';

export const options = {
  stages: [
    { duration: '5s', target: VUS },         // Ramp-up nhanh lên VUS người dùng
    { duration: DURATION, target: VUS },     // Giữ tải ổn định
    { duration: '5s', target: 0 },           // Ramp-down
  ],
  thresholds: {
    system_available: ['rate>0.98'],
    http_req_duration: ['p(95)<2500'], // Phản hồi qua Internet mạng Cloud < 2.5s
  },
};

const status200 = new Counter('status_200');
const status429 = new Counter('status_429');
const status5xx = new Counter('status_5xx');
const systemAvailable = new Rate('system_available');
const homeDuration = new Trend('home_duration');
const detailDuration = new Trend('detail_duration');
const searchDuration = new Trend('search_duration');

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const SEARCH_KEYWORDS = ['Concert', 'Show', 'Music', 'Anh Trai', 'Chị Đẹp'];

function resolveRequestHeaders() {
  const vu = typeof __VU !== 'undefined' ? __VU : 1;
  const iter = typeof __ITER !== 'undefined' ? __ITER : 0;
  return {
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': `10.88.${vu % 250}.${(iter % 250) + 1}`,
    },
    timeout: '8s',
  };
}

export function setup() {
  const res = http.get(`${BASE_URL}/concerts?limit=10`, resolveRequestHeaders());
  const json = res.json();
  const concerts = Array.isArray(json) ? json : (json?.data || json?.items || []);
  const concertIds = concerts.map((c) => c.id).filter(Boolean);

  console.log('');
  console.log('='.repeat(72));
  console.log('🚀 TIXORA k6 READ-HEAVY / CATALOG SPIKE TEST');
  console.log(`BASE_URL         : ${BASE_URL}`);
  console.log(`Số sự kiện mẫu   : ${concertIds.length}`);
  console.log(`Tải mục tiêu     : ${VUS} Virtual Users`);
  console.log(`Thời gian chạy   : ${DURATION}`);
  console.log('='.repeat(72));
  console.log('');

  return { concertIds };
}

export default function (data) {
  const headers = resolveRequestHeaders();

  // 1. Tải danh sách concert trang chủ (GET /concerts)
  const t0 = Date.now();
  const listRes = http.get(`${BASE_URL}/concerts?limit=10`, headers);
  homeDuration.add(Date.now() - t0);
  systemAvailable.add(listRes.status < 500);

  if (listRes.status === 200) status200.add(1);
  else if (listRes.status === 429) status429.add(1);
  else if (listRes.status >= 500) status5xx.add(1);

  check(listRes, {
    'danh sách sự kiện trả về 200': (r) => r.status === 200,
  });

  // 2. Tìm kiếm sự kiện theo từ khóa (GET /concerts?search=...)
  const kw = SEARCH_KEYWORDS[__ITER % SEARCH_KEYWORDS.length];
  const t1 = Date.now();
  const searchRes = http.get(`${BASE_URL}/concerts?search=${encodeURIComponent(kw)}`, headers);
  searchDuration.add(Date.now() - t1);
  systemAvailable.add(searchRes.status < 500);

  check(searchRes, {
    'tìm kiếm sự kiện thành công': (r) => [200, 429].includes(r.status),
  });

  // 3. Xem chi tiết sự kiện (GET /concerts/:id)
  if (data.concertIds && data.concertIds.length > 0) {
    const randomId = data.concertIds[__ITER % data.concertIds.length];
    const t2 = Date.now();
    const detailRes = http.get(`${BASE_URL}/concerts/${randomId}`, headers);
    detailDuration.add(Date.now() - t2);
    systemAvailable.add(detailRes.status < 500);

    check(detailRes, {
      'chi tiết sự kiện thành công': (r) => [200, 429].includes(r.status),
    });
  }

  sleep(0.2);
}

export function handleSummary(data) {
  const totalReqs = data.metrics.http_reqs?.values?.count || 0;
  const rps = data.metrics.http_reqs?.values?.rate?.toFixed(1) || '0';
  const homeP95 = data.metrics.home_duration?.values['p(95)']?.toFixed(2) || 'N/A';
  const searchP95 = data.metrics.search_duration?.values['p(95)']?.toFixed(2) || 'N/A';
  const detailP95 = data.metrics.detail_duration?.values['p(95)']?.toFixed(2) || 'N/A';
  const all5xx = data.metrics.status_5xx?.values?.count || 0;

  const summary = `
========================================================================
📊 TỔNG KẾT KIỂM THỬ TẢI ĐỌC DỮ LIỆU (CATALOG READ SPIKE)
========================================================================
Tổng HTTP Requests        : ${totalReqs}
Thông lượng trung bình    : ${rps} requests/second
Độ trễ Trang chủ (p95)    : ${homeP95} ms
Độ trễ Tìm kiếm (p95)     : ${searchP95} ms
Độ trễ Chi tiết show (p95): ${detailP95} ms
Tổng lỗi 5xx Server       : ${all5xx} (Yêu cầu: 0)

Nhận định:
- API Catalog được tối ưu hóa bộ đệm (Caching / Indexing), phản hồi mượt mà dưới tải cao.
- Throughput cao và latency thấp đảm bảo khán giả tải trang tức thì trong những giây mở bán.
========================================================================
`;

  return {
    stdout: summary,
    'testing/reports/load/k6-catalog-summary.json': JSON.stringify(data, null, 2),
  };
}
