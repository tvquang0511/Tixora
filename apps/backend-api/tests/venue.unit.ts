import test from 'node:test';
import assert from 'node:assert/strict';
import { fn } from 'jest-mock';
import { VenueService, VenueListResponseDto } from '../src/modules/catalog/services/venue.service';
import { VenueResponseDto } from '../src/modules/catalog/dtos/venue-response.dto';
import { PaginationMetaDto } from '../src/shared/dtos/pagination-meta.dto';
import { NotFoundException, BadRequestException } from '@nestjs/common';

function createService() {
  const redisService = {
    getJson: fn(),
    setJson: fn(),
    delete: fn(),
    deleteByPattern: fn(),
  };

  const venueRepo = {
    findManyWithPagination: fn(),
    findById: fn(),
    create: fn(),
    update: fn(),
    delete: fn(),
    countConcertsByVenueId: fn(),
  };

  const service = new VenueService(venueRepo as any, redisService as any);
  (service as any).logger = {
    log: fn(),
    warn: fn(),
    error: fn(),
  };

  return { service, redisService, venueRepo };
}

test('VenueService: getVenues uses DB on cache miss and stores result in Redis', async () => {
  const { service, redisService, venueRepo } = createService();

  redisService.getJson.mockResolvedValue(null);
  venueRepo.findManyWithPagination.mockResolvedValue({
    items: [
      new VenueResponseDto({
        id: 'venue-1',
        name: 'Sân vận động Mỹ Đình',
        city: 'Hà Nội',
        address: 'Lê Đức Thọ',
        capacity: 40000,
        svg_template_url: null,
        zone_presets: null,
        created_at: new Date(),
        updated_at: new Date(),
      }),
    ],
    total: 1,
  });
  redisService.setJson.mockResolvedValue(true);

  const result = await service.getVenues({ page: 1, limit: 10 });

  assert.equal(venueRepo.findManyWithPagination.mock.calls.length, 1);
  assert.equal(redisService.setJson.mock.calls.length, 1);
  assert.equal(result.data.length, 1);
  assert.equal(result.meta.totalItems, 1);
});

test('VenueService: getVenues returns cached result without querying DB', async () => {
  const { service, redisService, venueRepo } = createService();

  const cached = new VenueListResponseDto({
    data: [
      new VenueResponseDto({
        id: 'cached-1',
        name: 'Cached Venue',
        city: 'TP.HCM',
        address: 'Quận 7',
        capacity: 15000,
        created_at: new Date(),
        updated_at: new Date(),
      }),
    ],
    meta: new PaginationMetaDto({
      totalItems: 1,
      itemCount: 1,
      itemsPerPage: 10,
      totalPages: 1,
      currentPage: 1,
    }),
  });

  redisService.getJson.mockResolvedValue(cached);

  const result = await service.getVenues({ page: 1, limit: 10 });

  assert.equal(venueRepo.findManyWithPagination.mock.calls.length, 0);
  assert.equal(result.data[0].name, 'Cached Venue');
});

test('VenueService: getVenueById throws NotFoundException when not found', async () => {
  const { service, redisService, venueRepo } = createService();

  redisService.getJson.mockResolvedValue(null);
  venueRepo.findById.mockResolvedValue(null);

  await assert.rejects(
    async () => {
      await service.getVenueById('non-existent');
    },
    (err: any) => {
      assert.ok(err instanceof NotFoundException);
      assert.match(err.message, /Venue with ID 'non-existent' not found/);
      return true;
    },
  );
});

test('VenueService: createVenue saves to DB and invalidates Redis list cache', async () => {
  const { service, redisService, venueRepo } = createService();

  const createdVenue = new VenueResponseDto({
    id: 'new-venue',
    name: 'Nhà thi đấu Phú Thọ',
    city: 'TP.HCM',
    address: 'Lữ Gia',
    capacity: 8000,
    created_at: new Date(),
    updated_at: new Date(),
  });

  venueRepo.create.mockResolvedValue(createdVenue);
  redisService.deleteByPattern.mockResolvedValue(true);

  const result = await service.createVenue({
    name: 'Nhà thi đấu Phú Thọ',
    city: 'TP.HCM',
    address: 'Lữ Gia',
    capacity: 8000,
  });

  assert.equal(venueRepo.create.mock.calls.length, 1);
  assert.equal(redisService.deleteByPattern.mock.calls.length, 1);
  assert.equal(result.id, 'new-venue');
});

test('VenueService: deleteVenue throws BadRequestException when venue has scheduled concerts', async () => {
  const { service, venueRepo } = createService();

  venueRepo.findById.mockResolvedValue(
    new VenueResponseDto({
      id: 'venue-with-concerts',
      name: 'SVĐ Mỹ Đình',
      city: 'Hà Nội',
      address: 'Lê Đức Thọ',
      capacity: 40000,
      created_at: new Date(),
      updated_at: new Date(),
    }),
  );
  venueRepo.countConcertsByVenueId.mockResolvedValue(2);

  await assert.rejects(
    async () => {
      await service.deleteVenue('venue-with-concerts');
    },
    (err: any) => {
      assert.ok(err instanceof BadRequestException);
      assert.match(err.message, /active concert\(s\) scheduled/);
      return true;
    },
  );
});
