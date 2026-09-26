import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsOptional } from "class-validator";
import { PaginationDto } from "../../../shared/dtos/pagination.dto";

export enum OrderStatusFilter {
  PENDING = "PENDING",
  PAID = "PAID",
  CANCELLED = "CANCELLED",
}

export class OrderListQueryDto extends PaginationDto {
  @ApiPropertyOptional({ enum: OrderStatusFilter })
  @IsOptional()
  @IsEnum(OrderStatusFilter)
  status?: OrderStatusFilter;
}
