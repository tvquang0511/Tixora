import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VenueZonePresetDto } from './create-venue.dto';

export class VenueResponseDto {
  @ApiProperty({ example: 'b3f572a1-2139-4dd7-897b-cf10972410a5' })
  id!: string;

  @ApiProperty({ example: 'Sân vận động Quốc gia Mỹ Đình' })
  name!: string;

  @ApiProperty({ example: 'Hà Nội' })
  city!: string;

  @ApiProperty({ example: 'Đường Lê Đức Thọ, Phường Mỹ Đình 1, Quận Nam Từ Liêm, Hà Nội' })
  address!: string;

  @ApiProperty({ example: 40000 })
  capacity!: number;

  @ApiPropertyOptional({ example: 'https://cdn.tixora.local/maps/my-dinh-stadium.svg' })
  svg_template_url?: string | null;

  @ApiPropertyOptional({ type: [VenueZonePresetDto] })
  zone_presets?: VenueZonePresetDto[] | null;

  @ApiProperty()
  created_at!: Date;

  @ApiProperty()
  updated_at!: Date;

  constructor(partial: Partial<VenueResponseDto> = {}) {
    Object.assign(this, partial);
  }
}
