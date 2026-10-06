import { apiClient } from "./api";

export interface RevenueGrowth {
  gmv: number;
  net_revenue: number;
  platform_fee: number;
  tickets_sold: number;
  paid_orders: number;
  aov: number;
}

export interface OrganizerRevenueSummaryResponse {
  from: string;
  to: string;
  total_gmv: number;
  total_platform_fee: number;
  total_net_revenue: number;
  platform_fee_rate: number;
  paid_orders: number;
  total_tickets_sold: number;
  aov: number;
  growth: RevenueGrowth;
}

export interface RevenueTrendItem {
  period: string;
  revenue: number;
  platform_fee: number;
  net_revenue: number;
  paid_orders: number;
  tickets_sold: number;
}

export interface OrganizerRevenueTrendResponse {
  group_by: "day" | "week" | "month";
  from: string;
  to: string;
  items: RevenueTrendItem[];
}

export interface ConcertRevenueItem {
  concert_id: string;
  concert_name: string;
  status: string;
  start_time: string;
  poster_url: string | null;
  location: string | null;
  revenue: number;
  platform_fee: number;
  net_revenue: number;
  paid_orders: number;
  tickets_sold: number;
  total_capacity: number;
  occupancy_rate: number;
}

export interface OrganizerRevenueByConcertResponse {
  items: ConcertRevenueItem[];
}

export interface TicketTierRevenue {
  category_id: string;
  name: string;
  price: number;
  total_quantity: number;
  tickets_sold: number;
  remaining_quantity: number;
  revenue: number;
  gate_number: number | null;
}

export interface SalesTimelinePoint {
  date: string;
  revenue: number;
  cumulative_revenue: number;
  tickets_sold: number;
  cumulative_tickets: number;
  paid_orders: number;
}

export interface ConcertRevenueDetailResponse {
  concert: {
    id: string;
    name: string;
    status: string;
    start_time: string;
    poster_url: string | null;
    location: string | null;
  };
  total_revenue: number;
  platform_fee: number;
  net_revenue: number;
  paid_orders: number;
  tickets_sold: number;
  sales_timeline: SalesTimelinePoint[];
  ticket_tiers: TicketTierRevenue[];
}

export interface SettlementConcertItem {
  concert_id: string;
  concert_name: string;
  status: string;
  start_time: string;
  poster_url: string | null;
  gmv: number;
  platform_fee: number;
  net_payout: number;
  paid_orders: number;
  tickets_sold: number;
  settlement_status: "HOLDING" | "READY_FOR_SETTLEMENT";
}

export interface OrganizerSettlementResponse {
  summary: {
    total_gmv: number;
    total_platform_fee: number;
    total_net_payout: number;
    holding_escrow: number;
    ready_for_payout: number;
    platform_fee_rate: number;
  };
  organizer_profile: {
    organization_name: string;
    bank_name: string | null;
    bank_account_number: string | null;
    bank_account_name: string | null;
    phone_number: string | null;
    tax_code_or_id: string | null;
  } | null;
  items: SettlementConcertItem[];
}

export const organizerRevenueService = {
  async getSummary(params?: {
    from?: string;
    to?: string;
  }): Promise<OrganizerRevenueSummaryResponse> {
    const query = new URLSearchParams();
    if (params?.from) query.append("from", params.from);
    if (params?.to) query.append("to", params.to);
    const qs = query.toString();
    return apiClient.get<OrganizerRevenueSummaryResponse>(
      `/organizer/revenue/summary${qs ? `?${qs}` : ""}`,
    );
  },

  async getTrend(params?: {
    from?: string;
    to?: string;
    group_by?: "day" | "week" | "month";
  }): Promise<OrganizerRevenueTrendResponse> {
    const query = new URLSearchParams();
    if (params?.from) query.append("from", params.from);
    if (params?.to) query.append("to", params.to);
    if (params?.group_by) query.append("group_by", params.group_by);
    const qs = query.toString();
    return apiClient.get<OrganizerRevenueTrendResponse>(
      `/organizer/revenue/trend${qs ? `?${qs}` : ""}`,
    );
  },

  async getByConcert(params?: {
    from?: string;
    to?: string;
    status?: string;
    limit?: number;
  }): Promise<OrganizerRevenueByConcertResponse> {
    const query = new URLSearchParams();
    if (params?.from) query.append("from", params.from);
    if (params?.to) query.append("to", params.to);
    if (params?.status) query.append("status", params.status);
    if (params?.limit) query.append("limit", params.limit.toString());
    const qs = query.toString();
    return apiClient.get<OrganizerRevenueByConcertResponse>(
      `/organizer/revenue/by-concert${qs ? `?${qs}` : ""}`,
    );
  },

  async getConcertDetail(
    concertId: string,
    params?: { from?: string; to?: string },
  ): Promise<ConcertRevenueDetailResponse> {
    const query = new URLSearchParams();
    if (params?.from) query.append("from", params.from);
    if (params?.to) query.append("to", params.to);
    const qs = query.toString();
    return apiClient.get<ConcertRevenueDetailResponse>(
      `/organizer/revenue/concerts/${concertId}/detail${qs ? `?${qs}` : ""}`,
    );
  },

  async getSettlement(params?: {
    from?: string;
    to?: string;
  }): Promise<OrganizerSettlementResponse> {
    const query = new URLSearchParams();
    if (params?.from) query.append("from", params.from);
    if (params?.to) query.append("to", params.to);
    const qs = query.toString();
    return apiClient.get<OrganizerSettlementResponse>(
      `/organizer/revenue/settlement${qs ? `?${qs}` : ""}`,
    );
  },
};
