import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environnements/environment';

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
  charges: number;              // ✅ NOUVEAU - Charges mensuelles
  deposit?: number;
  status: 'Draft' | 'Pending' | 'Signed' | 'Active' | 'Expiring' | 'Terminated' | 'Expired' | 'Cancelled';  // ✅ NOUVEAUX STATUTS
  roomId?: string;              // ✅ NOUVEAU - Pour colocation individuelle
  isConflict: boolean;          // ✅ NOUVEAU - Marqueur conflit
  notes?: string;
  paymentsCount?: number;
  createdAt?: string;

  // ✅ Préavis
  noticeEndDate?: string;
  noticeDate?: string;
  noticeReason?: string;

  // ✅ Inventories
  hasInventoryEntry?: boolean;
  hasInventoryExit?: boolean;
  inventoryEntryId?: string;
  inventoryExitId?: string;
}

export interface ContractTerminationEligibilityDto {
  canTerminate: boolean;
  hasInventoryEntry: boolean;
  hasInventoryExit: boolean;
  inventoryEntryId?: string | null;
  inventoryExitId?: string | null;
  paymentsUpToDate: boolean;
  outstandingAmount: number;
  overduePaymentsCount: number;
  blockReason?: string | null;
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
  charges?: number;             // ✅ NOUVEAU - Charges mensuelles
  deposit?: number;
  paymentDueDay?: number;       // ✅ NOUVEAU - Jour limite de paiement (1-31)
  roomId?: string;              // ✅ NOUVEAU - Pour colocation individuelle
  notes?: string;
}

export interface RecordPaymentRequest {
  amount: number;
  paymentDate: string;
  method: 'Cash' | 'BankTransfer' | 'Check' | 'CreditCard';
}

export interface TerminateContractRequest {
  terminationDate: string;
  contractId: string;
  reason?: string;
}

export interface GiveNoticeRequest {
  noticeDate: string;
  noticeEndDate: string;
  reason: string;
}

export interface MarkAsSignedRequest {
  signedDate?: string;
  contractId?: string;
}

export interface RenewContractRequest {
  newStartDate: string;
  newEndDate: string;
  contractType: string;
  newRent: number;
  newCharges: number;
  previousIRL?: number | null;
  currentIRL?: number | null;
  deposit?: number | null;
  customClauses?: string | null;
  notes?: string | null;
  tacitRenewal: boolean;
  attachedDocumentIds?: string[];
}

export interface PaginatedResponse<T> {
  total: number;
  page: number;
  pageSize: number;
  data: T[];
}

export type BillingShareType = 'Percentage' | 'FixedAmount';

export interface OccupantParticipantChangeDto {
  tenantId: string;
  shareValue: number;
}

export interface OccupantRoomChangeDto {
  oldRoomLabel?: string | null;
  newRoomId: string;
}

export interface OccupantChangesDto {
  splitType: BillingShareType;
  participants: OccupantParticipantChangeDto[];
  roomChange?: OccupantRoomChangeDto;
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

  getContractsByTenant(tenantId: string): Observable<ContractDto[]> {
    return this.http.get<ContractDto[]>(`${this.baseUrl}/tenant/${tenantId}`);
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

  getTerminationEligibility(contractId: string): Observable<ContractTerminationEligibilityDto> {
    return this.http.get<ContractTerminationEligibilityDto>(`${this.baseUrl}/${contractId}/termination-eligibility`);
  }

  cancelContract(contractId: string): Observable<{ message: string; id: string }> {
    return this.http.put<{ message: string; id: string }>(`${this.baseUrl}/${contractId}/cancel`, {});
  }

  markAsSigned(contractId: string, request?: MarkAsSignedRequest): Observable<{ message: string; id: string }> {
    return this.http.put<{ message: string; id: string }>(`${this.baseUrl}/${contractId}/mark-signed`, request || {});
  }
  
  deleteContract(contractId: string): Observable<{ message: string; id: string; deletedPayments: number; deletedDocuments: number }> {
    return this.http.delete<{ message: string; id: string; deletedPayments: number; deletedDocuments: number }>(`${this.baseUrl}/${contractId}`);
  }
  
  updateContract(contractId: string, request: Partial<CreateContractRequest>): Observable<{ message: string; id: string }> {
    return this.http.put<{ message: string; id: string }>(`${this.baseUrl}/${contractId}`, request);
  }
  
  renewContract(contractId: string, request: RenewContractRequest): Promise<{ message: string; newContractId: string }> {
    return this.http.post<{ message: string; newContractId: string }>(`${this.baseUrl}/${contractId}/renew`, request).toPromise() as Promise<{ message: string; newContractId: string }>;
  }
  
  createAddendum(contractId: string, request: CreateAddendumRequest): Promise<{ message: string; addendumId: string }> {
    return this.http.post<{ message: string; addendumId: string }>(`${this.baseUrl}/${contractId}/addendum`, request).toPromise() as Promise<{ message: string; addendumId: string }>;
  }

  giveNotice(contractId: string, request: GiveNoticeRequest): Observable<{ message: string; id: string }> {
    return this.http.put<{ message: string; id: string }>(`${this.baseUrl}/${contractId}/notice`, request);
  }

  cancelNotice(contractId: string): Observable<{ message: string; id: string }> {
    return this.http.put<{ message: string; id: string }>(`${this.baseUrl}/${contractId}/notice/cancel`, {});
  }
}

export interface CreateAddendumRequest {
  type: string;
  effectiveDate: string;
  reason: string;
  description: string;
  newRent?: number | null;
  newCharges?: number | null;
  newEndDate?: string | null;
  occupantChanges?: OccupantChangesDto | null;
  newRoomId?: string | null;
  newClauses?: string | null;
  attachedDocumentIds?: string[];
  notes?: string | null;
  sendEmail: boolean;
  requireSignature: boolean;
}
