import { ApiProperty } from "@nestjs/swagger";
import { PaginationMetaDto } from "../../../shared/dtos/pagination-meta.dto";
import { OrderListItemDto } from "./order-list-item.dto";

export class OrderListResponseDto {
  @ApiProperty({ type: [OrderListItemDto] })
  data!: OrderListItemDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta!: PaginationMetaDto;

  constructor(partial: Partial<OrderListResponseDto> = {}) {
    Object.assign(this, partial);
  }
}
