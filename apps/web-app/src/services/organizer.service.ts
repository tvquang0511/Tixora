import { apiClient } from "./api";
import { tokenStorage } from "@/utils/token.utils";

export interface ApplyOrganizerPayload {
  organization_name: string;
  tax_code_or_id: string;
  phone_number: string;
  business_license_url?: string;
  portfolio_url?: string;
  bank_account_name?: string;
  bank_account_number?: string;
  bank_name?: string;
}

export interface OrganizerProfileResponse {
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
  user?: {
    id: string;
    email: string;
    full_name: string;
  };
}

export interface UpdateOrganizerProfilePayload {
  organization_name?: string;
  phone_number?: string;
  business_license_url?: string;
  portfolio_url?: string;
  bank_account_name?: string;
  bank_account_number?: string;
  bank_name?: string;
  full_name?: string;
}

export const organizerService = {
  apply: async (
    payload: ApplyOrganizerPayload,
  ): Promise<OrganizerProfileResponse> => {
    return apiClient.post<OrganizerProfileResponse>(
      "/organizer/apply",
      payload,
    );
  },

  getMyApplication: async (): Promise<OrganizerProfileResponse | null> => {
    return apiClient.get<OrganizerProfileResponse | null>(
      "/organizer/my-application",
    );
  },

  getProfile: async (): Promise<OrganizerProfileResponse | null> => {
    return apiClient.get<OrganizerProfileResponse | null>("/organizer/profile");
  },

  updateProfile: async (
    payload: UpdateOrganizerProfilePayload,
  ): Promise<OrganizerProfileResponse> => {
    return apiClient.patch<OrganizerProfileResponse>(
      "/organizer/profile",
      payload,
    );
  },

  generateEventDraftFromPdf: async (file: File): Promise<EventDraftDto> => {
    const token = tokenStorage.getAccessToken();
    const formData = new FormData();
    formData.append("file", file);

    const headers = new Headers();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL || "/api/proxy"}/organizer/ai/draft-from-pdf`,
      {
        method: "POST",
        headers,
        body: formData,
      },
    );

    if (!response.ok) {
      let errorMessage = response.statusText;
      try {
        const errJson = await response.json();
        if (errJson.message) errorMessage = errJson.message;
      } catch {
        // fallback
      }
      throw new Error(errorMessage || "Không thể phân tích tệp PDF.");
    }

    return response.json();
  },
};

export interface SuggestedTicketTierDto {
  name: string;
  estimated_price?: number;
}

export interface EventDraftDto {
  name: string;
  description: string;
  category: string;
  suggested_location?: string;
  performers: string[];
  ai_bio: string;
  house_rules?: string;
  suggested_ticket_tiers?: SuggestedTicketTierDto[];
}
