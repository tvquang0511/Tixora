import test from "node:test";
import assert from "node:assert/strict";
import { fn } from "jest-mock";

import { OrganizerRevenueAiService } from "../src/modules/organizer-revenue/services/organizer-revenue-ai.service";
import { OrganizerRevenueAiController } from "../src/modules/organizer-revenue/controllers/organizer-revenue-ai.controller";
import { AdminRevenueAiService } from "../src/modules/admin-revenue/services/admin-revenue-ai.service";
import { AdminRevenueAiController } from "../src/modules/admin-revenue/controllers/admin-revenue-ai.controller";

// ==========================================
// 1. ORGANIZER REVENUE AI SERVICE TESTS
// ==========================================

test("OrganizerRevenueAiService returns cached insights when available in Redis", async () => {
  const cachedData = {
    peak_purchasing_hours: "Cached peak hours",
    tier_performance_analysis: "Cached tier analysis",
    tactical_recommendations: ["Cached recommendation 1"],
    occupancy_summary: "Cached occupancy summary",
    analyzed_at: new Date().toISOString(),
    is_cached: true,
  };

  const mockRedisService = {
    getJson: fn().mockResolvedValue(cachedData),
    setJson: fn().mockResolvedValue(true),
  };
  const mockRevenueService = {
    getSummary: fn(),
    getTrend: fn(),
    getByConcert: fn(),
  };
  const mockGeminiClient = {
    generateContent: fn(),
  };

  const service = new OrganizerRevenueAiService(
    mockRevenueService as any,
    mockGeminiClient as any,
    mockRedisService as any,
  );

  const result = await service.getInsights("organizer-123", false);

  assert.equal(result.peak_purchasing_hours, "Cached peak hours");
  assert.equal(result.is_cached, true);
  assert.equal(mockRedisService.getJson.mock.calls.length, 1);
  assert.equal(mockGeminiClient.generateContent.mock.calls.length, 0);
  assert.equal(mockRevenueService.getSummary.mock.calls.length, 0);
});

test("OrganizerRevenueAiService fetches metrics, calls Gemini, caches and returns insights when cache miss", async () => {
  const mockRedisService = {
    getJson: fn().mockResolvedValue(null),
    setJson: fn().mockResolvedValue(true),
  };
  const mockRevenueService = {
    getSummary: fn().mockResolvedValue({
      total_gmv: 50000000,
      total_net_revenue: 47500000,
      total_tickets_sold: 250,
      paid_orders: 120,
      aov: 416666,
      growth: { gmv: 20 },
    }),
    getTrend: fn().mockResolvedValue({
      items: [{ period: "2026-10-01", revenue: 20000000, tickets_sold: 100 }],
    }),
    getByConcert: fn().mockResolvedValue({
      items: [
        {
          concert_name: "Live Show Hà Nội",
          revenue: 50000000,
          tickets_sold: 250,
          tier_breakdown: [
            { tier_name: "VIP", sold: 100, total: 100 },
            { tier_name: "GA", sold: 150, total: 400 },
          ],
        },
      ],
    }),
  };

  const geminiResponse = JSON.stringify({
    peak_purchasing_hours:
      "Vé bán chạy nhất lúc 20:00 tối các ngày trong tuần.",
    tier_performance_analysis:
      "Vé VIP đã bán hết 100%, trong khi vé GA mới đạt 37.5%.",
    tactical_recommendations: [
      "Tung flash sale vé GA vào khung 20h",
      "Mở thêm hạng vé Premium hoặc combo quà tặng",
    ],
    occupancy_summary: "Tỷ lệ lấp đầy đạt 50% toàn bộ các show.",
  });

  const mockGeminiClient = {
    generateContent: fn().mockResolvedValue(geminiResponse),
  };

  const service = new OrganizerRevenueAiService(
    mockRevenueService as any,
    mockGeminiClient as any,
    mockRedisService as any,
  );

  const result = await service.getInsights("organizer-123", true);

  assert.equal(
    result.peak_purchasing_hours,
    "Vé bán chạy nhất lúc 20:00 tối các ngày trong tuần.",
  );
  assert.equal(result.tactical_recommendations.length, 2);
  assert.equal(result.is_cached, false);
  assert.equal(mockRedisService.setJson.mock.calls.length, 1);
});

test("OrganizerRevenueAiService falls back to heuristic analysis when Gemini throws an error", async () => {
  const mockRedisService = {
    getJson: fn().mockResolvedValue(null),
    setJson: fn().mockResolvedValue(true),
  };
  const mockRevenueService = {
    getSummary: fn().mockResolvedValue({
      total_gmv: 10000000,
      total_net_revenue: 9500000,
      total_tickets_sold: 50,
      paid_orders: 20,
      aov: 500000,
      growth: { gmv: 0 },
    }),
    getTrend: fn().mockResolvedValue({ items: [] }),
    getByConcert: fn().mockResolvedValue({
      items: [
        {
          concert_name: "Show Nhỏ",
          revenue: 10000000,
          tickets_sold: 50,
          tier_breakdown: [{ tier_name: "Standard", sold: 50, total: 200 }],
        },
      ],
    }),
  };

  const mockGeminiClient = {
    generateContent: fn().mockRejectedValue(new Error("Gemini quota exceeded")),
  };

  const service = new OrganizerRevenueAiService(
    mockRevenueService as any,
    mockGeminiClient as any,
    mockRedisService as any,
  );

  const result = await service.getInsights("organizer-123", true);

  assert.ok(result.peak_purchasing_hours.length > 0);
  assert.ok(result.tactical_recommendations.length > 0);
  assert.equal(result.is_cached, false);
});

// ==========================================
// 2. ADMIN REVENUE AI SERVICE TESTS
// ==========================================

test("AdminRevenueAiService returns cached insights when available in Redis", async () => {
  const cachedData = {
    platform_financial_health: "Cached platform health",
    top_organizers_performance: "Cached organizer performance",
    risk_alerts: ["Risk 1"],
    platform_growth_strategies: ["Strategy 1"],
    analyzed_at: new Date().toISOString(),
    is_cached: true,
  };

  const mockRedisService = {
    getJson: fn().mockResolvedValue(cachedData),
    setJson: fn().mockResolvedValue(true),
  };
  const mockRevenueService = {
    getSummary: fn(),
    getTrend: fn(),
    getByOrganizer: fn(),
    getByConcert: fn(),
  };
  const mockGeminiClient = {
    generateContent: fn(),
  };

  const service = new AdminRevenueAiService(
    mockRevenueService as any,
    mockGeminiClient as any,
    mockRedisService as any,
  );

  const result = await service.getInsights(false);

  assert.equal(result.platform_financial_health, "Cached platform health");
  assert.equal(result.is_cached, true);
  assert.equal(mockRedisService.getJson.mock.calls.length, 1);
  assert.equal(mockGeminiClient.generateContent.mock.calls.length, 0);
});

test("AdminRevenueAiService aggregates platform stats, calls Gemini, caches and returns executive insights", async () => {
  const mockRedisService = {
    getJson: fn().mockResolvedValue(null),
    setJson: fn().mockResolvedValue(true),
  };
  const mockRevenueService = {
    getSummary: fn().mockResolvedValue({
      total_gmv: 500000000,
      total_platform_fee: 25000000,
      paid_orders: 1200,
      total_tickets_sold: 2000,
      aov: 416666,
      growth: { gmv: 15.5 },
    }),
    getTrend: fn().mockResolvedValue({ items: [] }),
    getByOrganizer: fn().mockResolvedValue({
      items: [
        {
          organization_name: "Mây Lang Thang",
          gmv: 300000000,
          market_share: 60,
          tickets_sold: 1200,
        },
        {
          organization_name: "V-Concerts",
          gmv: 200000000,
          market_share: 40,
          tickets_sold: 800,
        },
      ],
    }),
    getByConcert: fn().mockResolvedValue({
      items: [
        {
          concert_name: "Concert Đêm Nhạc Mùa Thu",
          status: "PUBLISHED",
          organizer_name: "Mây Lang Thang",
          revenue: 150000000,
          tickets_sold: 600,
          start_time: new Date(),
        },
      ],
    }),
  };

  const geminiResponse = JSON.stringify({
    platform_financial_health:
      "Sức khỏe tài chính nền tảng rất vững mạnh với tổng GMV 500 triệu đồng và phí sàn 25 triệu.",
    top_organizers_performance:
      "Mây Lang Thang chiếm 60% thị phần sàn, cần đa dạng hóa thêm các nhà tổ chức mới.",
    risk_alerts: [
      "Tập trung doanh thu vào 1-2 đối tác lớn có thể tạo rủi ro hệ thống.",
    ],
    platform_growth_strategies: [
      "Thực hiện chiến dịch kích cầu vé cho các ban tổ chức quy mô vừa và nhỏ.",
    ],
  });

  const mockGeminiClient = {
    generateContent: fn().mockResolvedValue(geminiResponse),
  };

  const service = new AdminRevenueAiService(
    mockRevenueService as any,
    mockGeminiClient as any,
    mockRedisService as any,
  );

  const result = await service.getInsights(true);

  assert.equal(result.is_cached, false);
  assert.ok(result.platform_financial_health.includes("500 triệu"));
  assert.equal(result.risk_alerts.length, 1);
  assert.equal(result.platform_growth_strategies.length, 1);
  assert.equal(mockRedisService.setJson.mock.calls.length, 1);
});

test("AdminRevenueAiService falls back to heuristic insights when Gemini fails", async () => {
  const mockRedisService = {
    getJson: fn().mockResolvedValue(null),
    setJson: fn().mockResolvedValue(true),
  };
  const mockRevenueService = {
    getSummary: fn().mockResolvedValue({
      total_gmv: 100000000,
      total_platform_fee: 5000000,
      paid_orders: 200,
      total_tickets_sold: 300,
      aov: 500000,
      growth: { gmv: 5 },
    }),
    getTrend: fn().mockResolvedValue({ items: [] }),
    getByOrganizer: fn().mockResolvedValue({
      items: [
        {
          organization_name: "Đối tác A",
          gmv: 90000000,
          market_share: 90,
          tickets_sold: 280,
        },
      ],
    }),
    getByConcert: fn().mockResolvedValue({ items: [] }),
  };

  const mockGeminiClient = {
    generateContent: fn().mockRejectedValue(new Error("Timeout")),
  };

  const service = new AdminRevenueAiService(
    mockRevenueService as any,
    mockGeminiClient as any,
    mockRedisService as any,
  );

  const result = await service.getInsights(true);

  assert.equal(result.is_cached, false);
  assert.ok(result.platform_financial_health.length > 0);
  assert.ok(result.risk_alerts.length > 0);
  assert.ok(result.platform_growth_strategies.length > 0);
});

// ==========================================
// 3. CONTROLLER DELEGATION TESTS
// ==========================================

test("OrganizerRevenueAiController delegates to service with userId and refresh flag", async () => {
  const mockAiService = {
    getInsights: fn().mockResolvedValue({ ok: true }),
  };
  const controller = new OrganizerRevenueAiController(mockAiService as any);

  const mockReq = { user: { id: "user-456" } };
  const res = await controller.getAiInsights(mockReq as any, "true");

  assert.deepEqual(res, { ok: true });
  assert.equal(mockAiService.getInsights.mock.calls.length, 1);
  assert.equal(mockAiService.getInsights.mock.calls[0][0], "user-456");
  assert.equal(mockAiService.getInsights.mock.calls[0][1], true);
});

test("AdminRevenueAiController delegates to service with refresh flag", async () => {
  const mockAiService = {
    getInsights: fn().mockResolvedValue({ ok: true }),
  };
  const controller = new AdminRevenueAiController(mockAiService as any);

  const res = await controller.getAiInsights("false");

  assert.deepEqual(res, { ok: true });
  assert.equal(mockAiService.getInsights.mock.calls.length, 1);
  assert.equal(mockAiService.getInsights.mock.calls[0][0], false);
});
