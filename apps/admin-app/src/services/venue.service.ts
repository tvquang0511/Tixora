import apiClient from "./api";

export interface ZonePreset {
  code: string;
  name: string;
  default_price: number;
  default_color?: string;
  gate_number?: number;
}

export interface VenueItem {
  id: string;
  name: string;
  city: string;
  address: string;
  capacity?: number | null;
  svg_template_url?: string | null;
  zone_presets?: ZonePreset[] | null;
  created_at: string;
  updated_at: string;
}

export interface VenueListMeta {
  totalItems: number;
  itemCount: number;
  itemsPerPage: number;
  totalPages: number;
  currentPage: number;
}

export interface VenueListResponse {
  data: VenueItem[];
  meta: VenueListMeta;
}

export interface VenueQuery {
  page?: number;
  limit?: number;
  search?: string;
  city?: string;
}

export interface CreateVenueDto {
  name: string;
  city: string;
  address: string;
  capacity?: number;
  svg_template_url?: string;
  zone_presets?: ZonePreset[];
}

export async function getVenues(
  query: VenueQuery = {},
): Promise<VenueListResponse> {
  const params = new URLSearchParams();
  if (query.page) params.set("page", String(query.page));
  if (query.limit) params.set("limit", String(query.limit));
  if (query.search?.trim()) params.set("search", query.search.trim());
  if (query.city?.trim()) params.set("city", query.city.trim());

  const queryString = params.toString();
  const endpoint = queryString ? `/venues?${queryString}` : "/venues";
  return apiClient.get<VenueListResponse>(endpoint);
}

export async function getVenueById(id: string): Promise<VenueItem> {
  return apiClient.get<VenueItem>(`/venues/${id}`);
}

export async function createVenue(body: CreateVenueDto): Promise<VenueItem> {
  return apiClient.post<VenueItem>("/venues", body);
}

export async function updateVenue(
  id: string,
  body: Partial<CreateVenueDto>,
): Promise<VenueItem> {
  return apiClient.put<VenueItem>(`/venues/${id}`, body);
}

export async function deleteVenue(id: string): Promise<{ success: boolean }> {
  return apiClient.delete<{ success: boolean }>(`/venues/${id}`);
}
