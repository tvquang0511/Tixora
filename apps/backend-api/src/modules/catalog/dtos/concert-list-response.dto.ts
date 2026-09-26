import { ApiProperty } from "@nestjs/swagger";
import { ConcertListItemDto } from "./concert-list-item.dto";
import { PaginationMetaDto } from "../../../shared/dtos/pagination-meta.dto";

export class ConcertListResponseDto {
  @ApiProperty({ type: [ConcertListItemDto] })
  data: ConcertListItemDto[] = [];

  @ApiProperty({ type: PaginationMetaDto })
  meta!: PaginationMetaDto;

  constructor(partial: Partial<ConcertListResponseDto> = {}) {
    Object.assign(this, partial);
  }
}
