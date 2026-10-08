import { Controller, Get, Query, UseGuards } from "@nestjs/common";
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
import { AdminRevenueAiService } from "../services/admin-revenue-ai.service";
import { AdminRevenueInsightDto } from "../dtos/admin-revenue-insight.dto";

@ApiTags("Admin - Revenue AI Strategic Insights")
@Controller("admin/revenue")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN")
@ApiBearerAuth()
export class AdminRevenueAiController {
  constructor(private readonly revenueAiService: AdminRevenueAiService) {}

  @Get("ai-insights")
  @ApiOperation({
    summary:
      "Lấy báo cáo phân tích chiến lược doanh thu toàn sàn bằng AI cho Quản trị viên (SuperAdmin)",
  })
  @ApiQuery({
    name: "refresh",
    required: false,
    type: Boolean,
    description: "Bỏ qua bộ nhớ đệm Redis và yêu cầu AI phân tích lại toàn sàn",
  })
  @ApiOkResponse({ type: AdminRevenueInsightDto })
  async getAiInsights(
    @Query("refresh") refresh?: string,
  ): Promise<AdminRevenueInsightDto> {
    const shouldRefresh = refresh === "true" || refresh === "1";
    return this.revenueAiService.getInsights(shouldRefresh);
  }
}
