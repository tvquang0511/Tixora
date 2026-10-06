import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class UpdateOrganizerStatusDto {
  @ApiProperty({
    enum: ["PENDING", "APPROVED", "REJECTED"],
    example: "APPROVED",
  })
  @IsNotEmpty()
  @IsIn(["PENDING", "APPROVED", "REJECTED"])
  status!: "PENDING" | "APPROVED" | "REJECTED";

  @ApiPropertyOptional({
    example: "Giấy phép kinh doanh không khớp thông tin",
  })
  @IsOptional()
  @IsString()
  rejection_reason?: string;
}
