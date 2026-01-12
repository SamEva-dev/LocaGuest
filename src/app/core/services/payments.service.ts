import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environnements/environment.dev';

export interface Payment {
  id: string;
  tenantId: string;
  propertyId: string;
  contractId: string;
  amountDue: number;
  amountPaid: number;
  remainingAmount: number;
  paymentDate?: string;
  expectedDate: string;
  status: 'Pending' | 'Paid' | 'PaidLate' | 'Partial' | 'Late' | 'Voided';
  paymentMethod: 'Cash' | 'BankTransfer' | 'Check' | 'Other';
  note?: string;
  month: number;
  year: number;
  receiptId?: string;
  createdAt: string;
  updatedAt?: string;
  tenantName?: string;
  propertyName?: string;
  daysLate?: number;
}

export interface CreatePaymentDto {
  tenantId: string;
  propertyId: string;
  contractId: string;
  amountDue: number;
  amountPaid: number;
  paymentDate?: string;
  expectedDate: string;
  paymentMethod: string;
  note?: string;
}

export interface UpdatePaymentDto {
  id: string;
  amountPaid: number;
  paymentDate?: string;
  paymentMethod?: string;
  note?: string;
}

export interface PaymentsDashboard {
  totalRevenue: number;
  totalExpected: number;
  totalOverdue: number;
  overdueCount: number;
  collectionRate: number;
  totalPayments: number;
  paidCount: number;
  pendingCount: number;
  upcomingPayments: UpcomingPayment[];
  topOverduePayments: OverduePaymentSummary[];
}

export interface UpcomingPayment {
  id: string;
  tenantId: string;
  tenantName: string;
  propertyId: string;
  propertyName: string;
  amountDue: number;
  expectedDate: string;
  daysUntilDue: number;
}

export interface OverduePaymentSummary {
  id: string;
  tenantId: string;
  tenantName: string;
  propertyId: string;
  propertyName: string;
  amountDue: number;
  amountPaid: number;
  remainingAmount: number;
  expectedDate: string;
  daysLate: number;
}

export interface PaymentStats {
  totalExpected: number;
  totalPaid: number;
  totalRemaining: number;
  countPaid: number;
  countLate: number;
  countPending: number;
  countPartial: number;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentsService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.BASE_LOCAGUEST_API}/api/Payments`;

  /**
   * Create a new payment
   */
  createPayment(dto: CreatePaymentDto): Observable<Payment> {
    return this.http.post<Payment>(this.baseUrl, dto);
  }

  /**
   * Update an existing payment
   */
  updatePayment(id: string, dto: UpdatePaymentDto): Observable<Payment> {
    return this.http.put<Payment>(`${this.baseUrl}/${id}`, dto);
  }

  /**
   * Delete (void) a payment
   */
  voidPayment(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  /**
   * Get payments by tenant
   */
  getPaymentsByTenant(tenantId: string): Observable<Payment[]> {
    return this.http.get<Payment[]>(`${this.baseUrl}/tenant/${tenantId}`);
  }

  /**
   * Get payments by property
   */
  getPaymentsByProperty(propertyId: string): Observable<Payment[]> {
    return this.http.get<Payment[]>(`${this.baseUrl}/property/${propertyId}`);
  }

  /**
   * Get payment statistics
   */
  getPaymentStats(params?: {
    tenantId?: string;
    propertyId?: string;
    month?: number;
    year?: number;
  }): Observable<PaymentStats> {
    return this.http.get<PaymentStats>(`${this.baseUrl}/stats`, { params: params as any });
  }

  /**
   * Get overdue payments
   */
  getOverduePayments(params?: {
    propertyId?: string;
    tenantId?: string;
    maxDaysLate?: number;
  }): Observable<Payment[]> {
    return this.http.get<Payment[]>(`${this.baseUrl}/overdue`, { params: params as any });
  }

  /**
   * Get payments dashboard with KPIs
   */
  getPaymentsDashboard(params?: {
    month?: number;
    year?: number;
  }): Observable<PaymentsDashboard> {
    return this.http.get<PaymentsDashboard>(`${this.baseUrl}/dashboard`, { params: params as any });
  }

  /**
   * Get payment status badge class
   */
  getStatusBadgeClass(status: Payment['status']): string {
    switch (status) {
      case 'Paid':
        return 'badge-success';
      case 'PaidLate':
        return 'badge-warning';
      case 'Pending':
        return 'badge-info';
      case 'Partial':
        return 'badge-warning';
      case 'Late':
        return 'badge-danger';
      case 'Voided':
        return 'badge-secondary';
      default:
        return 'badge-secondary';
    }
  }

  /**
   * Get payment status label
   */
  getStatusLabel(status: Payment['status']): string {
    switch (status) {
      case 'Paid':
        return 'Payé';
      case 'PaidLate':
        return 'Payé en retard';
      case 'Pending':
        return 'En attente';
      case 'Partial':
        return 'Partiel';
      case 'Late':
        return 'En retard';
      case 'Voided':
        return 'Annulé';
      default:
        return status;
    }
  }

  /**
   * Get payment method label
   */
  getPaymentMethodLabel(method: Payment['paymentMethod']): string {
    switch (method) {
      case 'Cash':
        return 'Espèces';
      case 'BankTransfer':
        return 'Virement';
      case 'Check':
        return 'Chèque';
      case 'Other':
        return 'Autre';
      default:
        return method;
    }
  }
}
