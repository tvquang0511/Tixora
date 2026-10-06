import { Type } from "class-transformer";
import { ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  Max,
  Min,
} from "class-validator";
import { ConcertStatus } from "../../catalog/constants/concert-status.enum";

export class OrganizerRevenueRangeQueryDto {
  @ApiPropertyOptional({ example: "2026-07-01T00:00:00.000Z" })
  @IsDateString()
  @IsOptional()
  from?: string;

  @ApiPropertyOptional({ example: "2026-07-31T23:59:59.999Z" })
  @IsDateString()
  @IsOptional()
  to?: string;
}

export class OrganizerRevenueTrendQueryDto extends OrganizerRevenueRangeQueryDto {
  @ApiPropertyOptional({ example: "day", enum: ["day", "week", "month"] })
  @IsIn(["day", "week", "month"])
  @IsOptional()
  group_by?: "day" | "week" | "month";
}

export class OrganizerRevenueByConcertQueryDto extends OrganizerRevenueRangeQueryDto {
  @ApiPropertyOptional({ enum: ConcertStatus })
  @IsIn(Object.values(ConcertStatus))
  @IsOptional()
  status?: ConcertStatus;

  @ApiPropertyOptional({ example: 50, minimum: 1, maximum: 100 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number;
}
