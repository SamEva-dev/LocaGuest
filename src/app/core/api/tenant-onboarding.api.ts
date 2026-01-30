import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environnements/environment';

export interface CreateTenantOnboardingInvitationRequest {
  email: string;
  propertyId?: string | null;
}

export interface CreateTenantOnboardingInvitationResponse {
  token: string;
  link: string;
  expiresAtUtc: string;
}

export interface TenantOnboardingInvitationDto {
  email: string;
  propertyId?: string | null;
  expiresAtUtc: string;
}

@Injectable({ providedIn: 'root' })
export class TenantOnboardingApi {
  private http = inject(HttpClient);
  private baseUrl = `${environment.BASE_LOCAGUEST_API}/api/tenant-onboarding`;

  createInvitation(dto: CreateTenantOnboardingInvitationRequest): Observable<CreateTenantOnboardingInvitationResponse> {
    return this.http.post<CreateTenantOnboardingInvitationResponse>(`${this.baseUrl}/invitations`, dto);
  }

  getInvitation(token: string): Observable<TenantOnboardingInvitationDto> {
    return this.http.get<TenantOnboardingInvitationDto>(`${this.baseUrl}/invitation`, { params: { token } });
  }

  submit(token: string, formData: FormData): Observable<{ occupantId: string }> {
    formData.append('token', token);
    return this.http.post<{ occupantId: string }>(`${this.baseUrl}/submit`, formData);
  }
}
