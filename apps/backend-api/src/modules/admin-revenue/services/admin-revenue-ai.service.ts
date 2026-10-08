import { Injectable, Logger } from "@nestjs/common";
import { AdminRevenueService } from "./admin-revenue.service";
import { GeminiClient } from "../../../shared/ai/gemini.client";
import { RedisService } from "../../../shared/redis";
import { AdminRevenueInsightDto } from "../dtos/admin-revenue-insight.dto";

@Injectable()
export class AdminRevenueAiService {
  private readonly logger = new Logger(AdminRevenueAiService.name);
  private readonly CACHE_TTL_SECONDS = 3600; // 1 hour

  constructor(
    private readonly revenueService: AdminRevenueService,
    private readonly geminiClient: GeminiClient,
    private readonly redisService: RedisService,
  ) {}

  async getInsights(refresh = false): Promise<AdminRevenueInsightDto> {
    const cacheKey = "admin:revenue:ai-insights";

    // 1. Check Redis Cache unless refresh requested
    if (!refresh) {
      try {
        const cached =
          await this.redisService.getJson<AdminRevenueInsightDto>(cacheKey);
        if (cached) {
          return {
            ...cached,
            is_cached: true,
          };
        }
      } catch (err) {
        this.logger.warn("Failed to read admin revenue AI cache", err);
      }
    }

    // 2. Fetch platform-wide statistics from AdminRevenueService
    const [summary, trend, organizerRes, concertRes] = await Promise.all([
      this.revenueService.getSummary({}),
      this.revenueService.getTrend({ group_by: "day" }),
      this.revenueService.getByOrganizer({}),
      this.revenueService.getByConcert({ limit: 15 }),
    ]);

    // 3. Compact data payload to send to LLM
    const metricsPayload = {
      platform_summary: {
        total_gmv: summary.total_gmv,
        platform_fee_5_pct: summary.total_platform_fee,
        paid_orders: summary.paid_orders,
        tickets_sold: summary.total_tickets_sold,
        aov: summary.aov,
        growth: summary.growth,
      },
      recent_daily_trends: trend.items.slice(-14).map((i) => ({
        date: i.period,
        revenue: i.revenue,
        platform_fee: i.platform_fee,
        orders: i.paid_orders,
      })),
      top_organizers: organizerRes.items.slice(0, 5).map((o) => ({
        name: o.organization_name || "Ẩn danh",
        gmv: o.gmv,
        market_share: `${o.market_share}%`,
        tickets_sold: o.tickets_sold,
      })),
      concerts_sample: concertRes.items.slice(0, 10).map((c) => ({
        name: c.concert_name,
        status: c.status,
        organizer: c.organizer_name || "N/A",
        revenue: c.revenue,
        tickets_sold: c.tickets_sold,
        start_time: c.start_time,
      })),
    };

    const systemInstruction = `Bạn là Giám đốc Điều hành Tài chính & Vận hành Nền tảng (Chief Financial & Operations Officer) của sàn bán vé Tixora.
Nhiệm vụ: Phân tích số liệu kinh doanh toàn sàn của SuperAdmin dưới đây và đưa ra bản báo cáo điều hành CẤP CAO, SẮC BÉN, CỤ THỂ, TRÍCH DẪN DỮ LIỆU THẬT. TUYỆT ĐỐI CẤM VIẾT CHUNG CHUNG HOẶC LỜI KHUYÊN SÁCH VỞ.

QUY TẮC BẮT BUỘC:
1. Luôn nêu chính xác số liệu: Tổng GMV (VND), Phí sàn 5% (VND), Tỷ lệ tăng trưởng % GMV, và Giá trị trung bình đơn (AOV).
2. Nêu đích danh tên các Ban tổ chức dẫn đầu thị phần, tỷ trọng % thị phần họ nắm giữ, cảnh báo nếu thị phần bị phụ thuộc quá mức vào 1-2 đối tác.
3. Cảnh báo rủi ro (risk_alerts): Chỉ rõ tên sự kiện hoặc đối tác có tỷ lệ bán vé thấp, show nào cần can thiệp xử lý.
4. Chiến lược tăng trưởng (platform_growth_strategies): Đề xuất chính sách điều hành có số liệu (phí sàn, gói quảng bá, mở rộng danh mục) mang lại giá trị gia tăng thực sự cho sàn.

Định dạng JSON duy nhất:
{
  "platform_financial_health": "Đánh giá sức khỏe tài chính toàn sàn với các con số cụ thể về GMV, phí sàn, AOV và biến động tăng trưởng.",
  "top_organizers_performance": "Phân tích mức độ tập trung thị phần kèm tên ban tổ chức và % thị phần cụ thể, đánh giá rủi ro phụ thuộc.",
  "risk_alerts": [
    "Cảnh báo rủi ro 1 kèm tên show hoặc đối tác cụ thể",
    "Cảnh báo rủi ro 2 kèm hiện tượng bất thường"
  ],
  "platform_growth_strategies": [
    "Chiến lược tăng trưởng 1 mang tính điều hành sàn",
    "Chiến lược tăng trưởng 2 tối ưu dòng tiền hoặc phát triển đối tác"
  ]
}`;

    const prompt = `Dưới đây là bảng số liệu điều hành toàn sàn của SuperAdmin:
${JSON.stringify(metricsPayload, null, 2)}`;

    let responseJsonText: string;
    try {
      responseJsonText = await this.geminiClient.generateContent(prompt, {
        jsonMode: true,
        systemInstruction,
      });
    } catch (err: unknown) {
      this.logger.error(
        "Gemini failed during admin revenue insights generation",
        err,
      );
      return this.buildFallbackInsights(metricsPayload);
    }

    try {
      const parsed = this.parseJsonSafely(responseJsonText);
      const sanitized: AdminRevenueInsightDto = {
        platform_financial_health:
          typeof parsed.platform_financial_health === "string" &&
          parsed.platform_financial_health.trim().length > 15
            ? parsed.platform_financial_health.trim()
            : this.buildFallbackInsights(metricsPayload)
                .platform_financial_health,
        top_organizers_performance:
          typeof parsed.top_organizers_performance === "string" &&
          parsed.top_organizers_performance.trim().length > 15
            ? parsed.top_organizers_performance.trim()
            : this.buildFallbackInsights(metricsPayload)
                .top_organizers_performance,
        risk_alerts:
          Array.isArray(parsed.risk_alerts) && parsed.risk_alerts.length > 0
            ? parsed.risk_alerts.map((r: any) => String(r).trim())
            : this.buildFallbackInsights(metricsPayload).risk_alerts,
        platform_growth_strategies:
          Array.isArray(parsed.platform_growth_strategies) &&
          parsed.platform_growth_strategies.length > 0
            ? parsed.platform_growth_strategies.map((s: any) =>
                String(s).trim(),
              )
            : this.buildFallbackInsights(metricsPayload)
                .platform_growth_strategies,
        analyzed_at: new Date().toISOString(),
        is_cached: false,
      };

      // Store in Redis
      try {
        await this.redisService.setJson(
          cacheKey,
          sanitized,
          this.CACHE_TTL_SECONDS,
        );
      } catch (cacheErr) {
        this.logger.warn(
          "Failed to set Redis cache for admin revenue insights",
          cacheErr,
        );
      }

      return sanitized;
    } catch (parseErr) {
      this.logger.error(
        "Failed to parse Gemini admin revenue output JSON",
        parseErr,
      );
      return this.buildFallbackInsights(metricsPayload);
    }
  }

  private parseJsonSafely(text: string): any {
    let cleaned = text.trim();
    if (cleaned.startsWith("```json")) {
      cleaned = cleaned.replace(/^```json\s*/, "").replace(/\s*```$/, "");
    } else if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```\s*/, "").replace(/\s*```$/, "");
    }
    return JSON.parse(cleaned);
  }

  private buildFallbackInsights(payload: any): AdminRevenueInsightDto {
    const totalGmv = payload?.platform_summary?.total_gmv || 0;
    const platformFee = payload?.platform_summary?.platform_fee_5_pct || 0;
    const paidOrders = payload?.platform_summary?.paid_orders || 0;
    const aov = payload?.platform_summary?.aov || 0;
    const growth = payload?.platform_summary?.growth?.gmv || 0;
    const topOrgs: any[] = payload?.top_organizers || [];
    const concerts: any[] = payload?.concerts_sample || [];

    const formattedGmv = new Intl.NumberFormat("vi-VN").format(totalGmv);
    const formattedFee = new Intl.NumberFormat("vi-VN").format(platformFee);
    const formattedAov = new Intl.NumberFormat("vi-VN").format(aov);

    let healthText = `Tổng GMV toàn sàn đạt ${formattedGmv} VND (${paidOrders} đơn hàng), doanh thu phí sàn (5%) thu về ${formattedFee} VND. Giá trị trung bình đơn (AOV) đạt ${formattedAov} VND.`;
    if (growth !== 0) {
      healthText += ` Tăng trưởng GMV so với kỳ trước ghi nhận ${growth > 0 ? `+${growth}%` : `${growth}%`}.`;
    }

    let orgText: string;
    if (topOrgs.length > 0) {
      const top1 = topOrgs[0];
      orgText = `Thị phần doanh thu lớn nhất đang thuộc về đối tác "${top1.name}" với GMV ${new Intl.NumberFormat("vi-VN").format(top1.gmv)} VND (chiếm ${top1.market_share} toàn sàn).`;
      if (topOrgs.length > 1) {
        orgText += ` Đứng thứ hai là "${topOrgs[1].name}" chiếm ${topOrgs[1].market_share}.`;
      }
    } else {
      orgText = "Thị phần các ban tổ chức đang duy trì cân bằng trên toàn sàn.";
    }

    const alerts: string[] = [];
    if (topOrgs.length > 0 && parseFloat(topOrgs[0].market_share) > 60) {
      alerts.push(
        `Rủi ro tập trung doanh thu: Đối tác "${topOrgs[0].name}" nắm giữ tới ${topOrgs[0].market_share} GMV toàn sàn, hệ thống cần tích cực thu hút thêm các đơn vị tổ chức khác để giảm thiểu rủi ro vận hành.`,
      );
    }
    const lowConcert = concerts.find((c) => (c.revenue || 0) === 0 || c.tickets_sold === 0);
    if (lowConcert) {
      alerts.push(
        `Sự kiện "${lowConcert.name}" của đối tác "${lowConcert.organizer}" chưa ghi nhận doanh số vé phát sinh, cần kiểm tra cấu hình giá hoặc mở hỗ trợ truyền thông.`,
      );
    }
    if (alerts.length === 0) {
      alerts.push(
        "Theo dõi chặt chẽ tiến độ đối soát sau sự kiện (Escrow Settlement) nhằm bảo đảm an toàn thanh toán cho người mua vé.",
      );
    }

    const strategies: string[] = [
      "Thực hiện chính sách ưu đãi phí sàn lũy tiến (4% thay vì 5%) cho các đối tác đạt GMV trên 500 triệu để giữ chân các đơn vị tổ chức lớn.",
      "Tăng cường tính năng gợi ý thông minh (Recommendation) trên trang chủ vào dịp cuối tuần để tăng tỷ lệ chuyển đổi vé.",
    ];

    return {
      platform_financial_health: healthText,
      top_organizers_performance: orgText,
      risk_alerts: alerts,
      platform_growth_strategies: strategies,
      analyzed_at: new Date().toISOString(),
      is_cached: false,
    };
  }
}
