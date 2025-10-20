// core/auth/auth.models.ts
export interface UserDto {
  id: string;
  email: string;
  fullName: string;
  roles: string[];
  mfaEnabled: boolean;
}

export interface LoginRequest { email: string; password: string; code?: string; }
export interface RegisterRequest { fullName: string; email: string; password: string; }

export interface MfaLoginRequest {
  userId: string;
  code: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAtUtc?: string; // ISO
}

export interface Tokens {
  access: string;
  refresh: string;
  expires: string;
}

export interface LoginResponse {
  user: UserDto;
  tokens: AuthTokens;
  status: 'Success' | 'MfaRequired';
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}
