import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environnements/environment.prod';

export interface ContractStats {
  activeContracts: number;
  expiringIn3Months: number;
  monthlyRevenue: number;
  totalTenants: number;
}

export interface ContractDto {
  id: string;
  propertyId: string;
  tenantId: string;
  propertyName?: string;
  tenantName?: string;
  type: 'Furnished' | 'Unfurnished';
  startDate: string;
  endDate: string;
  rent: number;
  deposit?: number;
  status: 'Active' | 'Terminated' | 'Expiring';
  notes?: string;
  paymentsCount?: number;
  createdAt?: string;
}

export interface ContractDetailDto extends ContractDto {
  payments: any[];
}

export interface CreateContractRequest {
  propertyId: string;
  tenantId: string;
  type: 'Furnished' | 'Unfurnished';
  startDate: string;
  endDate: string;
  rent: number;
  deposit?: number;
}

export interface RecordPaymentRequest {
  amount: number;
  paymentDate: string;
  method: 'Cash' | 'BankTransfer' | 'Check' | 'CreditCard';
}

export interface TerminateContractRequest {
  terminationDate: string;
  markPropertyVacant?: boolean;
}

export interface PaginatedResponse<T> {
  total: number;
  page: number;
  pageSize: number;
  data: T[];
}

@Injectable({ providedIn: 'root' })
export class ContractsApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.BASE_LOCAGUEST_API}/api/contracts`;

  getStats(): Observable<ContractStats> {
    return this.http.get<ContractStats>(`${this.baseUrl}/stats`);
  }

  getAllContracts(
    searchTerm?: string,
    status?: string,
    type?: string
  ): Observable<ContractDto[]> {
    let params = new HttpParams();
    if (searchTerm) params = params.set('searchTerm', searchTerm);
    if (status) params = params.set('status', status);
    if (type) params = params.set('type', type);

    return this.http.get<ContractDto[]>(`${this.baseUrl}/all`, { params });
  }

  getContracts(
    status?: string,
    page: number = 1,
    pageSize: number = 10
  ): Observable<PaginatedResponse<ContractDto>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());
    
    if (status) params = params.set('status', status);

    return this.http.get<PaginatedResponse<ContractDto>>(this.baseUrl, { params });
  }

  getContract(id: string): Observable<ContractDetailDto> {
    return this.http.get<ContractDetailDto>(`${this.baseUrl}/${id}`);
  }

  createContract(request: CreateContractRequest): Observable<{ id: string; propertyId: string; tenantId: string }> {
    return this.http.post<{ id: string; propertyId: string; tenantId: string }>(this.baseUrl, request);
  }

  recordPayment(contractId: string, request: RecordPaymentRequest): Observable<any> {
    return this.http.post(`${this.baseUrl}/${contractId}/payments`, request);
  }

  terminateContract(contractId: string, request: TerminateContractRequest): Observable<{ message: string; id: string }> {
    return this.http.put<{ message: string; id: string }>(`${this.baseUrl}/${contractId}/terminate`, request);
  }
}
