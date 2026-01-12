import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environnements/environment.dev';

export interface Organization {
  id: string;
  code: string;
  name: string;
  email: string;
  phone?: string;
  status: string;
  subscriptionPlan?: string;
  subscriptionExpiryDate?: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  website?: string;
}

export interface UpdateOrganizationSettingsRequest {
  organizationId: string;
  name?: string;
  email?: string;
  phone?: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  website?: string;
}

@Injectable({
  providedIn: 'root'
})
export class OrganizationsService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.BASE_LOCAGUEST_API}/api/Organizations`;

  getCurrentOrganization(): Observable<Organization> {
    return this.http.get<Organization>(`${this.baseUrl}/current`);
  }

  updateOrganizationSettings(request: UpdateOrganizationSettingsRequest): Observable<Organization> {
    return this.http.put<Organization>(`${this.baseUrl}/settings`, request);
  }

  uploadLogo(organizationId: string, file: File): Observable<{ logoUrl: string; message: string }> {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.http.post<{ logoUrl: string; message: string }>(
      `${this.baseUrl}/${organizationId}/logo`,
      formData
    );
  }
}
