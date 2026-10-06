import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { Roles } from "../../../shared/decorators/roles.decorator";
import {
  PermissionCode,
  Permissions,
} from "../../../shared/decorators/permissions.decorator";
import { JwtAuthGuard } from "../../../shared/guards/jwt-auth.guard";
import { RolesGuard } from "../../../shared/guards/roles.guard";
import { OrganizerRevenueService } from "../services/organizer-revenue.service";
import {
  OrganizerRevenueByConcertQueryDto,
  OrganizerRevenueRangeQueryDto,
  OrganizerRevenueTrendQueryDto,
} from "../dtos/organizer-revenue-query.dto";

@Controller("organizer/revenue")
@ApiTags("Organizer Revenue")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ORGANIZER", "ADMIN")
@Permissions(PermissionCode.VIEW_REVENUE)
@ApiBearerAuth()
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class OrganizerRevenueController {
  constructor(private readonly revenueService: OrganizerRevenueService) {}

  @Get("summary")
  @ApiOperation({
    summary: "Get organizer revenue KPI summary with period growth",
  })
  @ApiOkResponse({ description: "Organizer revenue KPI summary" })
  getSummary(@Query() query: OrganizerRevenueRangeQueryDto, @Req() req: any) {
    return this.revenueService.getSummary(req.user.sub, query);
  }

  @Get("trend")
  @ApiOperation({
    summary: "Get organizer revenue trend over time (day/week/month)",
  })
  @ApiOkResponse({ description: "Organizer revenue trend" })
  getTrend(@Query() query: OrganizerRevenueTrendQueryDto, @Req() req: any) {
    return this.revenueService.getTrend(req.user.sub, query);
  }

  @Get("by-concert")
  @ApiOperation({
    summary: "Get revenue breakdown grouped by organizer concerts",
  })
  @ApiOkResponse({ description: "Concert revenue list for organizer" })
  getByConcert(
    @Query() query: OrganizerRevenueByConcertQueryDto,
    @Req() req: any,
  ) {
    return this.revenueService.getByConcert(req.user.sub, query);
  }

  @Get("concerts/:concert_id/detail")
  @ApiOperation({ summary: "Get detailed revenue analytics for one concert" })
  @ApiOkResponse({ description: "Concert revenue detail and tier analysis" })
  getConcertDetail(
    @Param("concert_id", ParseUUIDPipe) concertId: string,
    @Query() query: OrganizerRevenueRangeQueryDto,
    @Req() req: any,
  ) {
    return this.revenueService.getConcertDetail(req.user.sub, concertId, query);
  }

  @Get("settlement")
  @ApiOperation({
    summary: "Get organizer settlement status, net payout, and bank info",
  })
  @ApiOkResponse({ description: "Organizer payout and settlement summary" })
  getSettlement(
    @Query() query: OrganizerRevenueRangeQueryDto,
    @Req() req: any,
  ) {
    return this.revenueService.getSettlement(req.user.sub, query);
  }
}
