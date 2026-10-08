import { Injectable, Logger } from "@nestjs/common";
import { OrganizerRevenueService } from "./organizer-revenue.service";
import { GeminiClient } from "../../../shared/ai/gemini.client";
import { RedisService } from "../../../shared/redis";
import { OrganizerRevenueInsightDto } from "../dtos/organizer-revenue-insight.dto";

@Injectable()
export class OrganizerRevenueAiService {
  private readonly logger = new Logger(OrganizerRevenueAiService.name);
  private readonly CACHE_TTL_SECONDS = 3600; // 1 hour

  constructor(
    private readonly revenueService: OrganizerRevenueService,
    private readonly geminiClient: GeminiClient,
    private readonly redisService: RedisService,
  ) {}

  async getInsights(
    organizerId: string,
    refresh = false,
  ): Promise<OrganizerRevenueInsightDto> {
    const cacheKey = `organizer:revenue:ai-insights:${organizerId}`;

    // 1. Check Redis Cache unless refresh requested
    if (!refresh) {
      try {
        const cached =
          await this.redisService.getJson<OrganizerRevenueInsightDto>(cacheKey);
        if (cached) {
          return {
            ...cached,
            is_cached: true,
          };
        }
      } catch (err) {
        this.logger.warn(
          `Failed to read revenue AI cache for ${organizerId}`,
          err,
        );
      }
    }

    // 2. Fetch statistics from OrganizerRevenueService
    const [summary, trend, concertsRes] = await Promise.all([
      this.revenueService.getSummary(organizerId, {}),
      this.revenueService.getTrend(organizerId, { group_by: "day" }),
      this.revenueService.getByConcert(organizerId, { limit: 10 }),
    ]);

    // 3. Compact data payload to send to LLM
    const metricsPayload = {
      summary: {
        total_gmv: summary.total_gmv,
        net_revenue: summary.total_net_revenue,
        tickets_sold: summary.total_tickets_sold,
        paid_orders: summary.paid_orders,
        aov: summary.aov,
        growth: summary.growth,
      },
      recent_daily_trends: trend.items.slice(-14).map((i) => ({
        date: i.period,
        revenue: i.revenue,
        tickets_sold: i.tickets_sold,
        orders: i.paid_orders,
      })),
      concerts: concertsRes.items.map((c) => ({
        name: c.concert_name,
        status: c.status,
        revenue: c.revenue,
        tickets_sold: c.tickets_sold,
        total_capacity: c.total_capacity,
        occupancy_rate: `${c.occupancy_rate}%`,
      })),
    };

    const systemInstruction = `Bạn là một chuyên gia tư vấn chiến lược kinh doanh và tối ưu hóa bán vé sự kiện cho nền tảng Tixora.
Dựa vào số liệu bán vé thực tế của Ban tổ chức dưới đây, hãy đưa ra bản phân tích cô đọng, sắc bén và hữu ích bằng tiếng Việt.

Yêu cầu định dạng: Trả về duy nhất JSON object hợp lệ (không markdown thừa):
{
  "peak_purchasing_hours": "Nhận xét cụ thể về ngày/khung thời gian bán vé chạy nhất, thời điểm dòng tiền đổ về mạnh nhất.",
  "tier_performance_analysis": "Phân tích tốc độ tiêu thụ vé, concert nào đang bán chạy nhất và concert nào có tỷ lệ lấp đầy thấp.",
  "tactical_recommendations": [
    "Đề xuất chiến thuật 1 (ví dụ: giờ vàng đăng bài, kênh đẩy mạnh...)",
    "Đề xuất chiến thuật 2 (ví dụ: mở Flash Sale, tặng quà Merch cho hạng vé còn tồn...)"
  ],
  "occupancy_summary": "Đánh giá tổng quan tỷ lệ lấp đầy khán phòng của các sự kiện và cảnh báo show nào cần thúc đẩy."
}

Hãy đưa ra nhận định thực tế, súc tích, mang tính hành động cao (Actionable).`;

    const prompt = `Dưới đây là bảng số liệu kinh doanh của Ban tổ chức:
${JSON.stringify(metricsPayload, null, 2)}`;

    let responseJsonText: string;
    try {
      responseJsonText = await this.geminiClient.generateContent(prompt, {
        jsonMode: true,
        systemInstruction,
      });
    } catch (err: unknown) {
      this.logger.error(
        "Gemini failed during revenue insights generation",
        err,
      );
      return this.buildFallbackInsights(metricsPayload);
    }

    try {
      const parsed = this.parseJsonSafely(responseJsonText);
      const sanitized: OrganizerRevenueInsightDto = {
        peak_purchasing_hours:
          typeof parsed.peak_purchasing_hours === "string"
            ? parsed.peak_purchasing_hours.trim()
            : "Lượng giao dịch diễn ra sôi nổi nhất vào các ngày cuối tuần và các đợt phát hành vé đợt đầu.",
        tier_performance_analysis:
          typeof parsed.tier_performance_analysis === "string"
            ? parsed.tier_performance_analysis.trim()
            : "Các hạng vé tiêu chuẩn và vé VIP ghi nhận nhu cầu tốt từ người hâm mộ.",
        tactical_recommendations: Array.isArray(parsed.tactical_recommendations)
          ? parsed.tactical_recommendations.map((r: any) => String(r).trim())
          : [
              "Tận dụng khung giờ cao điểm buổi tối để đẩy mạnh thông báo và chiến dịch truyền thông.",
              "Xem xét triển khai ưu đãi combo vé nhóm để kích cầu các khu vực ghế còn trống.",
            ],
        occupancy_summary:
          typeof parsed.occupancy_summary === "string"
            ? parsed.occupancy_summary.trim()
            : "Tỷ lệ lấp đầy khán phòng duy trì ở mức ổn định theo lộ trình mở bán.",
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
          "Failed to set Redis cache for revenue insights",
          cacheErr,
        );
      }

      return sanitized;
    } catch (parseErr) {
      this.logger.error("Failed to parse Gemini output JSON", parseErr);
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

  private buildFallbackInsights(payload: any): OrganizerRevenueInsightDto {
    const totalOrders = payload?.summary?.paid_orders || 0;
    const totalGmv = payload?.summary?.total_gmv || 0;

    return {
      peak_purchasing_hours:
        totalOrders > 0
          ? `Ghi nhận ${totalOrders} đơn hàng thành công với tổng GMV ${new Intl.NumberFormat("vi-VN").format(totalGmv)} VND. Hoạt động giao dịch tập trung nhiều nhất vào các ngày mở bán đầu tiên.`
          : "Chưa ghi nhận đủ khối lượng giao dịch để xác định khung giờ mua vé đỉnh điểm.",
      tier_performance_analysis:
        "Tốc độ bán vé duy trì theo tiến độ kế hoạch. Khán giả có xu hướng đặt vé sớm cho các vị trí trải nghiệm tốt nhất.",
      tactical_recommendations: [
        "Đẩy mạnh quảng bá trên mạng xã hội vào các khung giờ 19:30 - 21:30 các ngày thứ Năm và thứ Sáu.",
        "Thiết lập thêm chính sách quà tặng kèm (fanzone gift) hoặc vé nhóm để thúc đẩy chuyển đổi.",
      ],
      occupancy_summary:
        "Hệ thống khuyến nghị tiếp tục theo dõi sát sao biểu đồ tăng trưởng doanh số theo ngày để có chiến lược tiếp thị kịp thời.",
      analyzed_at: new Date().toISOString(),
      is_cached: false,
    };
  }
}
