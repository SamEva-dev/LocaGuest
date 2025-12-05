import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environnements/environment';
import { PaginatedResult, Payment, Contract } from './properties.api';

export interface TenantListItem {
  id: string;
  code: string;  // T0001-L0001
  fullName: string;
  email: string;
  phone?: string;
  moveInDate?: Date;
  status: string;
  activeContracts: number;
  propertyId?: string;  // Associated property ID
  propertyCode?: string;  // Associated property code (T0001-APP0001)
  
  // Statut administratif
  hasCompleteFile?: boolean;        // Dossier complet
  missingDocuments?: string[];      // Liste des pièces manquantes
  hasInsurance?: boolean;           // Assurance habitation
  insuranceExpiryDate?: Date;       // Date d'expiration assurance
  idNumber?: string;                // Numéro CNI/Passeport
}

export interface TenantDetail extends TenantListItem {
  notes?: string;
  createdAt: Date;
  createdBy: string;
  totalContracts: number;
  
  // ✅ Informations personnelles (BACKEND SYNC)
  dateOfBirth?: Date;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  nationality?: string;
  idNumber?: string;
  
  // ✅ Contact d'urgence (BACKEND SYNC)
  emergencyContact?: string;
  emergencyPhone?: string;
  
  // ✅ Situation professionnelle (BACKEND SYNC)
  occupation?: string;
  monthlyIncome?: number;
  
  // ❌ TODO Backend - Champs non encore implémentés
  birthDate?: Date;  // Alias for dateOfBirth
  age?: number;
  idCardType?: 'CNI' | 'Passport' | 'TitreSejour' | 'PermisConduire';
  idCardNumber?: string;
  idCardExpiryDate?: Date;
  profession?: string;
  employer?: string;
  employmentType?: 'CDI' | 'CDD' | 'Independant' | 'Etudiant' | 'Retraite' | 'Autre';
  hasGuarantor?: boolean;
  guarantorName?: string;
  guarantorPhone?: string;
  guarantorEmail?: string;
  guarantorAddress?: string;
  guarantorRelation?: string;
  fileStatus?: 'Incomplete' | 'Complete' | 'Pending' | 'Validated';
  documentsValidated?: number;
  totalDocumentsRequired?: number;
  missingDocumentTypes?: string[];
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

export interface CreateTenantDto {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string | null;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  nationality?: string;
  idNumber?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  occupation?: string;
  monthlyIncome?: number | null;
  notes?: string;
}

export interface UpdateTenantDto extends Partial<CreateTenantDto> {}

@Injectable({ providedIn: 'root' })
export class TenantsApi {
  private http = inject(HttpClient);
  private baseUrl = `${environment.BASE_LOCAGUEST_API}/api/tenants`;

  getTenants(params?: {
    search?: string;
    status?: string;
    page?: number;
    pageSize?: number;
  }): Observable<PaginatedResult<TenantListItem>> {
    let httpParams = new HttpParams();
    if (params) {
      if (params.search) httpParams = httpParams.set('search', params.search);
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

  createTenant(dto: CreateTenantDto): Observable<TenantDetail> {
    return this.http.post<TenantDetail>(`${environment.BASE_LOCAGUEST_API}/api/tenants`, dto);
  }

  updateTenant(id: string, dto: UpdateTenantDto): Observable<TenantDetail> {
    return this.http.put<TenantDetail>(`${environment.BASE_LOCAGUEST_API}/api/tenants/${id}`, dto);
  }

  deleteTenant(id: string): Observable<void> {
    return this.http.delete<void>(`${environment.BASE_LOCAGUEST_API}/api/tenants/${id}`);
  }
}
