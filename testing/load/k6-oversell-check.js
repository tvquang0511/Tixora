import http from 'k6/http';
import { check } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// ==============================================================================
// Tixora k6: Kiểm thử Tranh chấp Đặt vé Đồng thời (Zero Oversell Concurrency Check)
// Mục tiêu: Chứng minh Redis Lua Script & DB Locks không bao giờ bán vượt số lượng vé còn lại.
// ==============================================================================

const VUS = Number(__ENV.VUS || 20);
const ITERATIONS = Number(__ENV.ITERATIONS || VUS);

export const options = {
  setupTimeout: __ENV.SETUP_TIMEOUT || '240s',
  scenarios: {
    concurrent_reserve: {
      executor: 'shared-iterations',
      vus: VUS,
      iterations: ITERATIONS,
      maxDuration: __ENV.MAX_DURATION || '45s',
    },
  },
  thresholds: {
    system_available: ['rate>0.95'],
    reserve_duration: ['p(95)<1500'], // 95% request khóa vé phải hoàn tất dưới 1.5s
  },
};

const reserveSuccess = new Counter('reserve_success');
const reserveRejected = new Counter('reserve_rejected');
const reserveRateLimited = new Counter('reserve_rate_limited');
const status400 = new Counter('status_400');
const status429 = new Counter('status_429');
const status5xx = new Counter('status_5xx');
const systemAvailable = new Rate('system_available');
const reserveDuration = new Trend('reserve_duration');

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const SEED_USER_COUNT = Number(__ENV.SEED_USER_COUNT || VUS);
const SEED_EMAIL_PREFIX = __ENV.SEED_EMAIL_PREFIX || 'audience';
const SEED_EMAIL_DOMAIN = __ENV.SEED_EMAIL_DOMAIN || 'tixora.local';
const SEED_PASSWORD = __ENV.SEED_PASSWORD || '123456';
const CONCERT_ID = __ENV.CONCERT_ID;
const CATEGORY_ID = __ENV.CATEGORY_ID;
const QUANTITY = Number(__ENV.QUANTITY || 1);
const EXPECTED_MAX_SUCCESS = Number(__ENV.EXPECTED_MAX_SUCCESS || 0);
const REQUEST_TIMEOUT = __ENV.REQUEST_TIMEOUT || '15s';
const FAKE_IPS = (__ENV.FAKE_IPS || 'true').toLowerCase() === 'true';

function requestOptions(token, fakeIp) {
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

function seedFakeIp(index) {
  return `10.40.${Math.floor(index / 250)}.${(index % 250) + 1}`;
}

function vuFakeIp() {
  return FAKE_IPS ? `10.50.${__VU % 250}.${(__ITER % 250) + 1}` : null;
}

function recordStatus(response) {
  systemAvailable.add(response.status < 500);
  if (response.status === 400) status400.add(1);
  if (response.status === 429) status429.add(1);
  if (response.status >= 500) status5xx.add(1);
}

function login(email, password, index) {
  const response = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({ email, password }),
    requestOptions(null, seedFakeIp(index)),
  );

  recordStatus(response);

  check(response, {
    'login succeeded': (res) => res.status === 200,
  });

  if (response.status !== 200) {
    return null;
  }

  return response.json('accessToken');
}

function loginSeedUsers() {
  const tokens = [];
  for (let index = 0; index < SEED_USER_COUNT; index += 1) {
    const email = `${SEED_EMAIL_PREFIX}${index + 1}@${SEED_EMAIL_DOMAIN}`;
    const token = login(email, SEED_PASSWORD, index);
    if (token) {
      tokens.push(token);
    }
  }
  return tokens;
}

// Tự động dò tìm Concert và Hạng vé mở bán nếu người dùng không truyền ID thủ công
function autoDiscoverTarget(sampleToken) {
  if (CONCERT_ID && CATEGORY_ID) {
    return {
      concertId: CONCERT_ID,
      categoryId: CATEGORY_ID,
      targetName: 'Thủ công (ENV Cấu Hình)',
      availableTickets: EXPECTED_MAX_SUCCESS,
    };
  }

  const listRes = http.get(`${BASE_URL}/concerts?limit=15`, requestOptions(sampleToken, '10.99.0.1'));
  recordStatus(listRes);
  const json = listRes.json();
  const concerts = Array.isArray(json) ? json : (json?.data || json?.items || []);

  for (const c of concerts) {
    const detailRes = http.get(`${BASE_URL}/concerts/${c.id}`, requestOptions(sampleToken, '10.99.0.2'));
    recordStatus(detailRes);
    if (detailRes.status !== 200) continue;

    const detail = detailRes.json();
    const tiers = detail.ticketTiers || [];
    const openTier = tiers.find(
      (t) => t.status !== 'sold_out' && t.status !== 'sale_closed' && (!t.sales_start_at || new Date(t.sales_start_at) <= new Date()),
    );

    if (openTier) {
      return {
        concertId: c.id,
        categoryId: openTier.id,
        targetName: `${c.name} — [${openTier.name}]`,
        availableTickets: EXPECTED_MAX_SUCCESS || openTier.remaining_quantity || 10,
      };
    }
  }

  throw new Error('Không thể tự động tìm thấy sự kiện mở bán còn vé. Vui lòng set CONCERT_ID và CATEGORY_ID.');
}

export function setup() {
  const tokens = loginSeedUsers();
  if (tokens.length === 0) {
    throw new Error('Không thể đăng nhập các tài khoản seed. Vui lòng kiểm tra SEED_EMAIL_PREFIX và mật khẩu.');
  }

  const target = autoDiscoverTarget(tokens[0]);

  console.log('');
  console.log('='.repeat(72));
  console.log('⚡ TIXORA k6 OVERSELL / CONCURRENCY AUDIT');
  console.log(`BASE_URL            : ${BASE_URL}`);
  console.log(`Mục tiêu            : ${target.targetName}`);
  console.log(`Concert ID          : ${target.concertId}`);
  console.log(`Category ID         : ${target.categoryId}`);
  console.log(`Số người dùng ảo    : ${tokens.length} VUs`);
  console.log(`Số vé mua mỗi lượt  : ${QUANTITY}`);
  console.log(`Tồn kho kỳ vọng     : ${target.availableTickets || 'Chưa định nghĩa'}`);
  console.log(`Chống IP Rate Limit : ${FAKE_IPS}`);
  console.log('='.repeat(72));
  console.log('');

  return { tokens, target };
}

export default function (data) {
  const token = data.tokens[(__VU - 1) % data.tokens.length];
  const startTime = Date.now();

  const response = http.post(
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
    requestOptions(token, vuFakeIp()),
  );

  reserveDuration.add(Date.now() - startTime);
  recordStatus(response);

  if (response.status === 200 || response.status === 201) {
    reserveSuccess.add(1);
  } else if (response.status === 429) {
    reserveRateLimited.add(1);
  } else {
    reserveRejected.add(1);
  }

  check(response, {
    'reserve không có lỗi sập server (status < 500)': (res) => res.status < 500,
    'kết quả đặt chỗ hợp lệ (200, 201, 400, 429)': (res) => [200, 201, 400, 409, 429].includes(res.status),
  });
}

export function handleSummary(data) {
  const success = data.metrics.reserve_success?.values?.count || 0;
  const rejected = data.metrics.reserve_rejected?.values?.count || 0;
  const rateLimited = data.metrics.reserve_rate_limited?.values?.count || 0;
  const all429 = data.metrics.status_429?.values?.count || 0;
  const all400 = data.metrics.status_400?.values?.count || 0;
  const all5xx = data.metrics.status_5xx?.values?.count || 0;
  const totalReqs = data.metrics.http_reqs?.values?.count || 0;
  const p95Latency = data.metrics.reserve_duration?.values['p(95)']?.toFixed(2) || 'N/A';

  const expectedMax = EXPECTED_MAX_SUCCESS || 0;
  const oversellVerdict = expectedMax > 0 
    ? (success <= expectedMax ? '✅ PASS (Chống bán lố thành công)' : '❌ FAIL (Phát hiện bán lố vé!)')
    : 'ℹ️ N/A (Không chỉ định tồn kho cố định)';

  const summary = `
========================================================================
📊 TỔNG KẾT KIỂM THỬ CHỊU TẢI TRANH CHẤP VÉ (OVERSELL CHECK)
========================================================================
Tổng HTTP Requests          : ${totalReqs}
Đặt vé thành công (Success) : ${success}
Bị từ chối hợp lệ (Sold Out): ${rejected}
Bị chặn Rate Limit (429)    : ${rateLimited}
Tổng phản hồi 400           : ${all400}
Tổng phản hồi 429           : ${all429}
Tổng lỗi Server (5xx)       : ${all5xx} (Yêu cầu: 0)
Độ trễ khóa vé (p95)        : ${p95Latency} ms
Đánh giá chống bán lố       : ${oversellVerdict}

Nguyên lý Nghiệp vụ:
- Số request thành công tuyệt đối không được vượt quá số lượng vé tồn kho.
- Các request đến sau khi hết vé phải nhận mã 400/hết vé êm đẹp, không gây crash DB.
- Lỗi 5xx phải bằng 0; chứng minh Redis Lua Script & DB Locking phòng thủ toàn diện.
========================================================================
`;

  return {
    stdout: summary,
    'testing/reports/load/k6-oversell-summary.json': JSON.stringify(data, null, 2),
  };
}
