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

    const systemInstruction = `Bạn là Giám đốc Phân tích Doanh thu & Tối ưu Thương mại Sự kiện tại nền tảng bán vé Tixora.
Nhiệm vụ: Phân tích sâu số liệu kinh doanh của Ban tổ chức dưới đây, đưa ra nhận định THỰC TẾ, SẮC BÉN, DỰA VÀO DỮ LIỆU CỤ THỂ (DATA-DRIVEN), TUYỆT ĐỐI KHÔNG DÙNG VĂN MẪU HAY LỜI KHUYÊN SÁCH VỞ CHUNG CHUNG.

QUY TẮC BẮT BUỘC:
1. Luôn nêu đích danh tên đêm nhạc, số tiền (VND), số vé đã bán và tỷ lệ lấp đầy % thực tế từ bảng dữ liệu.
2. Nêu rõ ngày đạt đỉnh doanh thu từ chuỗi số liệu giao dịch gần đây.
3. Chỉ rõ show nào đang là trụ cột doanh thu và show nào đang ở ngưỡng rủi ro lấp đầy thấp.
4. Đề xuất chiến thuật (tactical_recommendations) phải gắn với sự kiện cụ thể, hành động rõ ràng (flash sale, combo vé, chính sách giá) để có thể triển khai ngay.

Định dạng JSON duy nhất:
{
  "peak_purchasing_hours": "Phân tích ngày/giai đoạn bán vé bùng nổ nhất dựa vào số liệu giao dịch, dẫn chứng số tiền và đơn hàng.",
  "tier_performance_analysis": "Chỉ rõ concert nào đạt doanh thu cao nhất (số tiền, số vé), concert nào có tỷ lệ lấp đầy thấp cần can thiệp.",
  "tactical_recommendations": [
    "Hành động thực chiến 1 kèm tên show và giải pháp số liệu cụ thể",
    "Hành động thực chiến 2 kèm giải pháp kích cầu cụ thể"
  ],
  "occupancy_summary": "Đánh giá tỷ lệ lấp đầy khán phòng thực tế và cảnh báo rủi ro tài chính cho các show chậm tiến độ."
}`;

    const prompt = `Dưới đây là bảng số liệu kinh doanh thực tế của Ban tổ chức:
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
          typeof parsed.peak_purchasing_hours === "string" &&
          parsed.peak_purchasing_hours.trim().length > 10
            ? parsed.peak_purchasing_hours.trim()
            : this.buildFallbackInsights(metricsPayload).peak_purchasing_hours,
        tier_performance_analysis:
          typeof parsed.tier_performance_analysis === "string" &&
          parsed.tier_performance_analysis.trim().length > 10
            ? parsed.tier_performance_analysis.trim()
            : this.buildFallbackInsights(metricsPayload)
                .tier_performance_analysis,
        tactical_recommendations:
          Array.isArray(parsed.tactical_recommendations) &&
          parsed.tactical_recommendations.length > 0
            ? parsed.tactical_recommendations.map((r: any) => String(r).trim())
            : this.buildFallbackInsights(metricsPayload)
                .tactical_recommendations,
        occupancy_summary:
          typeof parsed.occupancy_summary === "string" &&
          parsed.occupancy_summary.trim().length > 10
            ? parsed.occupancy_summary.trim()
            : this.buildFallbackInsights(metricsPayload).occupancy_summary,
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
    const netRevenue = payload?.summary?.net_revenue || 0;
    const ticketsSold = payload?.summary?.tickets_sold || 0;
    const aov = payload?.summary?.aov || 0;
    const concerts: any[] = payload?.concerts || [];
    const trends: any[] = payload?.recent_daily_trends || [];

    // Tìm show có doanh thu cao nhất
    const sortedByRev = [...concerts].sort((a, b) => (b.revenue || 0) - (a.revenue || 0));
    const topShow = sortedByRev[0];

    // Tìm show có tỷ lệ lấp đầy thấp nhất
    const sortedByOcc = [...concerts].sort((a, b) => {
      const occA = parseFloat(a.occupancy_rate) || 0;
      const occB = parseFloat(b.occupancy_rate) || 0;
      return occA - occB;
    });
    const lowShow = sortedByOcc[0];

    // Tìm ngày bán chạy nhất
    const topTrend = [...trends].sort((a, b) => (b.revenue || 0) - (a.revenue || 0))[0];

    const formattedGmv = new Intl.NumberFormat("vi-VN").format(totalGmv);
    const formattedNet = new Intl.NumberFormat("vi-VN").format(netRevenue);
    const formattedAov = new Intl.NumberFormat("vi-VN").format(aov);

    let peakText = `Tổng doanh thu đạt ${formattedGmv} VND (${totalOrders} đơn hàng, thực nhận ${formattedNet} VND). Giá trị trung bình mỗi đơn (AOV) đạt ${formattedAov} VND.`;
    if (topTrend && topTrend.revenue > 0) {
      peakText += ` Ngày ghi nhận bùng nổ doanh số cao nhất là ${topTrend.date} với ${new Intl.NumberFormat("vi-VN").format(topTrend.revenue)} VND (${topTrend.tickets_sold} vé).`;
    }

    let tierText: string;
    if (topShow) {
      tierText = `Đêm nhạc dẫn đầu doanh thu là "${topShow.name}" đạt ${new Intl.NumberFormat("vi-VN").format(topShow.revenue)} VND với ${topShow.tickets_sold}/${topShow.total_capacity} vé (Tỷ lệ lấp đầy: ${topShow.occupancy_rate}).`;
      if (sortedByRev.length > 1) {
        tierText += ` Tổng cộng ban tổ chức đang vận hành ${concerts.length} sự kiện trên sàn.`;
      }
    } else {
      tierText = `Đã phân phối ${ticketsSold} vé trên toàn bộ các sự kiện đang hoạt động.`;
    }

    let occText: string;
    if (lowShow && parseFloat(lowShow.occupancy_rate) < 40) {
      occText = `Cảnh báo: Sự kiện "${lowShow.name}" mới đạt ${lowShow.occupancy_rate} công suất phòng (${lowShow.tickets_sold}/${lowShow.total_capacity} vé). Cần gấp rút đẩy mạnh chuyển đổi trước ngày diễn.`;
    } else if (topShow) {
      occText = `Tỷ lệ lấp đầy bình quân được bảo đảm tốt, tiêu biểu như "${topShow.name}" đạt ${topShow.occupancy_rate} công suất ghế.`;
    } else {
      occText = "Chưa ghi nhận đủ công suất vé để đánh giá tỷ lệ lấp đầy.";
    }

    const recommendations: string[] = [];
    if (lowShow && parseFloat(lowShow.occupancy_rate) < 50) {
      recommendations.push(
        `Kích hoạt Flash Sale 10-15% hoặc combo vé nhóm 3-4 người cho "${lowShow.name}" để giải phóng lượng ghế trống.`,
      );
    }
    if (topShow) {
      recommendations.push(
        `Xem xét bổ sung thêm số lượng giới hạn vé trải nghiệm đặc biệt (Soundcheck / VIP Gift) cho "${topShow.name}" để tối đa hóa doanh thu trung bình mỗi khách.`,
      );
    }
    if (recommendations.length === 0) {
      recommendations.push(
        "Tập trung truyền thông vào khung giờ 20h00 - 22h00 các ngày mở đợt vé mới.",
        "Xây dựng combo mua vé kèm đồ lưu niệm để gia tăng giá trị đơn hàng trung bình.",
      );
    }

    return {
      peak_purchasing_hours: peakText,
      tier_performance_analysis: tierText,
      tactical_recommendations: recommendations,
      occupancy_summary: occText,
      analyzed_at: new Date().toISOString(),
      is_cached: false,
    };
  }
}
