import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../../../shared/prisma.service";
import {
  OrganizerRevenueByConcertQueryDto,
  OrganizerRevenueRangeQueryDto,
  OrganizerRevenueTrendQueryDto,
} from "../dtos/organizer-revenue-query.dto";

type MoneyLike = { toString(): string } | string | number | null | undefined;

type RevenueOrderRow = {
  total_amount: MoneyLike;
  created_at: Date;
  tickets: Array<{ id: string }>;
};

@Injectable()
export class OrganizerRevenueService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(organizerId: string, query: OrganizerRevenueRangeQueryDto) {
    const to = query.to ? new Date(query.to) : new Date();
    const from = query.from ? new Date(query.from) : this.daysBefore(to, 30);
    const durationMs = Math.max(to.getTime() - from.getTime(), 1000);
    const prevTo = new Date(from.getTime());
    const prevFrom = new Date(prevTo.getTime() - durationMs);

    const [currentOrders, prevOrders] = await Promise.all([
      this.prisma.order.findMany({
        where: {
          status: "PAID",
          created_at: {
            gte: from,
            lte: to,
          },
          concert: { organizer_id: organizerId },
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
          concert: { organizer_id: organizerId },
        },
        select: {
          total_amount: true,
          tickets: {
            select: { id: true },
          },
        },
      }),
    ]);

    const feeRate = 0.05; // 5% platform fee
    const totalGmv = this.sumRevenue(currentOrders);
    const paidOrders = currentOrders.length;
    const totalTicketsSold = this.sumTickets(currentOrders);
    const totalPlatformFee = Math.round(totalGmv * feeRate);
    const totalNetRevenue = totalGmv - totalPlatformFee;
    const aov = paidOrders > 0 ? Math.round(totalGmv / paidOrders) : 0;

    const prevGmv = this.sumRevenue(prevOrders);
    const prevPaidOrders = prevOrders.length;
    const prevTicketsSold = this.sumTickets(prevOrders);
    const prevPlatformFee = Math.round(prevGmv * feeRate);
    const prevNetRevenue = prevGmv - prevPlatformFee;
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
      total_net_revenue: totalNetRevenue,
      platform_fee_rate: feeRate,
      paid_orders: paidOrders,
      total_tickets_sold: totalTicketsSold,
      aov,
      growth: {
        gmv: calcGrowth(totalGmv, prevGmv),
        net_revenue: calcGrowth(totalNetRevenue, prevNetRevenue),
        platform_fee: calcGrowth(totalPlatformFee, prevPlatformFee),
        tickets_sold: calcGrowth(totalTicketsSold, prevTicketsSold),
        paid_orders: calcGrowth(paidOrders, prevPaidOrders),
        aov: calcGrowth(aov, prevAov),
      },
    };
  }

  async getTrend(organizerId: string, query: OrganizerRevenueTrendQueryDto) {
    const to = query.to ? new Date(query.to) : new Date();
    const from = query.from ? new Date(query.from) : this.daysBefore(to, 30);
    const groupBy = query.group_by ?? "day";

    const orders = await this.prisma.order.findMany({
      where: {
        status: "PAID",
        created_at: {
          gte: from,
          lte: to,
        },
        concert: { organizer_id: organizerId },
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

    const feeRate = 0.05;
    const buckets = new Map<
      string,
      {
        period: string;
        revenue: number;
        platform_fee: number;
        net_revenue: number;
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
        net_revenue: 0,
        paid_orders: 0,
        tickets_sold: 0,
      };

      const amount = this.parseMoney(order.total_amount);
      const fee = Math.round(amount * feeRate);
      current.revenue += amount;
      current.platform_fee += fee;
      current.net_revenue += amount - fee;
      current.paid_orders += 1;
      current.tickets_sold += order.tickets?.length ?? 0;
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

  async getByConcert(
    organizerId: string,
    query: OrganizerRevenueByConcertQueryDto,
  ) {
    const createdAt = this.getDateFilter(query);
    const limit = query.limit ?? 50;

    const concerts = await this.prisma.concert.findMany({
      where: {
        organizer_id: organizerId,
        ...(query.status ? { status: query.status } : {}),
      },
      select: {
        id: true,
        name: true,
        status: true,
        start_time: true,
        poster_url: true,
        location: true,
        ticket_categories: {
          select: {
            total_quantity: true,
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

    const feeRate = 0.05;

    return {
      items: concerts.map((concert) => {
        const gmv = this.sumRevenue(concert.orders);
        const ticketsSold = this.sumTickets(concert.orders);
        const totalCapacity = concert.ticket_categories.reduce(
          (sum, cat) => sum + (cat.total_quantity || 0),
          0,
        );
        const occupancyRate =
          totalCapacity > 0
            ? Math.round((ticketsSold / totalCapacity) * 1000) / 10
            : 0;

        return {
          concert_id: concert.id,
          concert_name: concert.name,
          status: concert.status,
          start_time: concert.start_time,
          poster_url: concert.poster_url,
          location: concert.location,
          revenue: gmv,
          platform_fee: Math.round(gmv * feeRate),
          net_revenue: gmv - Math.round(gmv * feeRate),
          paid_orders: concert.orders.length,
          tickets_sold: ticketsSold,
          total_capacity: totalCapacity,
          occupancy_rate: occupancyRate,
        };
      }),
    };
  }

  async getConcertDetail(
    organizerId: string,
    concertId: string,
    query: OrganizerRevenueRangeQueryDto,
  ) {
    const createdAt = this.getDateFilter(query);

    const concert = await this.prisma.concert.findUnique({
      where: { id: concertId },
      select: {
        id: true,
        organizer_id: true,
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
            sales_start_at: true,
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

    if (concert.organizer_id !== organizerId) {
      throw new ForbiddenException(
        "You do not have permission to view revenue for this concert",
      );
    }

    const orders = await this.prisma.order.findMany({
      where: {
        concert_id: concertId,
        status: "PAID",
        ...(createdAt ? { created_at: createdAt } : {}),
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

    const feeRate = 0.05;
    const totalGmv = this.sumRevenue(orders);
    const paidOrders = orders.length;
    const totalTicketsSold = this.sumTickets(orders);

    const salesTimelineMap = new Map<
      string,
      {
        date: string;
        revenue: number;
        tickets_sold: number;
        paid_orders: number;
      }
    >();

    for (const order of orders as RevenueOrderRow[]) {
      const dateKey = order.created_at.toISOString().slice(0, 10);
      const current = salesTimelineMap.get(dateKey) ?? {
        date: dateKey,
        revenue: 0,
        tickets_sold: 0,
        paid_orders: 0,
      };

      current.revenue += this.parseMoney(order.total_amount);
      current.tickets_sold += order.tickets?.length ?? 0;
      current.paid_orders += 1;
      salesTimelineMap.set(dateKey, current);
    }

    let cumulativeRevenue = 0;
    let cumulativeTickets = 0;
    const sortedTimeline = Array.from(salesTimelineMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date),
    );

    const salesTimeline = sortedTimeline.map((item) => {
      cumulativeRevenue += item.revenue;
      cumulativeTickets += item.tickets_sold;
      return {
        date: item.date,
        revenue: item.revenue,
        cumulative_revenue: cumulativeRevenue,
        tickets_sold: item.tickets_sold,
        cumulative_tickets: cumulativeTickets,
        paid_orders: item.paid_orders,
      };
    });

    return {
      concert: {
        id: concert.id,
        name: concert.name,
        status: concert.status,
        start_time: concert.start_time,
        poster_url: concert.poster_url,
        location: concert.location,
      },
      total_revenue: totalGmv,
      platform_fee: Math.round(totalGmv * feeRate),
      net_revenue: totalGmv - Math.round(totalGmv * feeRate),
      paid_orders: paidOrders,
      tickets_sold: totalTicketsSold,
      sales_timeline: salesTimeline,
      ticket_tiers: concert.ticket_categories.map((category) => {
        const sold = category.tickets.length;
        const price = this.parseMoney(category.price);
        return {
          category_id: category.id,
          name: category.name,
          price,
          total_quantity: category.total_quantity,
          tickets_sold: sold,
          remaining_quantity: Math.max(0, category.total_quantity - sold),
          revenue: sold * price,
          gate_number: category.gate_number,
        };
      }),
    };
  }

  async getSettlement(
    organizerId: string,
    query: OrganizerRevenueRangeQueryDto,
  ) {
    const createdAt = this.getDateFilter(query);

    const [userWithProfile, concerts] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: organizerId },
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
      }),
      this.prisma.concert.findMany({
        where: { organizer_id: organizerId },
        select: {
          id: true,
          name: true,
          status: true,
          start_time: true,
          poster_url: true,
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
        orderBy: { start_time: "desc" },
      }),
    ]);

    const feeRate = 0.05;
    let totalGmv = 0;
    let holdingEscrow = 0;
    let readyForPayout = 0;

    const items = concerts.map((c) => {
      const gmv = this.sumRevenue(c.orders);
      const ticketsSold = this.sumTickets(c.orders);
      const fee = Math.round(gmv * feeRate);
      const netPayout = gmv - fee;

      totalGmv += gmv;

      // COMPLETED concerts are ready for payout, others are held in escrow
      const isSettled = c.status === "COMPLETED";
      if (isSettled) {
        readyForPayout += netPayout;
      } else {
        holdingEscrow += netPayout;
      }

      return {
        concert_id: c.id,
        concert_name: c.name,
        status: c.status,
        start_time: c.start_time,
        poster_url: c.poster_url,
        gmv,
        platform_fee: fee,
        net_payout: netPayout,
        paid_orders: c.orders.length,
        tickets_sold: ticketsSold,
        settlement_status: isSettled ? "READY_FOR_SETTLEMENT" : "HOLDING",
      };
    });

    const totalPlatformFee = Math.round(totalGmv * feeRate);
    const totalNetPayout = totalGmv - totalPlatformFee;

    return {
      summary: {
        total_gmv: totalGmv,
        total_platform_fee: totalPlatformFee,
        total_net_payout: totalNetPayout,
        holding_escrow: holdingEscrow,
        ready_for_payout: readyForPayout,
        platform_fee_rate: feeRate,
      },
      organizer_profile: userWithProfile?.organizer_profile || null,
      items,
    };
  }

  // ─── Helpers ──────────────────────────────────────────────

  private sumRevenue(orders: Array<{ total_amount: MoneyLike }>): number {
    return orders.reduce(
      (sum, item) => sum + this.parseMoney(item.total_amount),
      0,
    );
  }

  private sumTickets(
    orders: Array<{ tickets: Array<{ id: string }> }>,
  ): number {
    return orders.reduce((sum, item) => sum + (item.tickets?.length ?? 0), 0);
  }

  private parseMoney(value: MoneyLike): number {
    if (typeof value === "number") return value;
    if (typeof value === "string") return Number(value) || 0;
    if (value && typeof value === "object" && "toString" in value) {
      return Number(value.toString()) || 0;
    }
    return 0;
  }

  private daysBefore(base: Date, days: number): Date {
    const next = new Date(base.getTime());
    next.setDate(next.getDate() - days);
    return next;
  }

  private getDateFilter(query: OrganizerRevenueRangeQueryDto) {
    if (!query.from && !query.to) return undefined;
    return {
      ...(query.from ? { gte: new Date(query.from) } : {}),
      ...(query.to ? { lte: new Date(query.to) } : {}),
    };
  }

  private formatPeriod(date: Date, groupBy: "day" | "week" | "month"): string {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");

    if (groupBy === "month") {
      return `${yyyy}-${mm}`;
    }

    if (groupBy === "week") {
      const d = new Date(
        Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
      );
      const dayNum = d.getUTCDay() || 7;
      d.setUTCDate(d.getUTCDate() + 4 - dayNum);
      const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
      const weekNo = Math.ceil(
        ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
      );
      return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
    }

    return `${yyyy}-${mm}-${dd}`;
  }
}
