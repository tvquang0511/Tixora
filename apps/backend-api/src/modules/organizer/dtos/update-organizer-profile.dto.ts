import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class UpdateOrganizerProfileDto {
  @ApiPropertyOptional({ example: "Sài Gòn Music Entertainment" })
  @IsOptional()
  @IsString()
  organization_name?: string;

  @ApiPropertyOptional({ example: "0987654321" })
  @IsOptional()
  @IsString()
  phone_number?: string;

  @ApiPropertyOptional({ example: "https://example.com/license.pdf" })
  @IsOptional()
  @IsString()
  business_license_url?: string;

  @ApiPropertyOptional({ example: "https://facebook.com/sgmusic" })
  @IsOptional()
  @IsString()
  portfolio_url?: string;

  @ApiPropertyOptional({ example: "CONG TY TNHH SAI GON MUSIC" })
  @IsOptional()
  @IsString()
  bank_account_name?: string;

  @ApiPropertyOptional({ example: "190367890123" })
  @IsOptional()
  @IsString()
  bank_account_number?: string;

  @ApiPropertyOptional({ example: "Techcombank" })
  @IsOptional()
  @IsString()
  bank_name?: string;

  @ApiPropertyOptional({ example: "Nguyễn Văn A" })
  @IsOptional()
  @IsString()
  full_name?: string;
}
