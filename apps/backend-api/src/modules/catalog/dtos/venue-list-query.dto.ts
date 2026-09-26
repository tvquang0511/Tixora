import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationDto } from '../../../shared/dtos/pagination.dto';

export class VenueListQueryDto extends PaginationDto {
  @ApiPropertyOptional({ example: 'Hà Nội', description: 'Filter venues by city' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({ example: 'Mỹ Đình', description: 'Search venue by name or address' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;
}
