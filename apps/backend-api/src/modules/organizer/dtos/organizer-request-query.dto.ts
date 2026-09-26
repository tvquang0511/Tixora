import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";
import { PaginationDto } from "../../../shared/dtos/pagination.dto";

export class OrganizerRequestQueryDto extends PaginationDto {
  @ApiPropertyOptional({
    example: "PENDING",
    enum: ["PENDING", "APPROVED", "REJECTED"],
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({
    example: "Sài Gòn",
    description: "Search by organization name or user email",
  })
  @IsOptional()
  @IsString()
  search?: string;
}
