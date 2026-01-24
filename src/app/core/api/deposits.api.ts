import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environnements/environment';

export interface DepositTransactionDto {
  id: string;
  kind: string;
  amount: number;
  dateUtc: string;
  reference?: string | null;
}

export interface DepositDto {
  id: string;
  contractId: string;
  amountExpected: number;
  dueDate: string;
  allowInstallments: boolean;
  status: string;
  totalReceived: number;
  totalRefunded: number;
  totalDeducted: number;
  balanceHeld: number;
  outstanding: number;
  transactions: DepositTransactionDto[];
}

export interface ReceiveDepositRequest {
  amount: number;
  dateUtc: string;
  reference?: string | null;
}

@Injectable({ providedIn: 'root' })
export class DepositsApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.BASE_LOCAGUEST_API}/api/Deposits`;

  getByContract(contractId: string): Observable<DepositDto> {
    return this.http.get<DepositDto>(`${this.baseUrl}/contract/${contractId}`);
  }

  receiveByContract(contractId: string, request: ReceiveDepositRequest): Observable<{ depositId: string }> {
    return this.http.post<{ depositId: string }>(`${this.baseUrl}/contract/${contractId}/receive`, request);
  }

  getReceiptPdfByContract(contractId: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/contract/${contractId}/receipt`, {
      responseType: 'blob',
    });
  }
}
