import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environnements/environment';

export interface PropertyListItem {
  id: string;
  name: string;
  address: string;
  city: string;
  type: string;
  status: string;
  rent: number;
  bedrooms: number;
  bathrooms: number;
  surface?: number;
  imageUrl?: string;
}

export interface PropertyDetail extends PropertyListItem {
  zipCode?: string;
  country?: string;
  hasElevator: boolean;
  hasParking: boolean;
  floor?: number;
  isFurnished: boolean;
  charges?: number;
  deposit?: number;
  notes?: string;
  imageUrls: string[];
  createdAt: Date;
  createdBy: string;
}

export interface Payment {
  id: string;
  amount: number;
  paymentDate: Date;
  method: string;
  status: string;
  contractId: string;
}

export interface Contract {
  id: string;
  tenantId: string;
  tenantName?: string;
  type: string;
  startDate: Date;
  endDate: Date;
  rent: number;
  deposit?: number;
  status: string;
  paymentsCount?: number;
}

export interface FinancialSummary {
  propertyId: string;
  totalRevenue: number;
  monthlyRent: number;
  lastPayment?: { amount: number; paymentDate: Date };
  occupancyRate: number;
}

export interface PaginatedResult<T> {
  total: number;
  page: number;
  pageSize: number;
  data: T[];
}

@Injectable({ providedIn: 'root' })
export class PropertiesApi {
  private http = inject(HttpClient);
  private baseUrl = `${environment.BASE_LOCAGUEST_API}/api/properties`;

  getProperties(params?: {
    status?: string;
    city?: string;
    q?: string;
    page?: number;
    pageSize?: number;
  }): Observable<PaginatedResult<PropertyListItem>> {
    let httpParams = new HttpParams();
    if (params) {
      if (params.status) httpParams = httpParams.set('status', params.status);
      if (params.city) httpParams = httpParams.set('city', params.city);
      if (params.q) httpParams = httpParams.set('q', params.q);
      if (params.page) httpParams = httpParams.set('page', params.page.toString());
      if (params.pageSize) httpParams = httpParams.set('pageSize', params.pageSize.toString());
    }
    return this.http.get<PaginatedResult<PropertyListItem>>(this.baseUrl, { params: httpParams });
  }

  getProperty(id: string): Observable<PropertyDetail> {
    console.log('Fetching property with ID:', id);
    return this.http.get<PropertyDetail>(`${this.baseUrl}/${id}`);
  }

  getPropertyPayments(id: string, from?: Date, to?: Date): Observable<Payment[]> {
    let params = new HttpParams();
    if (from) params = params.set('from', from.toISOString());
    if (to) params = params.set('to', to.toISOString());
    return this.http.get<Payment[]>(`${this.baseUrl}/${id}/payments`, { params });
  }

  getPropertyContracts(id: string): Observable<Contract[]> {
    return this.http.get<Contract[]>(`${this.baseUrl}/${id}/contracts`);
  }

  getFinancialSummary(id: string): Observable<FinancialSummary> {
    return this.http.get<FinancialSummary>(`${this.baseUrl}/${id}/financial-summary`);
  }
}
