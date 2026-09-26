import { apiClient } from "./api";

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
};
