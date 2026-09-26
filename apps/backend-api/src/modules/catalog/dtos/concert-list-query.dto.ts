import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsOptional, IsString } from "class-validator";
import { PaginationDto } from "../../../shared/dtos/pagination.dto";

export enum ConcertListStatus {
  DRAFT = "DRAFT",
  PENDING_REVIEW = "PENDING_REVIEW",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  PUBLISHED = "PUBLISHED",
  COMPLETED = "COMPLETED",
}

export class ConcertListQueryDto extends PaginationDto {
  @ApiPropertyOptional({
    enum: ConcertListStatus,
    description: "Filter by status",
  })
  @IsOptional()
  @IsEnum(ConcertListStatus)
  status?: ConcertListStatus;

  @ApiPropertyOptional({
    example: "say hi",
    description: "Search by concert name",
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    example: "LIVE_MUSIC",
    description: "Filter by concert category",
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    example: "b3f572a1-2139-4dd7-897b-cf10972410a5",
    description: "Filter by organizer ID",
  })
  @IsOptional()
  @IsString()
  organizer_id?: string;
}
