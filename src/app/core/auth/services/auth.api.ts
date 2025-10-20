// core/auth/auth.api.ts
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environnements/environment.prod';
import { LoginRequest, LoginResponse, RegisterRequest } from '../auth.models';
import { MfaSetupResponse, MfaVerifyRequest } from '../../mfa/mfa.models';

@Injectable({ providedIn: 'root' })
export class AuthApi {
  private http = inject(HttpClient);
  private base = environment.BASE_AUTH_API+"/api/v1";

  enableMfa(type: 'TOTP' | 'SMS') {
    return this.http.post<MfaSetupResponse>(`${this.base}/auth/mfa/enable`, { type });
    }

    verifyMfa(body: MfaVerifyRequest) {
    return this.http.post<void>(`${this.base}/auth/mfa/verify-login`, body);
    }

    disableMfa() {
    return this.http.post<void>(`${this.base}/auth/mfa/disable`, {});
    }

  login(body: LoginRequest) {
    return this.http.post<LoginResponse>(`${this.base}/auth/login`, body);
  }

  register(body: RegisterRequest) {
    return this.http.post<LoginResponse>(`${this.base}/auth/register`, body);
  }

  forgotPassword(email: string) {
    return this.http.post<void>(`${this.base}/auth/forgot-password`, { email });
  }

  resetPassword(token: string, newPassword: string) {
    return this.http.post<void>(`${this.base}/auth/reset-password`, { token, newPassword });
  }

  refresh(refreshToken: string) {
    return this.http.post<LoginResponse>(`${this.base}/auth/refresh`, { refreshToken });
  }

  validateEmail(token: string) {
    return this.http.post<void>(`${this.base}/auth/validate-email`, { token });
  }
  
  listDevices() {
    return this.http.get<{ id: string; ip: string; userAgent: string; lastSeen: string; current: boolean }[]>(`${this.base}/auth/devices`);
}

 revokeDevice(id: string) {
    return this.http.delete<void>(`${this.base}/auth/devices/${id}`);
 }

 revokeAllDevices() {
    return this.http.delete<void>(`${this.base}/auth/devices`);
 }
}
