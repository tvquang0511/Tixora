import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from "@nestjs/swagger";
import { OrganizerService } from "../services/organizer.service";
import { ApplyOrganizerDto } from "../dtos/apply-organizer.dto";
import { RejectOrganizerDto } from "../dtos/reject-organizer.dto";
import { UpdateOrganizerStatusDto } from "../dtos/update-organizer-status.dto";
import { UpdateOrganizerProfileDto } from "../dtos/update-organizer-profile.dto";
import { OrganizerRequestQueryDto } from "../dtos/organizer-request-query.dto";
import { JwtAuthGuard } from "../../../shared/guards/jwt-auth.guard";
import { RolesGuard } from "../../../shared/guards/roles.guard";
import { Roles } from "../../../shared/decorators/roles.decorator";

@Controller()
@ApiTags("Organizer - Partner Management")
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class OrganizerController {
  constructor(private readonly organizerService: OrganizerService) {}

  @Post("organizer/apply")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Submit application to become an event organizer" })
  async applyOrganizer(@Body() dto: ApplyOrganizerDto, @Req() req: any) {
    return this.organizerService.apply(req.user.sub, dto);
  }

  @Get("organizer/my-application")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get current user organizer application status" })
  async getMyApplication(@Req() req: any) {
    return this.organizerService.getMyApplication(req.user.sub);
  }

  @Get("organizer/profile")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get current user organizer profile" })
  async getOrganizerProfile(@Req() req: any) {
    return this.organizerService.getMyApplication(req.user.sub);
  }

  @Patch("organizer/profile")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ORGANIZER", "ADMIN")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update organizer profile" })
  async updateOrganizerProfile(
    @Req() req: any,
    @Body() dto: UpdateOrganizerProfileDto,
  ) {
    return this.organizerService.updateProfile(req.user.sub, dto);
  }

  @Get("admin/organizer-requests")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @ApiBearerAuth()
  @ApiOperation({ summary: "List organizer applications (Admin only)" })
  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "limit", required: false })
  @ApiQuery({
    name: "status",
    required: false,
    enum: ["PENDING", "APPROVED", "REJECTED"],
  })
  @ApiQuery({ name: "search", required: false })
  async listOrganizerRequests(@Query() query: OrganizerRequestQueryDto) {
    return this.organizerService.getRequests(query);
  }

  @Post("admin/organizer-requests/:id/approve")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Approve organizer application and promote user (Admin only)",
  })
  @ApiParam({ name: "id", description: "OrganizerProfile ID" })
  async approveOrganizerRequest(@Param("id") id: string) {
    return this.organizerService.approveRequest(id);
  }

  @Post("admin/organizer-requests/:id/reject")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Reject organizer application (Admin only)" })
  @ApiParam({ name: "id", description: "OrganizerProfile ID" })
  async rejectOrganizerRequest(
    @Param("id") id: string,
    @Body() dto: RejectOrganizerDto,
  ) {
    return this.organizerService.rejectRequest(id, dto);
  }

  @Patch("admin/organizer-requests/:id/status")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update organizer application status (Admin only)" })
  @ApiParam({ name: "id", description: "OrganizerProfile ID" })
  async updateOrganizerRequestStatus(
    @Param("id") id: string,
    @Body() dto: UpdateOrganizerStatusDto,
  ) {
    return this.organizerService.updateRequestStatus(id, dto);
  }
}
