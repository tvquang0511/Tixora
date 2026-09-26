import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";
import { OrderListQueryDto } from "./order-list-query.dto";

export class AdminOrderListQueryDto extends OrderListQueryDto {
  @ApiPropertyOptional({
    example: "concert night",
    description: "Search by order id, concert name, user email, or user name",
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    example: "VNPAY",
    description: "Filter by payment method",
  })
  @IsOptional()
  @IsString()
  payment_method?: string;

  @ApiPropertyOptional({
    example: "550e8400-e29b-41d4-a716-446655440000",
    description: "Filter by user id",
  })
  @IsOptional()
  @IsString()
  user_id?: string;

  @ApiPropertyOptional({
    example: "550e8400-e29b-41d4-a716-446655440000",
    description: "Filter by concert id",
  })
  @IsOptional()
  @IsString()
  concert_id?: string;
}
