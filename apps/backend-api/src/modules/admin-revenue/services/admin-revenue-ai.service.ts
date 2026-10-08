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

    const systemInstruction = `Bạn là một chuyên gia tư vấn chiến lược điều hành nền tảng (Platform Operations & Revenue Executive) của sàn bán vé Tixora.
Dựa vào số liệu kinh doanh toàn sàn của Quản trị viên (SuperAdmin) dưới đây, hãy đưa ra bản phân tích cấp cao (Executive Intelligence) bằng tiếng Việt.

Yêu cầu định dạng: Trả về duy nhất JSON object hợp lệ (không markdown thừa):
{
  "platform_financial_health": "Đánh giá sức khỏe tài chính toàn sàn (Tổng GMV, phí sàn thu về, biên độ tăng trưởng, dòng tiền).",
  "top_organizers_performance": "Phân tích mức độ tập trung thị phần giữa các Ban tổ chức, đơn vị nào đang dẫn đầu và rủi ro nếu quá phụ thuộc vào top 1-2 đối tác.",
  "risk_alerts": [
    "Cảnh báo rủi ro 1 (ví dụ: sự kiện nào sắp đến ngày diễn nhưng tỷ lệ lấp đầy < 30% có nguy cơ lỗ show...)",
    "Cảnh báo rủi ro 2 (nếu có sự kiện hoặc đối tác có dấu hiệu bất thường)"
  ],
  "platform_growth_strategies": [
    "Đề xuất chiến lược phát triển sàn 1 (ví dụ: mở rộng danh mục, chiến dịch ngày hội vé...)",
    "Đề xuất chiến lược phát triển sàn 2 (tối ưu chính sách phí hoặc hỗ trợ đối tác vừa và nhỏ)"
  ]
}

Hãy đưa ra nhận định khách quan, mang tính quản trị sàn và có giá trị chiến lược thực tế.`;

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
          typeof parsed.platform_financial_health === "string"
            ? parsed.platform_financial_health.trim()
            : "Hệ thống ghi nhận dòng tiền giao dịch ổn định trên toàn sàn với doanh thu phí nền tảng duy trì tăng trưởng dương.",
        top_organizers_performance:
          typeof parsed.top_organizers_performance === "string"
            ? parsed.top_organizers_performance.trim()
            : "Các đối tác chủ lực tiếp tục duy trì tỷ trọng giao dịch tốt và đóng góp ổn định vào tổng GMV sàn.",
        risk_alerts: Array.isArray(parsed.risk_alerts)
          ? parsed.risk_alerts.map((r: any) => String(r).trim())
          : [
              "Một số sự kiện có tỷ lệ bán vé chưa đạt kỳ vọng cần được theo dõi tiến độ để kịp thời hỗ trợ truyền thông.",
            ],
        platform_growth_strategies: Array.isArray(
          parsed.platform_growth_strategies,
        )
          ? parsed.platform_growth_strategies.map((s: any) => String(s).trim())
          : [
              "Tiếp tục đa dạng hóa các thể loại sự kiện (hội thảo, kịch nghệ, thể thao) bên cạnh concert ca nhạc.",
              "Đẩy mạnh các chương trình hợp tác với các đơn vị tổ chức mới để mở rộng thị phần.",
            ],
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

    return {
      platform_financial_health:
        paidOrders > 0
          ? `Toàn sàn ghi nhận tổng GMV đạt ${new Intl.NumberFormat("vi-VN").format(totalGmv)} VND với ${paidOrders} đơn hàng hoàn tất. Doanh thu phí nền tảng 5% đạt ${new Intl.NumberFormat("vi-VN").format(platformFee)} VND.`
          : "Hệ thống đang tích lũy thêm dữ liệu giao dịch toàn sàn để đưa ra phân tích chuyên sâu.",
      top_organizers_performance:
        "Thị phần phân bổ giữa các đơn vị tổ chức đang trong tầm kiểm soát an toàn, dòng tiền đối soát được đảm bảo minh bạch qua cơ chế Escrow.",
      risk_alerts: [
        "Khuyến nghị rà soát định kỳ các sự kiện mở bán trên 14 ngày có tỷ lệ lấp đầy dưới 30% để có phương án hỗ trợ kịp thời.",
      ],
      platform_growth_strategies: [
        "Đẩy mạnh chính sách thu hút thêm các đối tác tổ chức sự kiện âm nhạc quy mô vừa và nhỏ.",
        "Tối ưu hóa phễu thanh toán PayOS để nâng cao hơn nữa tỷ lệ hoàn tất đơn hàng.",
      ],
      analyzed_at: new Date().toISOString(),
      is_cached: false,
    };
  }
}
