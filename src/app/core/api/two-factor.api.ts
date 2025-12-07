import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environnements/environment';

export interface TwoFactorStatusDto {
  isEnabled: boolean;
  enabledAt?: string;
  lastUsedAt?: string;
  recoveryCodesRemaining: number;
}

export interface EnableTwoFactorResponse {
  secret: string;
  qrCodeUri: string;
  qrCodeImage: string; // Base64
  recoveryCodes: string[];
}

export interface VerifyRequest {
  code: string;
}

export interface DisableRequest {
  password: string;
}

@Injectable({ providedIn: 'root' })
export class TwoFactorApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.BASE_AUTH_API}/api/twofactor`;

  getStatus(): Observable<TwoFactorStatusDto> {
    return this.http.get<TwoFactorStatusDto>(`${this.baseUrl}/status`);
  }

  enable(): Observable<EnableTwoFactorResponse> {
    return this.http.post<EnableTwoFactorResponse>(`${this.baseUrl}/enable`, {});
  }

  verifyAndEnable(request: VerifyRequest): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.baseUrl}/verify`, request);
  }

  disable(request: DisableRequest): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.baseUrl}/disable`, request);
  }
}
