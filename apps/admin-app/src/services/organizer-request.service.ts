import { apiClient } from "./api";

export interface OrganizerRequestItem {
  id: string;
  user_id: string;
  organization_name: string;
  tax_code_or_id: string;
  phone_number: string;
  business_license_url?: string | null;
  portfolio_url?: string | null;
  bank_account_name?: string | null;
  bank_account_number?: string | null;
  bank_name?: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  rejection_reason?: string | null;
  approved_at?: string | null;
  created_at: string;
  updated_at: string;
  user: {
    id: string;
    email: string;
    full_name: string;
    status?: string;
  };
}

export interface OrganizerRequestResponse {
  data: OrganizerRequestItem[];
  meta: {
    totalItems: number;
    itemCount: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
  };
}

export async function getOrganizerRequests(params?: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}): Promise<OrganizerRequestResponse> {
  const query = new URLSearchParams();
  if (params?.page) query.append("page", params.page.toString());
  if (params?.limit) query.append("limit", params.limit.toString());
  if (params?.status && params.status !== "ALL") {
    query.append("status", params.status);
  }
  if (params?.search && params.search.trim()) {
    query.append("search", params.search.trim());
  }

  const queryString = query.toString();
  const endpoint = `/admin/organizer-requests${queryString ? `?${queryString}` : ""}`;
  return apiClient.get<OrganizerRequestResponse>(endpoint);
}

export async function approveOrganizerRequest(
  id: string,
): Promise<OrganizerRequestItem> {
  return apiClient.post<OrganizerRequestItem>(
    `/admin/organizer-requests/${id}/approve`,
  );
}

export async function rejectOrganizerRequest(
  id: string,
  rejectionReason: string,
): Promise<OrganizerRequestItem> {
  return apiClient.post<OrganizerRequestItem>(
    `/admin/organizer-requests/${id}/reject`,
    {
      rejection_reason: rejectionReason,
    },
  );
}

export async function updateOrganizerRequestStatus(
  id: string,
  status: "PENDING" | "APPROVED" | "REJECTED",
  rejectionReason?: string,
): Promise<OrganizerRequestItem> {
  return apiClient.patch<OrganizerRequestItem>(
    `/admin/organizer-requests/${id}/status`,
    {
      status,
      rejection_reason: rejectionReason,
    },
  );
}
