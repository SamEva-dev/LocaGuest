// core/auth/auth.api.ts
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environnements/environment';
import { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse } from '../auth/auth.models';
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

  disableMfa() {
    return this.http.post<void>(`${this.base}/Mfa/disable`, {});
  }

  // AuthGate Auth endpoints
  login(body: LoginRequest) {
    return this.http.post<LoginResponse>(`${this.base}/Auth/login`, body);
  }

  register(body: RegisterRequest) {
    return this.http.post<RegisterResponse>(`${this.base}/auth/register`, body);
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
