// core/auth/auth.api.ts
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environnements/environment';
import { AcceptLocaGuestInvitationRequest, AcceptLocaGuestInvitationResponse, LoginRequest, LoginResponse, PreLoginRequest, PreLoginResponse, RegisterRequest, RegisterResponse } from '../auth/auth.models';

@Injectable({ providedIn: 'root' })
export class AuthApi {
  private http = inject(HttpClient);
  private base = environment.BASE_AUTH_API+"/api";

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

  // AuthGate Auth endpoints
  prelogin(body: PreLoginRequest) {
    return this.http.post<PreLoginResponse>(`${this.base}/Auth/prelogin`, body);
  }

  login(body: LoginRequest) {
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

  resetPassword(email: string, token: string, newPassword: string, confirmPassword: string) {
    return this.http.post<void>(`${this.base}/PasswordReset/reset`, { email, token, newPassword, confirmPassword });
  }

  refresh(refreshToken: string) {
    return this.http.post<LoginResponse>(`${this.base}/Auth/refresh`, { refreshToken });
  }

  // TODO: Verify if validateEmail exists in AuthGate
  validateEmail(email: string, token: string) {
    return this.http.post<void>(`${this.base}/Auth/validate-email`, { email, token });
  }

  resendEmailConfirmation(email: string) {
    return this.http.post<void>(`${this.base}/Auth/resend-confirm-email`, { email });
  }

  getProvisioningStatus(email: string) {
    return this.http.get<{ status: string; organizationId?: string | null }>(
      `${this.base}/Auth/provisioning-status`,
      { params: { email } }
    );
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

  changePassword(currentPassword: string, newPassword: string) {
    return this.http.post<void>(`${this.base}/Auth/change-password`, { currentPassword, newPassword });
  }

  deactivateAccount() {
    return this.http.post<void>(`${this.base}/Auth/deactivate`, {});
  }
}
