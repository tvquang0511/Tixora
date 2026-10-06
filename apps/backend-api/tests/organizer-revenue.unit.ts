import test from "node:test";
import assert from "node:assert/strict";
import { fn } from "jest-mock";
import { NotFoundException, ForbiddenException } from "@nestjs/common";
import { OrganizerRevenueService } from "../src/modules/organizer-revenue/services/organizer-revenue.service";

function createService() {
  const mockPrisma = {
    order: {
      findMany: fn(),
    },
    concert: {
      findMany: fn(),
      findUnique: fn(),
    },
    user: {
      findUnique: fn(),
    },
  };

  const service = new OrganizerRevenueService(mockPrisma as any);
  return { service, mockPrisma };
}

test("OrganizerRevenueService: getSummary calculates revenue, fee, net payout and growth", async () => {
  const { service, mockPrisma } = createService();

  // Current period orders
  mockPrisma.order.findMany.mockResolvedValueOnce([
    {
      total_amount: "1000000",
      tickets: [{ id: "t1" }, { id: "t2" }],
    },
    {
      total_amount: "500000",
      tickets: [{ id: "t3" }],
    },
  ]);

  // Previous period orders
  mockPrisma.order.findMany.mockResolvedValueOnce([
    {
      total_amount: "1000000",
      tickets: [{ id: "t0" }],
    },
  ]);

  const result = await service.getSummary("org-123", {
    from: "2026-07-01T00:00:00.000Z",
    to: "2026-07-31T23:59:59.999Z",
  });

  assert.equal(result.total_gmv, 1500000);
  assert.equal(result.total_platform_fee, 75000); // 5% of 1.5M
  assert.equal(result.total_net_revenue, 1425000);
  assert.equal(result.paid_orders, 2);
  assert.equal(result.total_tickets_sold, 3);
  assert.equal(result.aov, 750000);
  assert.equal(result.growth.gmv, 50); // (1.5M - 1.0M) / 1.0M = +50%
});

test("OrganizerRevenueService: getTrend groups orders by day", async () => {
  const { service, mockPrisma } = createService();

  mockPrisma.order.findMany.mockResolvedValue([
    {
      total_amount: "500000",
      created_at: new Date("2026-07-01T10:00:00.000Z"),
      tickets: [{ id: "t1" }],
    },
    {
      total_amount: "1000000",
      created_at: new Date("2026-07-01T12:00:00.000Z"),
      tickets: [{ id: "t2" }, { id: "t3" }],
    },
    {
      total_amount: "700000",
      created_at: new Date("2026-07-02T15:00:00.000Z"),
      tickets: [{ id: "t4" }],
    },
  ]);

  const result = await service.getTrend("org-123", {
    from: "2026-07-01T00:00:00.000Z",
    to: "2026-07-31T23:59:59.999Z",
    group_by: "day",
  });

  assert.equal(result.items.length, 2);
  assert.equal(result.items[0].period, "2026-07-01");
  assert.equal(result.items[0].revenue, 1500000);
  assert.equal(result.items[0].net_revenue, 1425000);
  assert.equal(result.items[0].tickets_sold, 3);

  assert.equal(result.items[1].period, "2026-07-02");
  assert.equal(result.items[1].revenue, 700000);
});

test("OrganizerRevenueService: getByConcert returns concerts with occupancy rate", async () => {
  const { service, mockPrisma } = createService();

  mockPrisma.concert.findMany.mockResolvedValue([
    {
      id: "concert-1",
      name: "Rock Fest",
      status: "PUBLISHED",
      start_time: new Date("2026-08-01T19:00:00.000Z"),
      poster_url: "/posters/rock.png",
      location: "Hanoi",
      ticket_categories: [{ total_quantity: 100 }, { total_quantity: 200 }],
      orders: [
        {
          total_amount: "3000000",
          tickets: [{ id: "t1" }, { id: "t2" }, { id: "t3" }],
        },
      ],
    },
  ]);

  const result = await service.getByConcert("org-123", {});

  assert.equal(result.items.length, 1);
  assert.equal(result.items[0].concert_name, "Rock Fest");
  assert.equal(result.items[0].revenue, 3000000);
  assert.equal(result.items[0].total_capacity, 300);
  assert.equal(result.items[0].tickets_sold, 3);
  assert.equal(result.items[0].occupancy_rate, 1); // 3 / 300 = 1%
});

test("OrganizerRevenueService: getConcertDetail throws ForbiddenException if concert belongs to different organizer", async () => {
  const { service, mockPrisma } = createService();

  mockPrisma.concert.findUnique.mockResolvedValue({
    id: "concert-other",
    organizer_id: "other-org-id",
    name: "Other Concert",
  });

  await assert.rejects(
    async () => {
      await service.getConcertDetail("org-123", "concert-other", {});
    },
    (err: any) => {
      assert(err instanceof ForbiddenException);
      assert.match(err.message, /permission/i);
      return true;
    },
  );
});

test("OrganizerRevenueService: getConcertDetail throws NotFoundException if concert not found", async () => {
  const { service, mockPrisma } = createService();

  mockPrisma.concert.findUnique.mockResolvedValue(null);

  await assert.rejects(
    async () => {
      await service.getConcertDetail("org-123", "concert-none", {});
    },
    (err: any) => {
      assert(err instanceof NotFoundException);
      return true;
    },
  );
});

test("OrganizerRevenueService: getSettlement separates holding escrow and ready payout", async () => {
  const { service, mockPrisma } = createService();

  mockPrisma.user.findUnique.mockResolvedValue({
    id: "org-123",
    full_name: "Nguyen Van A",
    email: "organizer@tixora.local",
    organizer_profile: {
      organization_name: "V-Entertainment",
      bank_name: "Vietcombank",
      bank_account_number: "0123456789",
      bank_account_name: "NGUYEN VAN A",
    },
  });

  mockPrisma.concert.findMany.mockResolvedValue([
    {
      id: "c-completed",
      name: "Past Show",
      status: "COMPLETED",
      start_time: new Date("2026-06-01T19:00:00.000Z"),
      poster_url: null,
      orders: [{ total_amount: "2000000", tickets: [{ id: "t1" }] }],
    },
    {
      id: "c-active",
      name: "Upcoming Show",
      status: "PUBLISHED",
      start_time: new Date("2026-09-01T19:00:00.000Z"),
      poster_url: null,
      orders: [{ total_amount: "1000000", tickets: [{ id: "t2" }] }],
    },
  ]);

  const result = await service.getSettlement("org-123", {});

  assert.equal(result.summary.total_gmv, 3000000);
  assert.equal(result.summary.total_platform_fee, 150000);
  assert.equal(result.summary.total_net_payout, 2850000);
  assert.equal(result.summary.ready_for_payout, 1900000); // 2.0M - 5% = 1.9M
  assert.equal(result.summary.holding_escrow, 950000); // 1.0M - 5% = 0.95M
  assert.equal(result.organizer_profile?.bank_name, "Vietcombank");
});
