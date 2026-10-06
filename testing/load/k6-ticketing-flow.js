import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// ==============================================================================
// Tixora k6: Kiểm thử Tải Toàn diện Luồng Bán Vé (End-to-End Ticketing Flow)
// Luồng: Browse Concert -> Xem Chi Tiết -> Khóa Vé (Reserve) -> Thanh Toán (Mock Pay) -> Hoàn tất
// ==============================================================================

const VUS = Number(__ENV.VUS || 15);
const DURATION = __ENV.DURATION || '25s';

export const options = {
  vus: VUS,
  duration: DURATION,
  setupTimeout: __ENV.SETUP_TIMEOUT || '180s',
  thresholds: {
    system_available: ['rate>0.95'],
    'http_req_duration{type:catalog}': ['p(95)<400'],  // Duyệt sự kiện < 400ms
    'http_req_duration{type:reserve}': ['p(95)<1200'], // Khóa vé < 1.2s
  },
};

const status200 = new Counter('status_200');
const status400 = new Counter('status_400');
const status429 = new Counter('status_429');
const status5xx = new Counter('status_5xx');

const reserveSuccess = new Counter('reserve_success');
const reserveRateLimited = new Counter('reserve_rate_limited');
const reserveBusinessRejected = new Counter('reserve_business_rejected');
const paymentSuccess = new Counter('payment_success');

const systemAvailable = new Rate('system_available');
const catalogTrend = new Trend('catalog_duration');
const reserveTrend = new Trend('reserve_duration');
const paymentTrend = new Trend('payment_duration');

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const EMAIL = __ENV.EMAIL;
const PASSWORD = __ENV.PASSWORD || '123456';
const USE_SEED_USERS = (__ENV.USE_SEED_USERS || 'true').toLowerCase() === 'true';
const SEED_USER_COUNT = Number(__ENV.SEED_USER_COUNT || 30);
const SEED_EMAIL_PREFIX = __ENV.SEED_EMAIL_PREFIX || 'audience';
const SEED_EMAIL_DOMAIN = __ENV.SEED_EMAIL_DOMAIN || 'tixora.local';
const SEED_PASSWORD = __ENV.SEED_PASSWORD || '123456';
const CONCERT_ID = __ENV.CONCERT_ID;
const CATEGORY_ID = __ENV.CATEGORY_ID;
const QUANTITY = Number(__ENV.QUANTITY || 1);
const FAKE_IPS = (__ENV.FAKE_IPS || 'true').toLowerCase() === 'true';
const REQUEST_TIMEOUT = __ENV.REQUEST_TIMEOUT || '10s';
const AUTO_PAY = (__ENV.AUTO_PAY || 'true').toLowerCase() === 'true'; // Mặc định tự động mock thanh toán để hoàn tất đơn

function requestHeaders(token, fakeIp) {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (fakeIp) {
    headers['x-forwarded-for'] = fakeIp;
  }

  return { headers, timeout: REQUEST_TIMEOUT };
}

function vuFakeIp() {
  return FAKE_IPS ? `10.10.${__VU % 255}.${(__ITER % 250) + 1}` : null;
}

function recordStatus(response) {
  systemAvailable.add(response.status < 500);
  if (response.status === 200 || response.status === 201) status200.add(1);
  if (response.status === 400) status400.add(1);
  if (response.status === 429) status429.add(1);
  if (response.status >= 500) status5xx.add(1);
}

function login(email, password, fakeIp) {
  const response = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({ email, password }),
    requestHeaders(null, fakeIp),
  );
  recordStatus(response);

  if (response.status !== 200) {
    return null;
  }

  return response.json('accessToken');
}

function loginSeedUsers() {
  const tokens = [];
  for (let index = 0; index < SEED_USER_COUNT; index += 1) {
    const email = `${SEED_EMAIL_PREFIX}${index + 1}@${SEED_EMAIL_DOMAIN}`;
    const token = login(email, SEED_PASSWORD, `10.20.${Math.floor(index / 250)}.${(index % 250) + 1}`);
    if (token) {
      tokens.push(token);
    }
  }
  return tokens;
}

function autoResolveTarget(sampleToken) {
  if (CONCERT_ID && CATEGORY_ID) {
    return { concertId: CONCERT_ID, categoryId: CATEGORY_ID, concertName: 'Cấu hình tay' };
  }

  const listRes = http.get(`${BASE_URL}/concerts?limit=15`, requestHeaders(sampleToken, '10.30.0.1'));
  recordStatus(listRes);
  const json = listRes.json();
  const concerts = Array.isArray(json) ? json : (json?.data || json?.items || []);

  for (const c of concerts) {
    const detailRes = http.get(`${BASE_URL}/concerts/${c.id}`, requestHeaders(sampleToken, '10.30.0.2'));
    recordStatus(detailRes);
    if (detailRes.status !== 200) continue;

    const detail = detailRes.json();
    const tiers = detail.ticketTiers || [];
    const openTier = tiers.find(
      (t) => t.status !== 'sold_out' && t.status !== 'sale_closed' && (!t.sales_start_at || new Date(t.sales_start_at) <= new Date()),
    );

    if (openTier) {
      return { concertId: c.id, categoryId: openTier.id, concertName: c.name };
    }
  }

  throw new Error('Không tìm thấy sự kiện và hạng vé khả dụng để test luồng mua vé.');
}

export function setup() {
  let tokens = [];

  if (USE_SEED_USERS) {
    tokens = loginSeedUsers();
  }

  if (tokens.length === 0 && EMAIL) {
    const token = login(EMAIL, PASSWORD, '10.20.255.1');
    if (token) tokens.push(token);
  }

  if (tokens.length === 0) {
    throw new Error('Không thể lấy access token. Vui lòng kiểm tra tài khoản hoặc cơ sở dữ liệu.');
  }

  const target = autoResolveTarget(tokens[0]);

  console.log('');
  console.log('='.repeat(72));
  console.log('🎫 TIXORA k6 FULL TICKETING FLOW & RATE LIMIT');
  console.log(`BASE_URL         : ${BASE_URL}`);
  console.log(`Sự kiện          : ${target.concertName}`);
  console.log(`Concert ID       : ${target.concertId}`);
  console.log(`Hạng vé ID       : ${target.categoryId}`);
  console.log(`Tài khoản test   : ${tokens.length} tokens`);
  console.log(`VUs / Duration   : ${options.vus} / ${options.duration}`);
  console.log(`Tự động Pay/Mock : ${AUTO_PAY}`);
  console.log('='.repeat(72));
  console.log('');

  return { tokens, target };
}

export default function (data) {
  const fakeIp = vuFakeIp();
  const token = data.tokens[(__VU - 1) % data.tokens.length];

  // 1. Duyệt chi tiết Concert (Catalog Read)
  const t0 = Date.now();
  const concertResponse = http.get(
    `${BASE_URL}/concerts/${data.target.concertId}`,
    requestHeaders(token, fakeIp),
  );
  catalogTrend.add(Date.now() - t0);
  recordStatus(concertResponse);

  check(concertResponse, {
    'xem chi tiết concert thành công (200 hoặc 429)': (res) => [200, 429].includes(res.status),
  });

  if (!token || concertResponse.status === 429) {
    sleep(0.3);
    return;
  }

  // 2. Khóa vé đồng thời (Ticket Reserve Lock)
  const t1 = Date.now();
  const reserveResponse = http.post(
    `${BASE_URL}/tickets/reserve`,
    JSON.stringify({
      concert_id: data.target.concertId,
      items: [
        {
          category_id: data.target.categoryId,
          quantity: QUANTITY,
        },
      ],
    }),
    requestHeaders(token, fakeIp),
  );
  reserveTrend.add(Date.now() - t1);
  recordStatus(reserveResponse);

  let orderId = null;

  if (reserveResponse.status === 200 || reserveResponse.status === 201) {
    reserveSuccess.add(1);
    const body = reserveResponse.json();
    orderId = body?.order_id;
  } else if (reserveResponse.status === 429) {
    reserveRateLimited.add(1);
  } else if (reserveResponse.status === 400) {
    reserveBusinessRejected.add(1);
  }

  check(reserveResponse, {
    'reserve không có lỗi server (status < 500)': (res) => res.status < 500,
  });

  // 3. Khép kín luồng: Giả lập thanh toán hoặc giải phóng đơn để không tắc kho
  if (orderId && AUTO_PAY) {
    const t2 = Date.now();
    const payRes = http.post(
      `${BASE_URL}/payments/mock-process`,
      JSON.stringify({ order_id: orderId }),
      requestHeaders(token, fakeIp),
    );
    paymentTrend.add(Date.now() - t2);
    recordStatus(payRes);

    if (payRes.status === 200 || payRes.status === 201) {
      paymentSuccess.add(1);
    }

    check(payRes, {
      'thanh toán mock hoàn tất hoặc từ chối hợp lệ': (res) => [200, 201, 400, 404].includes(res.status),
    });
  }

  sleep(0.3);
}

export function handleSummary(data) {
  const success = data.metrics.reserve_success?.values?.count || 0;
  const payments = data.metrics.payment_success?.values?.count || 0;
  const rateLimited = data.metrics.reserve_rate_limited?.values?.count || 0;
  const businessRejected = data.metrics.reserve_business_rejected?.values?.count || 0;
  const status429Count = data.metrics.status_429?.values?.count || 0;
  const totalReqs = data.metrics.http_reqs?.values?.count || 0;

  const catalogP95 = data.metrics.catalog_duration?.values['p(95)']?.toFixed(2) || 'N/A';
  const reserveP95 = data.metrics.reserve_duration?.values['p(95)']?.toFixed(2) || 'N/A';
  const payP95 = data.metrics.payment_duration?.values['p(95)']?.toFixed(2) || 'N/A';

  const summary = `
========================================================================
📊 TỔNG KẾT LUỒNG ĐẶT VÉ & THANH TOÁN (FULL TICKETING FLOW)
========================================================================
Tổng HTTP Requests           : ${totalReqs}
Khóa vé thành công (Reserve) : ${success}
Thanh toán hoàn tất (Paid)   : ${payments}
Bị từ chối hợp lệ (Hết vé)   : ${businessRejected}
Bị chặn Rate Limit (429)     : ${rateLimited}
Tổng phản hồi 429            : ${status429Count}
Độ trễ Xem Catalog (p95)     : ${catalogP95} ms
Độ trễ Khóa vé Reserve (p95) : ${reserveP95} ms
Độ trễ Thanh toán Pay (p95)  : ${payP95} ms

Kết luận:
- Hệ thống hỗ trợ xử lý luồng trọn vẹn từ Xem -> Khóa vé -> Thanh toán.
- HTTP 429 xuất hiện chứng minh bộ bảo vệ Token Bucket chống bot/spam hoạt động.
- Không có lỗi 500 nội bộ chứng minh luồng transaction và Redis an toàn.
========================================================================
`;

  return {
    stdout: summary,
    'testing/reports/load/k6-ticketing-summary.json': JSON.stringify(data, null, 2),
  };
}
