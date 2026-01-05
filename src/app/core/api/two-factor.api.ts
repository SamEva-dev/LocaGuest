import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environnements/environment';
import type { paths as AuthGatePaths } from '../sdk/authgate/openapi.types';

export type TwoFactorStatusDto =
  AuthGatePaths['/api/TwoFactor/status']['get']['responses'][200]['content']['application/json'];

export type EnableTwoFactorResponse =
  AuthGatePaths['/api/TwoFactor/enable']['post']['responses'][200]['content']['application/json'];

export type VerifyRequest =
  NonNullable<AuthGatePaths['/api/TwoFactor/verify']['post']['requestBody']>['content']['application/json'];

export type DisableRequest =
  NonNullable<AuthGatePaths['/api/TwoFactor/disable']['post']['requestBody']>['content']['application/json'];

@Injectable({ providedIn: 'root' })
export class TwoFactorApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.BASE_AUTH_API}/api/TwoFactor`;

  getStatus(): Observable<TwoFactorStatusDto> {
    return this.http.get<TwoFactorStatusDto>(`${this.baseUrl}/status`);
  }

  enable(): Observable<EnableTwoFactorResponse> {
    return this.http.post<EnableTwoFactorResponse>(`${this.baseUrl}/enable`, {});
  }

  verifyAndEnable(request: VerifyRequest): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/verify`, request);
  }

  disable(request: DisableRequest): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/disable`, request);
  }
}
