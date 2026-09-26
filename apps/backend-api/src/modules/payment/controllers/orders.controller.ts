import {
  Controller,
  Get,
  Param,
  Query,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
  Post,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiBadRequestResponse,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../../../shared/guards/jwt-auth.guard";
import { RolesGuard } from "../../../shared/guards/roles.guard";
import { Roles } from "../../../shared/decorators/roles.decorator";
import { OrdersService } from "../services/orders.service";
import { OrderListQueryDto } from "../dtos/order-list-query.dto";
import { AdminOrderListQueryDto } from "../dtos/admin-order-list-query.dto";
import { OrderListResponseDto } from "../dtos/order-list-response.dto";
import { OrderDetailDto } from "../dtos/order-detail.dto";

@Controller("orders")
@ApiTags("Orders")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @ApiOperation({ summary: "Get current user order history" })
  @ApiOkResponse({ type: OrderListResponseDto })
  async getOrders(@Req() req: any, @Query() query: OrderListQueryDto) {
    return this.ordersService.getOrderHistory(req.user.sub, query);
  }

  @Get("admin")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @ApiOperation({ summary: "Admin search order history" })
  @ApiOkResponse({ type: OrderListResponseDto })
  async getAdminOrders(@Query() query: AdminOrderListQueryDto) {
    return this.ordersService.getAdminOrderHistory(query);
  }

  @Get("admin/:id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @ApiOperation({ summary: "Admin get any order detail" })
  @ApiOkResponse({ type: OrderDetailDto })
  @ApiNotFoundResponse({ description: "Order not found" })
  async getAdminOrderById(@Param("id") id: string) {
    return this.ordersService.getAdminOrderDetail(id);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a single order breakdown" })
  @ApiOkResponse({ type: OrderDetailDto })
  @ApiNotFoundResponse({ description: "Order not found" })
  async getOrderById(@Req() req: any, @Param("id") id: string) {
    return this.ordersService.getOrderDetail(req.user.sub, id);
  }

  @Post(":id/cancel")
  @ApiOperation({
    summary: "Cancel a pending order and release reserved tickets",
  })
  @ApiOkResponse({ type: OrderDetailDto })
  @ApiNotFoundResponse({ description: "Order not found" })
  @ApiBadRequestResponse({ description: "Order cannot be cancelled" })
  async cancelOrder(@Req() req: any, @Param("id") id: string) {
    return this.ordersService.cancelOrder(req.user.sub, id);
  }
}
