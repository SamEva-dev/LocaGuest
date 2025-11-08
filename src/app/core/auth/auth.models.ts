// core/auth/auth.models.ts
export interface UserDto {
  id: string;
  email: string;
  fullName: string;
  roles: string[];
  permissions: string[];
  mfaEnabled: boolean;
}

export interface LoginRequest { email: string; password: string; code?: string; }
export interface RegisterRequest { 
  email: string; 
  password: string; 
  confirmPassword: string;
  firstName?: string; 
  lastName?: string; 
  phoneNumber?: string; 
}

export interface RegisterResponse {
  userId: string;
  email: string;
  message?: string;
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

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}
