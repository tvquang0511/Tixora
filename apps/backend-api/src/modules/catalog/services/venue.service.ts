import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { VenueRepository } from '../repositories/venue.repository';
import { CreateVenueDto } from '../dtos/create-venue.dto';
import { UpdateVenueDto } from '../dtos/update-venue.dto';
import { VenueResponseDto } from '../dtos/venue-response.dto';
import { VenueListQueryDto } from '../dtos/venue-list-query.dto';
import { PaginationMetaDto } from '../../../shared/dtos/pagination-meta.dto';
import { RedisService } from '../../../shared/redis';

export class VenueListResponseDto {
  data!: VenueResponseDto[];
  meta!: PaginationMetaDto;

  constructor(partial: Partial<VenueListResponseDto> = {}) {
    Object.assign(this, partial);
  }
}

@Injectable()
export class VenueService {
  private readonly logger = new Logger(VenueService.name);
  private readonly cacheTtlSeconds = 300; // 5 minutes fallback TTL

  constructor(
    private readonly venueRepo: VenueRepository,
    private readonly redisService: RedisService,
  ) { }

  async getVenues(query: VenueListQueryDto): Promise<VenueListResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const city = query.city?.trim();
    const search = query.search?.trim();
    const cacheKey = this.getVenueListCacheKey(page, limit, city, search);

    const cached = await this.redisService.getJson<VenueListResponseDto>(cacheKey);
    if (cached) {
      this.logger.log(`[REDIS] getVenues cache hit key=${cacheKey}`);
      return new VenueListResponseDto(cached);
    }

    this.logger.log(`[DB] getVenues cache miss key=${cacheKey}`);
    const { items, total } = await this.venueRepo.findManyWithPagination(
      page,
      limit,
      city,
      search,
    );

    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
    const meta = new PaginationMetaDto({
      totalItems: total,
      itemCount: items.length,
      itemsPerPage: limit,
      totalPages,
      currentPage: page,
    });

    const response = new VenueListResponseDto({ data: items, meta });
    await this.redisService.setJson(cacheKey, response, this.cacheTtlSeconds);
    return response;
  }

  async getVenueById(id: string): Promise<VenueResponseDto> {
    const cacheKey = this.getVenueDetailCacheKey(id);
    const cached = await this.redisService.getJson<VenueResponseDto>(cacheKey);
    if (cached) {
      return new VenueResponseDto(cached);
    }

    const venue = await this.venueRepo.findById(id);
    if (!venue) {
      throw new NotFoundException(`Venue with ID '${id}' not found`);
    }

    await this.redisService.setJson(cacheKey, venue, this.cacheTtlSeconds);
    return venue;
  }

  async createVenue(payload: CreateVenueDto): Promise<VenueResponseDto> {
    const created = await this.venueRepo.create(payload);
    await this.invalidateVenueCaches();
    return created;
  }

  async updateVenue(id: string, payload: UpdateVenueDto): Promise<VenueResponseDto> {
    const existing = await this.venueRepo.findById(id);
    if (!existing) {
      throw new NotFoundException(`Venue with ID '${id}' not found`);
    }

    const updated = await this.venueRepo.update(id, payload);
    await this.invalidateVenueCaches(id);
    return updated;
  }

  async deleteVenue(id: string): Promise<VenueResponseDto> {
    const existing = await this.venueRepo.findById(id);
    if (!existing) {
      throw new NotFoundException(`Venue with ID '${id}' not found`);
    }

    const linkedConcerts = await this.venueRepo.countConcertsByVenueId(id);
    if (linkedConcerts > 0) {
      throw new BadRequestException(
        `Cannot delete venue '${existing.name}' because it has ${linkedConcerts} active concert(s) scheduled.`,
      );
    }

    const deleted = await this.venueRepo.delete(id);
    await this.invalidateVenueCaches(id);
    return deleted;
  }

  private getVenueListCacheKey(
    page: number,
    limit: number,
    city?: string,
    search?: string,
  ): string {
    const normalizedCity = city?.toLowerCase() ?? 'all';
    const normalizedSearch = search?.toLowerCase() ?? 'all';
    return `venues:list:${page}:${limit}:${normalizedCity}:${normalizedSearch}`;
  }

  private getVenueDetailCacheKey(id: string): string {
    return `venues:detail:${id}`;
  }

  private async invalidateVenueCaches(id?: string): Promise<void> {
    await this.redisService.deleteByPattern('venues:list:*');
    if (id) {
      await this.redisService.delete(this.getVenueDetailCacheKey(id));
    }
  }
}
