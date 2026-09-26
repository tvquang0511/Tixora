import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../shared/prisma.service';
import { CreateVenueDto } from '../dtos/create-venue.dto';
import { UpdateVenueDto } from '../dtos/update-venue.dto';
import { VenueResponseDto } from '../dtos/venue-response.dto';

type VenueRow = {
  id: string;
  name: string;
  city: string;
  address: string;
  capacity: number;
  svg_template_url: string | null;
  zone_presets: Prisma.JsonValue | null;
  created_at: Date;
  updated_at: Date;
};

@Injectable()
export class VenueRepository {
  constructor(private readonly prisma: PrismaService) { }

  async findManyWithPagination(
    page: number,
    limit: number,
    city?: string,
    search?: string,
  ): Promise<{ items: VenueResponseDto[]; total: number; page: number; limit: number }> {
    const take = limit;
    const skip = Math.max(0, (page - 1) * limit);
    const trimmedCity = city?.trim();
    const trimmedSearch = search?.trim();

    const where: Prisma.VenueWhereInput = {
      ...(trimmedCity
        ? {
          city: {
            contains: trimmedCity,
            mode: 'insensitive',
          },
        }
        : {}),
      ...(trimmedSearch
        ? {
          OR: [
            { name: { contains: trimmedSearch, mode: 'insensitive' } },
            { address: { contains: trimmedSearch, mode: 'insensitive' } },
          ],
        }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.venue.findMany({
        skip,
        take,
        where,
        orderBy: { name: 'asc' },
      }),
      this.prisma.venue.count({ where }),
    ]);

    const mapped = items.map((v: VenueRow) => this.mapToDto(v));
    return { items: mapped, total, page, limit };
  }

  async findById(id: string): Promise<VenueResponseDto | null> {
    const venue = await this.prisma.venue.findUnique({
      where: { id },
    });
    if (!venue) return null;
    return this.mapToDto(venue);
  }

  async create(payload: CreateVenueDto): Promise<VenueResponseDto> {
    const venue = await this.prisma.venue.create({
      data: {
        name: payload.name,
        city: payload.city,
        address: payload.address,
        capacity: payload.capacity,
        svg_template_url: payload.svg_template_url ?? null,
        zone_presets: payload.zone_presets ? JSON.parse(JSON.stringify(payload.zone_presets)) : Prisma.JsonNull,
      },
    });
    return this.mapToDto(venue);
  }

  async update(id: string, payload: UpdateVenueDto): Promise<VenueResponseDto> {
    const venue = await this.prisma.venue.update({
      where: { id },
      data: {
        name: payload.name,
        city: payload.city,
        address: payload.address,
        capacity: payload.capacity,
        svg_template_url: payload.svg_template_url,
        zone_presets: payload.zone_presets ? JSON.parse(JSON.stringify(payload.zone_presets)) : undefined,
      },
    });
    return this.mapToDto(venue);
  }

  async delete(id: string): Promise<VenueResponseDto> {
    const venue = await this.prisma.venue.delete({
      where: { id },
    });
    return this.mapToDto(venue);
  }

  async countConcertsByVenueId(venueId: string): Promise<number> {
    return this.prisma.concert.count({
      where: { venue_id: venueId, status: { not: 'CANCELLED' } },
    });
  }

  private mapToDto(row: VenueRow): VenueResponseDto {
    return new VenueResponseDto({
      id: row.id,
      name: row.name,
      city: row.city,
      address: row.address,
      capacity: row.capacity,
      svg_template_url: row.svg_template_url,
      zone_presets: row.zone_presets as any,
      created_at: row.created_at,
      updated_at: row.updated_at,
    });
  }
}
