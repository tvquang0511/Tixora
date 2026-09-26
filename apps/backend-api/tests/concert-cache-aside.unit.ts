import test from "node:test";
import assert from "node:assert/strict";
import { fn } from "jest-mock";
import { ConcertService } from "../src/modules/catalog/services/concert.service";
import { ConcertListResponseDto } from "../src/modules/catalog/dtos/concert-list-response.dto";
import { ConcertResponseDto } from "../src/modules/catalog/entities/concert-response.dto";
import { PaginationMetaDto } from "../src/shared/dtos/pagination-meta.dto";

function createService() {
  const redisService = {
    getJson: fn(),
    setJson: fn(),
    deleteByPattern: fn(),
  };

  const concertRepo = {
    findManyWithPagination: fn(),
    findById: fn(),
    create: fn(),
    update: fn(),
    delete: fn(),
  };

  const service = new ConcertService(concertRepo as any, redisService as any);
  (service as any).logger = {
    log: fn(),
    warn: fn(),
    error: fn(),
  };

  return { service, redisService, concertRepo };
}

test("getConcerts uses DB on cache miss and stores result in Redis", async () => {
  const { service, redisService, concertRepo } = createService();

  redisService.getJson.mockResolvedValue(null);
  concertRepo.findManyWithPagination.mockResolvedValue({
    items: [{ id: "1", name: "Concert A" }],
    total: 1,
  });
  redisService.setJson.mockResolvedValue(true);

  const result = await service.getConcerts({ page: 1, limit: 10 } as any);

  assert.equal(concertRepo.findManyWithPagination.mock.calls.length, 1);
  assert.equal(redisService.setJson.mock.calls.length, 1);
  assert.equal(result.data.length, 1);
  assert.equal(result.meta.totalItems, 1);
});

test("getConcerts returns cached result without hitting DB", async () => {
  const { service, redisService, concertRepo } = createService();

  const cached = new ConcertListResponseDto({
    data: [{ id: "cached-1", name: "Cached Concert" } as any],
    meta: new PaginationMetaDto({
      totalItems: 1,
      itemCount: 1,
      itemsPerPage: 10,
      totalPages: 1,
      currentPage: 1,
    }),
  });

  redisService.getJson.mockResolvedValue(cached);

  const result = await service.getConcerts({ page: 1, limit: 10 } as any);

  assert.equal(concertRepo.findManyWithPagination.mock.calls.length, 0);
  assert.equal(redisService.setJson.mock.calls.length, 0);
  assert.equal(result.data[0].id, "cached-1");
});

test("getConcertById uses DB on cache miss and stores result in Redis", async () => {
  const { service, redisService, concertRepo } = createService();

  const concert = new ConcertResponseDto({
    id: "detail-1",
    name: "Detail Concert",
    location: "Venue",
    start_time: new Date("2026-06-10T19:30:00Z"),
    status: "PUBLISHED",
    ticketTiers: [],
  });

  redisService.getJson.mockResolvedValue(null);
  concertRepo.findById.mockResolvedValue(concert);
  redisService.setJson.mockResolvedValue(true);

  const result = await service.getConcertById("detail-1");

  assert.equal(concertRepo.findById.mock.calls.length, 1);
  assert.equal(redisService.setJson.mock.calls.length, 1);
  assert.equal(result.id, "detail-1");
});

test("getConcertById returns cached result without hitting DB", async () => {
  const { service, redisService, concertRepo } = createService();

  const cached = new ConcertResponseDto({
    id: "detail-2",
    name: "Cached Detail Concert",
    location: "Venue",
    start_time: new Date("2026-06-10T19:30:00Z"),
    status: "PUBLISHED",
    ticketTiers: [],
  });

  redisService.getJson.mockResolvedValue(cached);

  const result = await service.getConcertById("detail-2");

  assert.equal(concertRepo.findById.mock.calls.length, 0);
  assert.equal(redisService.setJson.mock.calls.length, 0);
  assert.equal(result.id, "detail-2");
});
