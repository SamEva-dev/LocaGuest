// core/auth/mfa.models.ts
export interface MfaSetupResponse {
  type: 'TOTP' | 'SMS';
  secret?: string; // base32 pour TOTP
  qrCodeUrl?: string;
}

export interface MfaVerifyRequest {
  code: string;
  deviceId?: string;
}
