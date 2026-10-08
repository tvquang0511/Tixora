import apiClient from "./api";

export interface RevenueSummaryGrowth {
  gmv: number;
  platform_fee: number;
  tickets_sold: number;
  paid_orders: number;
  aov: number;
}

export interface RevenueSummaryResponse {
  from: string;
  to: string;
  total_gmv: number;
  total_platform_fee: number;
  platform_fee_rate: number;
  paid_orders: number;
  total_tickets_sold: number;
  aov: number;
  growth: RevenueSummaryGrowth;
}

export interface RevenueByOrganizerItem {
  organizer_id: string;
  organization_name: string;
  contact_name: string;
  email: string;
  phone_number: string | null;
  total_concerts: number;
  gmv: number;
  platform_fee: number;
  paid_orders: number;
  tickets_sold: number;
  market_share: number;
}

export interface RevenueByOrganizerResponse {
  total_platform_gmv: number;
  items: RevenueByOrganizerItem[];
}

export interface RevenueTrendItem {
  period: string;
  revenue: number;
  platform_fee?: number;
  paid_orders: number;
  tickets_sold: number;
}

export interface RevenueTrendResponse {
  group_by: "day" | "week" | "month";
  from: string;
  to: string;
  items: RevenueTrendItem[];
}

export interface RevenueByConcertItem {
  concert_id: string;
  concert_name: string;
  status: "DRAFT" | "PUBLISHED" | "COMPLETED" | "CANCELLED";
  start_time: string;
  poster_url: string | null;
  location: string | null;
  organizer_id?: string;
  organizer_name?: string;
  revenue: number;
  paid_orders: number;
  tickets_sold: number;
}

export interface RevenueByConcertResponse {
  items: RevenueByConcertItem[];
}

export interface ConcertInfo {
  id: string;
  name: string;
  status: string;
  start_time: string;
  poster_url: string | null;
  location: string | null;
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

export interface ConcertSalesTimelinePoint {
  date: string;
  revenue: number;
  cumulative_revenue: number;
  tickets_sold: number;
  cumulative_tickets: number;
  paid_orders: number;
}

export interface ConcertRevenueDetailResponse {
  concert: ConcertInfo;
  total_revenue: number;
  paid_orders: number;
  tickets_sold: number;
  sales_start_at: string | null;
  sales_end_at: string | null;
  sales_timeline: ConcertSalesTimelinePoint[];
  ticket_tiers: TicketTierRevenue[];
}

export async function getRevenueSummary(params?: {
  from?: string;
  to?: string;
  organizer_id?: string;
}): Promise<RevenueSummaryResponse> {
  const query = new URLSearchParams();
  if (params?.from) query.append("from", params.from);
  if (params?.to) query.append("to", params.to);
  if (params?.organizer_id) query.append("organizer_id", params.organizer_id);

  const queryString = query.toString();
  const endpoint = `/admin/revenue/summary${queryString ? `?${queryString}` : ""}`;
  return apiClient.get<RevenueSummaryResponse>(endpoint);
}

export async function getRevenueByOrganizer(params?: {
  from?: string;
  to?: string;
}): Promise<RevenueByOrganizerResponse> {
  const query = new URLSearchParams();
  if (params?.from) query.append("from", params.from);
  if (params?.to) query.append("to", params.to);

  const queryString = query.toString();
  const endpoint = `/admin/revenue/by-organizer${queryString ? `?${queryString}` : ""}`;
  return apiClient.get<RevenueByOrganizerResponse>(endpoint);
}

export async function getRevenueTrend(params?: {
  from?: string;
  to?: string;
  group_by?: "day" | "week" | "month";
  organizer_id?: string;
}): Promise<RevenueTrendResponse> {
  const query = new URLSearchParams();
  if (params?.from) query.append("from", params.from);
  if (params?.to) query.append("to", params.to);
  if (params?.group_by) query.append("group_by", params.group_by);
  if (params?.organizer_id) query.append("organizer_id", params.organizer_id);

  const queryString = query.toString();
  const endpoint = `/admin/revenue/trend${queryString ? `?${queryString}` : ""}`;
  return apiClient.get<RevenueTrendResponse>(endpoint);
}

export async function getRevenueByConcert(params?: {
  from?: string;
  to?: string;
  status?: string;
  limit?: number;
  organizer_id?: string;
}): Promise<RevenueByConcertResponse> {
  const query = new URLSearchParams();
  if (params?.from) query.append("from", params.from);
  if (params?.to) query.append("to", params.to);
  if (params?.status) query.append("status", params.status);
  if (params?.limit) query.append("limit", params.limit.toString());
  if (params?.organizer_id) query.append("organizer_id", params.organizer_id);

  const queryString = query.toString();
  const endpoint = `/admin/revenue/by-concert${queryString ? `?${queryString}` : ""}`;
  return apiClient.get<RevenueByConcertResponse>(endpoint);
}

export async function getConcertRevenueDetail(
  concertId: string,
  params?: {
    from?: string;
    to?: string;
  },
): Promise<ConcertRevenueDetailResponse> {
  const query = new URLSearchParams();
  if (params?.from) query.append("from", params.from);
  if (params?.to) query.append("to", params.to);

  const queryString = query.toString();
  const endpoint = `/admin/revenue/concerts/${concertId}/detail${queryString ? `?${queryString}` : ""}`;
  return apiClient.get<ConcertRevenueDetailResponse>(endpoint);
}

export interface SettlementOrganizer {
  user_id: string | null;
  contact_name: string;
  email: string;
  organization_name: string;
  bank_name: string | null;
  bank_account_number: string | null;
  bank_account_name: string | null;
  phone_number: string | null;
  tax_code_or_id: string | null;
}

export interface SettlementItem {
  concert_id: string;
  concert_name: string;
  status: string;
  start_time: string;
  poster_url: string | null;
  location: string | null;
  gmv: number;
  platform_fee: number;
  net_payout: number;
  fee_rate: number;
  paid_orders: number;
  tickets_sold: number;
  settlement_status:
    "HOLDING" | "READY_FOR_SETTLEMENT" | "COMPLETED" | "DISPUTED";
  organizer: SettlementOrganizer;
}

export interface SettlementSummary {
  total_gmv: number;
  total_platform_fee: number;
  total_net_payout: number;
  holding_escrow: number;
  ready_for_payout: number;
  platform_fee_rate: number;
}

export interface SettlementsResponse {
  summary: SettlementSummary;
  items: SettlementItem[];
}

export async function getSettlements(params?: {
  from?: string;
  to?: string;
}): Promise<SettlementsResponse> {
  const query = new URLSearchParams();
  if (params?.from) query.append("from", params.from);
  if (params?.to) query.append("to", params.to);

  const queryString = query.toString();
  const endpoint = `/admin/revenue/settlements${queryString ? `?${queryString}` : ""}`;
  return apiClient.get<SettlementsResponse>(endpoint);
}

export interface AdminRevenueAiInsightResponse {
  platform_financial_health: string;
  top_organizers_performance: string;
  risk_alerts: string[];
  platform_growth_strategies: string[];
  analyzed_at: string;
  is_cached: boolean;
}

export async function getAdminRevenueAiInsights(
  refresh = false,
): Promise<AdminRevenueAiInsightResponse> {
  const endpoint = `/admin/revenue/ai-insights${refresh ? "?refresh=true" : ""}`;
  return apiClient.get<AdminRevenueAiInsightResponse>(endpoint);
}
