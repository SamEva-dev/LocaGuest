import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environnements/environment';
import { PaginatedResult, Payment, Contract } from './properties.api';

export interface TenantListItem {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  moveInDate?: Date;
  status: string;
  activeContracts: number;
}

export interface TenantDetail extends TenantListItem {
  notes?: string;
  createdAt: Date;
  createdBy: string;
  totalContracts: number;
}

export interface TenantPayment extends Payment {
  propertyName?: string;
}

export interface TenantPaymentStats {
  tenantId: string;
  totalPaid: number;
  totalPayments: number;
  latePayments: number;
  onTimeRate: number;
  lastPayment?: { amount: number; paymentDate: Date; status: string };
}

@Injectable({ providedIn: 'root' })
export class TenantsApi {
  private http = inject(HttpClient);
  private baseUrl = `${environment.BASE_LOCAGUEST_API}/api/tenants`;

  getTenants(params?: {
    q?: string;
    status?: string;
    page?: number;
    pageSize?: number;
  }): Observable<PaginatedResult<TenantListItem>> {
    let httpParams = new HttpParams();
    if (params) {
      if (params.q) httpParams = httpParams.set('q', params.q);
      if (params.status) httpParams = httpParams.set('status', params.status);
      if (params.page) httpParams = httpParams.set('page', params.page.toString());
      if (params.pageSize) httpParams = httpParams.set('pageSize', params.pageSize.toString());
    }
    return this.http.get<PaginatedResult<TenantListItem>>(this.baseUrl, { params: httpParams });
  }

  getTenant(id: string): Observable<TenantDetail> {
    return this.http.get<TenantDetail>(`${this.baseUrl}/${id}`);
  }

  getTenantPayments(id: string, from?: Date, to?: Date): Observable<TenantPayment[]> {
    let params = new HttpParams();
    if (from) params = params.set('from', from.toISOString());
    if (to) params = params.set('to', to.toISOString());
    return this.http.get<TenantPayment[]>(`${this.baseUrl}/${id}/payments`, { params });
  }

  getTenantContracts(id: string): Observable<Contract[]> {
    return this.http.get<Contract[]>(`${this.baseUrl}/${id}/contracts`);
  }

  getPaymentStats(id: string): Observable<TenantPaymentStats> {
    return this.http.get<TenantPaymentStats>(`${this.baseUrl}/${id}/payment-stats`);
  }
}
