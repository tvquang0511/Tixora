import apiClient from "./api";

export interface ConcertApiItem {
  id: string;
  name: string;
  description: string;
  location: string;
  venue_id?: string | null;
  start_time: string;
  svg_map_url: string;
  poster_url?: string;
  status: string;
  category?: string;
  ticketTiers?: ConcertTicketTier[];
  performers?: string[];
  organizer_id?: string | null;
  organizer_name?: string | null;
  total_capacity?: number;
  sold_tickets?: number;
}

export interface ConcertTicketTier {
  id: string;
  name: string;
  price: number;
  total_quantity: number;
  max_per_user: number;
  gate_number?: number | null;
  position?: number;
  status?: string;
  sales_start_at?: string;
  remaining_quantity?: number;
}

export interface ConcertDetailResponse {
  id: string;
  name: string;
  description: string;
  location: string;
  venue_id?: string | null;
  ai_bio: string;
  start_time: string;
  svg_map_url: string;
  poster_url?: string;
  status: string;
  category?: string;
  ticketTiers: ConcertTicketTier[];
  performers?: string[];
}

export interface ConcertListMeta {
  totalItems: number;
  itemCount: number;
  itemsPerPage: number;
  totalPages: number;
  currentPage: number;
}

export interface ConcertListResponse {
  data: ConcertApiItem[];
  meta: ConcertListMeta;
}

export interface ConcertCardItem {
  id: string;
  title: string;
  description: string;
  venue: string;
  city: string;
  date: string;
  time: string;
  price: string;
  minPrice?: number;
  status: string;
  category?: string;
  genre: string;
  mapUrl: string;
  posterUrl?: string;
  ticketTiers?: ConcertTicketTier[];
  performers?: string[];
  organizer_id?: string | null;
  organizer_name?: string | null;
  totalCapacity?: number;
  soldTickets?: number;
}

export interface ConcertDetailItem extends ConcertCardItem {
  aiBio: string;
  ticketTiers: ConcertTicketTier[];
  startTime: string;
  venue_id?: string | null;
}

export interface ConcertQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  category?: string;
}

export const DEFAULT_POSTER_URL = "/Mockimg.webp";

export function getConcertPosterUrl(posterUrl?: string | null) {
  return posterUrl?.trim() || DEFAULT_POSTER_URL;
}

function splitLocation(location: string) {
  const separatorIndex = location.lastIndexOf(",");

  if (separatorIndex === -1) {
    return {
      venue: location.trim(),
      city: "",
    };
  }

  return {
    venue: location.slice(0, separatorIndex).trim(),
    city: location.slice(separatorIndex + 1).trim(),
  };
}

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return {
      date: "TBA",
      time: "",
    };
  }

  return {
    date: new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date),
    time: new Intl.DateTimeFormat("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(date),
  };
}

function mapConcert(item: ConcertApiItem): ConcertCardItem {
  const { venue, city } = splitLocation(item.location);
  const { date, time } = formatDateTime(item.start_time);

  const rawTiers = item.ticketTiers ?? [];
  const tiers = [...rawTiers].sort(
    (a, b) => (a.position ?? 0) - (b.position ?? 0),
  );

  const minPrice =
    tiers.length > 0 ? Math.min(...tiers.map((t) => t.price)) : undefined;

  return {
    id: item.id,
    title: item.name,
    description: item.description,
    venue,
    city,
    date,
    time,
    price:
      minPrice !== undefined
        ? `Từ ${new Intl.NumberFormat("vi-VN").format(minPrice)}đ`
        : "Xem chi tiết",
    minPrice,
    status: item.status,
    category: item.category || undefined,
    genre: item.category || "Live concert",
    mapUrl: item.svg_map_url,
    posterUrl: item.poster_url,
    ticketTiers: tiers,
    performers: item.performers,
    organizer_id: item.organizer_id,
    organizer_name:
      item.organizer_name ||
      (item.organizer_id ? "Đơn vị tổ chức" : "Tixora Official"),
    totalCapacity:
      item.total_capacity !== undefined
        ? item.total_capacity
        : tiers.reduce((acc, t) => acc + (t.total_quantity || 0), 0),
    soldTickets: item.sold_tickets ?? 0,
  };
}

function mapConcertDetail(item: ConcertDetailResponse): ConcertDetailItem {
  const mapped = mapConcert({
    id: item.id,
    name: item.name,
    description: item.description,
    location: item.location,
    start_time: item.start_time,
    svg_map_url: item.svg_map_url,
    poster_url: item.poster_url,
    status: item.status,
    category: item.category,
    performers: item.performers,
    ticketTiers: item.ticketTiers,
  });

  const rawTiers = item.ticketTiers ?? [];
  const tiers = [...rawTiers].sort(
    (a, b) => (a.position ?? 0) - (b.position ?? 0),
  );

  return {
    ...mapped,
    aiBio: item.ai_bio,
    ticketTiers: tiers,
    startTime: item.start_time,
    venue_id: item.venue_id,
  };
}

export async function getConcerts(query: ConcertQuery = {}) {
  const params = new URLSearchParams();

  params.set("page", String(query.page ?? 1));
  params.set("limit", String(query.limit ?? 10));

  if (query.search && query.search.trim()) {
    params.set("search", query.search.trim());
  }

  if (
    query.status &&
    query.status.trim() &&
    query.status.toUpperCase() !== "ALL"
  ) {
    params.set("status", query.status.trim());
  }

  if (
    query.category &&
    query.category.trim() &&
    query.category.toUpperCase() !== "ALL"
  ) {
    params.set("category", query.category.trim());
  }

  const isServer = typeof window === "undefined";
  const baseUrl = isServer
    ? (
        process.env.REMOTE_API_URL ||
        process.env.NEXT_PUBLIC_API_URL ||
        "http://localhost:3000"
      ).replace(/\/+$/, "")
    : (process.env.NEXT_PUBLIC_API_BASE_URL || "/api/proxy").replace(
        /\/+$/,
        "",
      );
  const url = `${baseUrl}/concerts?${params.toString()}`;

  const response = await fetch(url);

  const pageNumber = query.page ?? 1;
  const limit = query.limit ?? 10;

  if (!response.ok) {
    // If status filter or category filter causes 400 from remote backend,
    // fallback to fetching all concerts and filtering client-side
    if (response.status === 400) {
      try {
        const fallbackParams = new URLSearchParams();
        fallbackParams.set("page", "1");
        fallbackParams.set("limit", "100");
        if (query.search?.trim())
          fallbackParams.set("search", query.search.trim());
        const fallbackUrl = `${baseUrl}/concerts?${fallbackParams.toString()}`;
        const fallbackRes = await fetch(fallbackUrl);
        if (fallbackRes.ok) {
          const fallbackData = await fallbackRes.json();
          let allItems = (fallbackData.data ?? []).map(mapConcert);
          if (query.status && query.status.toUpperCase() !== "ALL") {
            allItems = allItems.filter(
              (c: ConcertCardItem) => c.status === query.status,
            );
          }
          if (query.category && query.category.toUpperCase() !== "ALL") {
            allItems = allItems.filter(
              (c: ConcertCardItem) =>
                c.category?.toUpperCase() === query.category?.toUpperCase() ||
                c.genre?.toUpperCase() === query.category?.toUpperCase(),
            );
          }
          const totalItems = allItems.length;
          const startIndex = (pageNumber - 1) * limit;
          const pagedItems = allItems.slice(startIndex, startIndex + limit);
          return {
            items: pagedItems,
            meta: {
              totalItems,
              itemCount: pagedItems.length,
              itemsPerPage: limit,
              totalPages: Math.ceil(totalItems / limit) || 1,
              currentPage: pageNumber,
            },
          };
        }
      } catch (fallbackErr) {
        console.error("Fallback client filtering error:", fallbackErr);
      }
      return {
        items: [],
        meta: {
          totalItems: 0,
          itemCount: 0,
          itemsPerPage: limit,
          totalPages: 1,
          currentPage: pageNumber,
        },
      };
    }
    throw new Error(`Failed to load concerts (${response.status})`);
  }

  const payload = (await response.json()) as Partial<ConcertListResponse>;
  const meta = payload.meta ?? {
    totalItems: payload.data?.length ?? 0,
    itemCount: payload.data?.length ?? 0,
    itemsPerPage: limit,
    totalPages: 1,
    currentPage: pageNumber,
  };

  return {
    items: (payload.data ?? []).map(mapConcert),
    meta,
  };
}

export async function getConcertById(id: string) {
  const isServer = typeof window === "undefined";
  const baseUrl = isServer
    ? (
        process.env.REMOTE_API_URL ||
        process.env.NEXT_PUBLIC_API_URL ||
        "http://localhost:3000"
      ).replace(/\/+$/, "")
    : (process.env.NEXT_PUBLIC_API_BASE_URL || "/api/proxy").replace(
        /\/+$/,
        "",
      );
  const url = `${baseUrl}/concerts/${id}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to load concert (${response.status})`);
  }

  const payload = (await response.json()) as ConcertDetailResponse;

  return mapConcertDetail(payload);
}

export function formatConcertDateTime(value: string) {
  return formatDateTime(value);
}

export function formatConcertCurrency(value: number) {
  return `${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(value)}đ`;
}

export interface CreateConcertDto {
  name: string;
  description: string;
  location: string;
  venue_id?: string | null;
  ai_bio: string;
  start_time: string;
  svg_map_url: string;
  poster_url?: string;
  status: string;
  category?: string;
  performers?: string[];
  ticketTiers: Array<{
    id?: string;
    name: string;
    price: number;
    total_quantity: number;
    max_per_user: number;
    gate_number?: number | null;
    position?: number;
    status?: string;
    sales_start_at?: string | null;
  }>;
}

export async function createConcert(body: CreateConcertDto) {
  return apiClient.post<unknown>("/concerts", body);
}

export async function updateConcert(
  id: string,
  body: Partial<CreateConcertDto>,
) {
  return apiClient.patch<unknown>(`/concerts/${id}`, body);
}

export async function deleteConcert(id: string) {
  return apiClient.delete<unknown>(`/concerts/${id}`);
}
