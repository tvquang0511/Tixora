import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../../shared/prisma.service";
import {
  RevenueByConcertQueryDto,
  RevenueRangeQueryDto,
  RevenueTrendQueryDto,
} from "../dtos/revenue-query.dto";

type MoneyLike = { toString(): string } | string | number | null | undefined;

type RevenueOrderRow = {
  total_amount: MoneyLike;
  created_at: Date;
  tickets: Array<{ id: string }>;
};

type RevenueConcertDetailRow = {
  id: string;
  name: string;
  status: string;
  start_time: Date;
  ticket_categories: Array<{
    id: string;
    name: string;
    price: MoneyLike;
    total_quantity: number;
    gate_number: number | null;
    tickets: Array<{ id: string }>;
  }>;
};

@Injectable()
export class AdminRevenueService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(query: RevenueRangeQueryDto) {
    const to = query.to ? new Date(query.to) : new Date();
    const from = query.from ? new Date(query.from) : this.daysBefore(to, 30);
    const durationMs = Math.max(to.getTime() - from.getTime(), 1000);
    const prevTo = new Date(from.getTime());
    const prevFrom = new Date(prevTo.getTime() - durationMs);

    const concertWhere = query.organizer_id
      ? { concert: { organizer_id: query.organizer_id } }
      : {};

    const [currentOrders, prevOrders] = await Promise.all([
      this.prisma.order.findMany({
        where: {
          status: "PAID",
          created_at: {
            gte: from,
            lte: to,
          },
          ...concertWhere,
        },
        select: {
          total_amount: true,
          tickets: {
            select: { id: true },
          },
        },
      }),
      this.prisma.order.findMany({
        where: {
          status: "PAID",
          created_at: {
            gte: prevFrom,
            lte: prevTo,
          },
          ...concertWhere,
        },
        select: {
          total_amount: true,
          tickets: {
            select: { id: true },
          },
        },
      }),
    ]);

    const totalGmv = this.sumRevenue(currentOrders);
    const paidOrders = currentOrders.length;
    const totalTicketsSold = this.sumTickets(currentOrders);
    const feeRate = 0.05;
    const totalPlatformFee = Math.round(totalGmv * feeRate);
    const aov = paidOrders > 0 ? Math.round(totalGmv / paidOrders) : 0;

    const prevGmv = this.sumRevenue(prevOrders);
    const prevPaidOrders = prevOrders.length;
    const prevTicketsSold = this.sumTickets(prevOrders);
    const prevPlatformFee = Math.round(prevGmv * feeRate);
    const prevAov =
      prevPaidOrders > 0 ? Math.round(prevGmv / prevPaidOrders) : 0;

    const calcGrowth = (curr: number, prev: number): number => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return Math.round(((curr - prev) / prev) * 1000) / 10;
    };

    return {
      from,
      to,
      total_gmv: totalGmv,
      total_platform_fee: totalPlatformFee,
      platform_fee_rate: feeRate,
      paid_orders: paidOrders,
      total_tickets_sold: totalTicketsSold,
      aov,
      growth: {
        gmv: calcGrowth(totalGmv, prevGmv),
        platform_fee: calcGrowth(totalPlatformFee, prevPlatformFee),
        tickets_sold: calcGrowth(totalTicketsSold, prevTicketsSold),
        paid_orders: calcGrowth(paidOrders, prevPaidOrders),
        aov: calcGrowth(aov, prevAov),
      },
    };
  }

  async getByOrganizer(query: RevenueRangeQueryDto) {
    const createdAt = this.getDateFilter(query);

    const organizers = await this.prisma.user.findMany({
      where: {
        OR: [
          { organizer_profile: { isNot: null } },
          { organized_concerts: { some: {} } },
          { user_roles: { some: { role: { name: "ORGANIZER" } } } },
        ],
      },
      select: {
        id: true,
        full_name: true,
        email: true,
        organizer_profile: {
          select: {
            organization_name: true,
            phone_number: true,
            bank_name: true,
            bank_account_number: true,
          },
        },
        organized_concerts: {
          select: {
            id: true,
            name: true,
            status: true,
            orders: {
              where: {
                status: "PAID",
                ...(createdAt ? { created_at: createdAt } : {}),
              },
              select: {
                total_amount: true,
                tickets: { select: { id: true } },
              },
            },
          },
        },
      },
    });

    const feeRate = 0.05;
    let totalPlatformGmv = 0;

    const rawItems = organizers.map((org) => {
      const allOrders = org.organized_concerts.flatMap((c) => c.orders);
      const gmv = this.sumRevenue(allOrders);
      const ticketsSold = this.sumTickets(allOrders);
      const paidOrders = allOrders.length;
      const platformFee = Math.round(gmv * feeRate);

      totalPlatformGmv += gmv;

      return {
        organizer_id: org.id,
        organization_name:
          org.organizer_profile?.organization_name ||
          org.full_name ||
          "Ban tổ chức",
        contact_name: org.full_name,
        email: org.email,
        phone_number: org.organizer_profile?.phone_number || null,
        total_concerts: org.organized_concerts.length,
        gmv,
        platform_fee: platformFee,
        paid_orders: paidOrders,
        tickets_sold: ticketsSold,
      };
    });

    const items = rawItems
      .map((item) => ({
        ...item,
        market_share:
          totalPlatformGmv > 0
            ? Math.round((item.gmv / totalPlatformGmv) * 1000) / 10
            : 0,
      }))
      .sort((a, b) => b.gmv - a.gmv);

    return {
      total_platform_gmv: totalPlatformGmv,
      items,
    };
  }

  async getTrend(query: RevenueTrendQueryDto) {
    const to = query.to ? new Date(query.to) : new Date();
    const from = query.from ? new Date(query.from) : this.daysBefore(to, 30);
    const groupBy = query.group_by ?? "day";

    const concertWhere = query.organizer_id
      ? { concert: { organizer_id: query.organizer_id } }
      : {};

    const orders = await this.prisma.order.findMany({
      where: {
        status: "PAID",
        created_at: {
          gte: from,
          lte: to,
        },
        ...concertWhere,
      },
      select: {
        total_amount: true,
        created_at: true,
        tickets: {
          select: { id: true },
        },
      },
      orderBy: { created_at: "asc" },
    });

    const buckets = new Map<
      string,
      {
        period: string;
        revenue: number;
        platform_fee: number;
        paid_orders: number;
        tickets_sold: number;
      }
    >();

    for (const order of orders as RevenueOrderRow[]) {
      const period = this.formatPeriod(order.created_at, groupBy);
      const current = buckets.get(period) ?? {
        period,
        revenue: 0,
        platform_fee: 0,
        paid_orders: 0,
        tickets_sold: 0,
      };

      current.revenue += this.toNumber(order.total_amount);
      current.platform_fee = Math.round(current.revenue * 0.05);
      current.paid_orders += 1;
      current.tickets_sold += order.tickets.length;
      buckets.set(period, current);
    }

    return {
      group_by: groupBy,
      from,
      to,
      items: Array.from(buckets.values()).sort((left, right) =>
        left.period.localeCompare(right.period),
      ),
    };
  }

  async getByConcert(query: RevenueByConcertQueryDto) {
    const createdAt = this.getDateFilter(query);
    const limit = query.limit ?? 50;

    const concerts = await this.prisma.concert.findMany({
      where: {
        ...(query.status ? { status: query.status } : {}),
        ...(query.organizer_id ? { organizer_id: query.organizer_id } : {}),
      },
      select: {
        id: true,
        name: true,
        status: true,
        start_time: true,
        poster_url: true,
        location: true,
        organizer_id: true,
        organizer: {
          select: {
            id: true,
            full_name: true,
            organizer_profile: {
              select: {
                organization_name: true,
              },
            },
          },
        },
        orders: {
          where: {
            status: "PAID",
            ...(createdAt ? { created_at: createdAt } : {}),
          },
          select: {
            total_amount: true,
            tickets: {
              select: { id: true },
            },
          },
        },
      },
      orderBy: { start_time: "desc" },
      take: limit,
    });

    return {
      items: concerts.map((concert: any) => ({
        concert_id: concert.id,
        concert_name: concert.name,
        status: concert.status,
        start_time: concert.start_time,
        poster_url: concert.poster_url,
        location: concert.location,
        organizer_id: concert.organizer_id,
        organizer_name:
          concert.organizer?.organizer_profile?.organization_name ||
          concert.organizer?.full_name ||
          "Ban tổ chức",
        revenue: this.sumRevenue(concert.orders),
        paid_orders: concert.orders.length,
        tickets_sold: this.sumTickets(concert.orders),
      })),
    };
  }

  async getConcertDetail(concertId: string, query: RevenueRangeQueryDto) {
    const createdAt = this.getDateFilter(query);

    const concert = await this.prisma.concert.findUnique({
      where: { id: concertId },
      select: {
        id: true,
        name: true,
        status: true,
        start_time: true,
        poster_url: true,
        location: true,
        ticket_categories: {
          select: {
            id: true,
            name: true,
            price: true,
            total_quantity: true,
            gate_number: true,
            tickets: {
              where: {
                order: {
                  status: "PAID",
                  ...(createdAt ? { created_at: createdAt } : {}),
                },
              },
              select: { id: true },
            },
          },
          orderBy: { name: "asc" },
        },
      },
    });

    if (!concert) {
      throw new NotFoundException("Concert not found");
    }

    const orders = await this.prisma.order.findMany({
      where: {
        concert_id: concertId,
        status: "PAID",
        ...(createdAt ? { created_at: createdAt } : {}),
      },
      select: {
        total_amount: true,
        tickets: {
          select: { id: true },
        },
      },
    });

    const detail = concert as RevenueConcertDetailRow;

    return {
      concert: {
        id: detail.id,
        name: detail.name,
        status: detail.status,
        start_time: detail.start_time,
        poster_url: (concert as any).poster_url ?? null,
        location: (concert as any).location ?? null,
      },
      total_revenue: this.sumRevenue(orders),
      paid_orders: orders.length,
      tickets_sold: this.sumTickets(orders),
      ticket_tiers: detail.ticket_categories.map((category) => {
        const price = this.toNumber(category.price);
        const ticketsSold = category.tickets.length;

        return {
          category_id: category.id,
          name: category.name,
          price,
          total_quantity: category.total_quantity,
          tickets_sold: ticketsSold,
          remaining_quantity: Math.max(
            category.total_quantity - ticketsSold,
            0,
          ),
          revenue: price * ticketsSold,
          gate_number: category.gate_number,
        };
      }),
    };
  }

  async getSettlements(query: RevenueRangeQueryDto) {
    const createdAt = this.getDateFilter(query);
    const now = new Date();

    const concerts = await this.prisma.concert.findMany({
      select: {
        id: true,
        name: true,
        status: true,
        start_time: true,
        poster_url: true,
        location: true,
        organizer: {
          select: {
            id: true,
            full_name: true,
            email: true,
            organizer_profile: {
              select: {
                organization_name: true,
                bank_name: true,
                bank_account_number: true,
                bank_account_name: true,
                phone_number: true,
                tax_code_or_id: true,
              },
            },
          },
        },
        orders: {
          where: {
            status: "PAID",
            ...(createdAt ? { created_at: createdAt } : {}),
          },
          select: {
            total_amount: true,
            tickets: {
              select: { id: true },
            },
          },
        },
      },
      orderBy: { start_time: "desc" },
    });

    const feeRate = 0.05; // 5% platform take-rate
    let totalGmv = 0;
    let totalPlatformFee = 0;
    let totalNetPayout = 0;
    let holdingEscrow = 0;
    let readyForPayout = 0;

    const items = concerts.map((concert) => {
      const gmv = this.sumRevenue(concert.orders);
      const ticketsSold = this.sumTickets(concert.orders);
      const paidOrders = concert.orders.length;
      const platformFee = Math.round(gmv * feeRate);
      const netPayout = gmv - platformFee;

      const isFinished =
        concert.start_time <= now || concert.status === "COMPLETED";
      const settlementStatus = isFinished ? "READY_FOR_SETTLEMENT" : "HOLDING";

      totalGmv += gmv;
      totalPlatformFee += platformFee;
      totalNetPayout += netPayout;

      if (isFinished) {
        readyForPayout += netPayout;
      } else {
        holdingEscrow += netPayout;
      }

      const orgProfile = concert.organizer?.organizer_profile;

      return {
        concert_id: concert.id,
        concert_name: concert.name,
        status: concert.status,
        start_time: concert.start_time,
        poster_url: concert.poster_url,
        location: concert.location,
        gmv,
        platform_fee: platformFee,
        net_payout: netPayout,
        fee_rate: feeRate,
        paid_orders: paidOrders,
        tickets_sold: ticketsSold,
        settlement_status: settlementStatus,
        organizer: {
          user_id: concert.organizer?.id ?? null,
          contact_name: concert.organizer?.full_name ?? "Ban tổ chức",
          email: concert.organizer?.email ?? "",
          organization_name:
            orgProfile?.organization_name ||
            concert.organizer?.full_name ||
            "Chưa cập nhật",
          bank_name: orgProfile?.bank_name ?? null,
          bank_account_number: orgProfile?.bank_account_number ?? null,
          bank_account_name: orgProfile?.bank_account_name ?? null,
          phone_number: orgProfile?.phone_number ?? null,
          tax_code_or_id: orgProfile?.tax_code_or_id ?? null,
        },
      };
    });

    return {
      summary: {
        total_gmv: totalGmv,
        total_platform_fee: totalPlatformFee,
        total_net_payout: totalNetPayout,
        holding_escrow: holdingEscrow,
        ready_for_payout: readyForPayout,
        platform_fee_rate: feeRate,
      },
      items,
    };
  }

  private getDateFilter(
    query: RevenueRangeQueryDto,
  ): Prisma.DateTimeFilter | undefined {
    const filter: Prisma.DateTimeFilter = {};

    if (query.from) {
      filter.gte = new Date(query.from);
    }

    if (query.to) {
      filter.lte = new Date(query.to);
    }

    return Object.keys(filter).length > 0 ? filter : undefined;
  }

  private sumRevenue(orders: Array<{ total_amount: MoneyLike }>): number {
    return orders.reduce(
      (total, order) => total + this.toNumber(order.total_amount),
      0,
    );
  }

  private sumTickets(
    orders: Array<{ tickets: Array<{ id: string }> }>,
  ): number {
    return orders.reduce((total, order) => total + order.tickets.length, 0);
  }

  private toNumber(value: MoneyLike): number {
    if (value === null || value === undefined) {
      return 0;
    }

    if (typeof value === "number") {
      return value;
    }

    return Number(value.toString());
  }

  private daysBefore(date: Date, days: number): Date {
    return new Date(date.getTime() - days * 24 * 60 * 60 * 1000);
  }

  private formatPeriod(date: Date, groupBy: "day" | "week" | "month"): string {
    if (groupBy === "month") {
      return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
    }

    if (groupBy === "week") {
      const weekStart = new Date(
        Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
      );
      const day = weekStart.getUTCDay();
      const mondayOffset = day === 0 ? -6 : 1 - day;
      weekStart.setUTCDate(weekStart.getUTCDate() + mondayOffset);
      return this.formatDate(weekStart);
    }

    return this.formatDate(date);
  }

  private formatDate(date: Date): string {
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
  }
}
