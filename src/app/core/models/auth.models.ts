// DTOs pour l'authentification (doivent correspondre à AuthGate)

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // en secondes
  requiresMfa: boolean;
  mfaToken?: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
}

export interface RegisterResponse {
  userId: string;
  email: string;
  message: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface CurrentUserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  isActive: boolean;
  emailConfirmed: boolean;
  mfaEnabled: boolean;
  roles: string[];
  permissions: string[];
  createdAt: string;
  lastLoginAt?: string;
}

// JWT Payload décodé
export interface JwtPayload {
  sub: string; // User ID
  email: string;
  organization_id?: string;
  tenant_id?: string;
  role?: string | string[];
  roles?: string | string[];
  permission?: string | string[];
  permissions?: string | string[];
  mfa_enabled?: boolean | string;
  mfa?: boolean | string;
  jti: string; // JWT ID
  exp: number; // Expiration timestamp
  iat: number; // Issued at timestamp
  nbf: number; // Not before timestamp
  iss: string; // Issuer
  aud: string; // Audience
}

// User state dans l'application
export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  organizationId: string;
  roles: string[];
  permissions: string[];
  mfaEnabled: boolean;
}
