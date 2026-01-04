// core/auth/auth.api.ts
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environnements/environment';
import { AcceptLocaGuestInvitationRequest, AcceptLocaGuestInvitationResponse, LoginRequest, LoginResponse, PreLoginRequest, PreLoginResponse, RegisterRequest, RegisterResponse } from '../auth/auth.models';
import { MfaSetupResponse, MfaVerifyRequest } from '../mfa/mfa.models';

@Injectable({ providedIn: 'root' })
export class AuthApi {
  private http = inject(HttpClient);
  private base = environment.BASE_AUTH_API+"/api";

  // AuthGate MFA endpoints (TODO: verify these exist in AuthGate)
  enableMfa(type: 'TOTP' | 'SMS') {
    return this.http.post<MfaSetupResponse>(`${this.base}/Mfa/setup`, { type });
  }

  verifyMfa(body: MfaVerifyRequest) {
    return this.http.post<LoginResponse>(`${this.base}/Auth/mfa-login`, body);
  }

  verify2FA(mfaToken: string, code: string, rememberDevice: boolean = false, deviceFingerprint?: string, userAgent?: string) {
    return this.http.post<LoginResponse>(`${this.base}/Auth/verify-2fa`, { 
      mfaToken, 
      code, 
      rememberDevice,
      deviceFingerprint,
      userAgent
    });
  }

  verifyRecoveryCode(mfaToken: string, recoveryCode: string, rememberDevice: boolean = false, deviceFingerprint?: string, userAgent?: string) {
    return this.http.post<LoginResponse>(`${this.base}/Auth/verify-recovery-code`, { 
      mfaToken, 
      recoveryCode, 
      rememberDevice,
      deviceFingerprint,
      userAgent
    });
  }

  disableMfa() {
    return this.http.post<void>(`${this.base}/Mfa/disable`, {});
  }

  // AuthGate Auth endpoints
  prelogin(body: PreLoginRequest) {
    return this.http.post<PreLoginResponse>(`${this.base}/Auth/prelogin`, body);
  }

  login(body: LoginRequest) {
    console.log('base',this.base)
    return this.http.post<LoginResponse>(`${this.base}/Auth/login`, body);
  }

  register(body: RegisterRequest) {
    return this.http.post<RegisterResponse>(`${this.base}/Auth/register-with-tenant`, body);
  }

  acceptLocaGuestInvitation(body: AcceptLocaGuestInvitationRequest) {
    return this.http.post<AcceptLocaGuestInvitationResponse>(`${this.base}/Auth/invitations/accept`, body);
  }

  forgotPassword(email: string) {
    return this.http.post<void>(`${this.base}/PasswordReset/request`, { email });
  }

  resetPassword(token: string, newPassword: string) {
    return this.http.post<void>(`${this.base}/PasswordReset/reset`, { token, newPassword });
  }

  refresh(refreshToken: string) {
    return this.http.post<LoginResponse>(`${this.base}/Auth/refresh`, { refreshToken });
  }

  // TODO: Verify if validateEmail exists in AuthGate
  validateEmail(token: string) {
    return this.http.post<void>(`${this.base}/Auth/validate-email`, { token });
  }
  
  // TODO: Verify if devices endpoints exist in AuthGate
  listDevices() {
    return this.http.get<{ id: string; ip: string; userAgent: string; lastSeen: string; current: boolean }[]>(`${this.base}/Auth/devices`);
  }

  revokeDevice(id: string) {
    return this.http.delete<void>(`${this.base}/Auth/devices/${id}`);
  }

  revokeAllDevices() {
    return this.http.delete<void>(`${this.base}/Auth/devices`);
  }
}
