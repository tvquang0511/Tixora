import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class ApplyOrganizerDto {
  @ApiProperty({ example: "Sài Gòn Music Entertainment" })
  @IsString()
  @IsNotEmpty()
  organization_name!: string;

  @ApiProperty({ example: "0314889922" })
  @IsString()
  @IsNotEmpty()
  tax_code_or_id!: string;

  @ApiProperty({ example: "0987654321" })
  @IsString()
  @IsNotEmpty()
  phone_number!: string;

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
}
