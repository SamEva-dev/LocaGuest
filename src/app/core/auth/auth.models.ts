// core/auth/auth.models.ts
export interface UserDto {
  id: string;
  email: string;
  fullName: string;
  organizationId: string;
  roles: string[];
  permissions: string[];
  mfaEnabled: boolean;
}

export interface LoginRequest { 
  email: string; 
  password: string; 
  code?: string;
  deviceFingerprint?: string;
}

export interface PreLoginRequest {
  email: string;
}

export interface PreLoginResponse {
  nextStep: string;
  error?: string;
}
export interface RegisterRequest { 
  email: string; 
  password: string; 
  organizationName: string;
  firstName?: string; 
  lastName?: string; 
  phone?: string; 
}

export interface RegisterResponse {
  userId: string;
  email: string;
  message?: string;
  status?: string;
  accessToken?: string;
  refreshToken?: string;
}

export interface MfaLoginRequest {
  userId: string;
  code: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAtUtc?: string; // ISO
}

export interface JwtPayload {
  sub: string;
  email: string;
  organization_id?: string;
  tenant_id?: string;
  role?: string | string[];
  roles?: string | string[];
  permission?: string | string[];
  permissions?: string | string[];
  mfa_enabled?: boolean | string;
  mfa?: boolean | string;
  exp?: number;
  iat?: number;
  nbf?: number;
  iss?: string;
  aud?: string;
}

export interface Tokens {
  access: string;
  refresh: string;
  expires: string;
}

export interface LoginResponse {
  user?: UserDto;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  requiresMfa: boolean;
  mfaToken?: string;
  status?: 'Success' | 'MfaRequired';
}

export interface AcceptLocaGuestInvitationRequest {
  token: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface AcceptLocaGuestInvitationResponse {
  userId: string;
  email: string;
  organizationId: string;
  role: string;
  accessToken: string;
  refreshToken: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}
