import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  IsInt,
  Min,
  IsUrl,
  IsArray,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class VenueZonePresetDto {
  @ApiProperty({ example: 'VIP_A' })
  @IsString()
  @IsNotEmpty()
  code!: string;

  @ApiProperty({ example: 'Khu VIP A' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ example: 2500000 })
  @IsOptional()
  @IsInt()
  @Min(0)
  default_price?: number;

  @ApiPropertyOptional({ example: '#f59e0b' })
  @IsOptional()
  @IsString()
  default_color?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  gate_number?: number;
}

export class CreateVenueDto {
  @ApiProperty({ example: 'Sân vận động Quốc gia Mỹ Đình' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @ApiProperty({ example: 'Hà Nội' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  city!: string;

  @ApiProperty({ example: 'Đường Lê Đức Thọ, Phường Mỹ Đình 1, Quận Nam Từ Liêm, Hà Nội' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  address!: string;

  @ApiProperty({ example: 40000 })
  @IsInt()
  @Min(1)
  capacity!: number;

  @ApiPropertyOptional({ example: 'https://cdn.tixora.local/maps/my-dinh-stadium.svg' })
  @IsOptional()
  @IsString()
  @IsUrl()
  svg_template_url?: string;

  @ApiPropertyOptional({ type: [VenueZonePresetDto] })
  @IsOptional()
  @IsArray()
  zone_presets?: VenueZonePresetDto[];
}
