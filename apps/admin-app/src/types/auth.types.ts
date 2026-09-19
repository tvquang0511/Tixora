/**
 * Token types
 */
export interface TokenPayload {
  sub: string;
  email: string;
  role: string;
  permissions?: string[];
  iat?: number;
  exp?: number;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  status?: string;
  roles: string[];
  permissions?: string[];
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expires_in?: number;
  user: UserProfile;
}

export interface RegisterResponse {
  id: string;
  email: string;
  fullName: string;
  status: string;
  roles: string[];
}

export interface MessageResponse {
  message: string;
}

export interface ApiErrorResponse {
  statusCode: number;
  message: string;
  error?: string;
}
