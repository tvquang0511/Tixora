import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationDto } from '../../../shared/dtos/pagination.dto';

export enum ConcertListStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  COMPLETED = 'COMPLETED',
}

export class ConcertListQueryDto extends PaginationDto {
  @ApiPropertyOptional({ enum: ConcertListStatus, description: 'Filter by status' })
  @IsOptional()
  @IsEnum(ConcertListStatus)
  status?: ConcertListStatus;

  @ApiPropertyOptional({ example: 'say hi', description: 'Search by concert name' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;

  @ApiPropertyOptional({ example: 'LIVE_MUSIC', description: 'Filter by concert category' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  category?: string;
}
