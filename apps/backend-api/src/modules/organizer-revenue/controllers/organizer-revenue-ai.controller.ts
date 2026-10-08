import { Controller, Get, Query, Req, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../../../shared/guards/jwt-auth.guard";
import { RolesGuard } from "../../../shared/guards/roles.guard";
import { Roles } from "../../../shared/decorators/roles.decorator";
import { OrganizerRevenueAiService } from "../services/organizer-revenue-ai.service";
import { OrganizerRevenueInsightDto } from "../dtos/organizer-revenue-insight.dto";

@ApiTags("Organizer - Revenue AI Insights")
@Controller("organizer/revenue")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ORGANIZER", "ADMIN")
@ApiBearerAuth()
export class OrganizerRevenueAiController {
  constructor(private readonly revenueAiService: OrganizerRevenueAiService) {}

  @Get("ai-insights")
  @ApiOperation({
    summary:
      "Lấy báo cáo nhận xét doanh thu & khung giờ vàng bằng AI cho Ban tổ chức",
  })
  @ApiQuery({
    name: "refresh",
    required: false,
    type: Boolean,
    description: "Bỏ qua bộ nhớ đệm Redis và yêu cầu AI phân tích mới",
  })
  @ApiOkResponse({ type: OrganizerRevenueInsightDto })
  async getAiInsights(
    @Req() req: any,
    @Query("refresh") refresh?: string,
  ): Promise<OrganizerRevenueInsightDto> {
    const organizerId = req.user?.sub || req.user?.id;
    const shouldRefresh = refresh === "true" || refresh === "1";
    return this.revenueAiService.getInsights(organizerId, shouldRefresh);
  }
}
