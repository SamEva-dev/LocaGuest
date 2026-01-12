import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environnements/environment.dev';

// 💰 Payment Interfaces
export interface Payment {
  id: string;
  tenantId: string;
  propertyId: string;
  contractId: string;
  paymentType?: 'Rent' | 'Deposit';
  amountDue: number;
  amountPaid: number;
  remainingAmount: number;
  paymentDate?: Date;
  expectedDate: Date;
  status: PaymentStatus;
  paymentMethod: PaymentMethod;
  note?: string;
  month: number;
  year: number;
  receiptId?: string;
  invoiceDocumentId?: string;
  createdAt: Date;
  updatedAt?: Date;
  tenantName?: string;
  propertyName?: string;
  paymentDueDay?: number; // Jour limite (1-31)
  daysLate?: number; // Positif = retard, Négatif = à venir
  dueDate?: Date; // Date limite calculée
}

export type PaymentStatus = 
  | 'Pending'
  | 'Paid'
  | 'PaidLate'
  | 'Partial'
  | 'Late'
  | 'Voided';

export type PaymentMethod = 
  | 'Cash'
  | 'BankTransfer'
  | 'Check'
  | 'Other';

export interface CreatePaymentRequest {
  tenantId: string;
  propertyId: string;
  contractId: string;
  paymentType: 'Rent' | 'Deposit';
  amountDue: number;
  amountPaid: number;
  paymentDate?: Date;
  expectedDate: Date;
  paymentMethod: PaymentMethod;
  note?: string;
}

export interface UpdatePaymentRequest {
  id: string;
  amountPaid: number;
  paymentDate?: Date;
  paymentMethod?: PaymentMethod;
  note?: string;
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

export interface RentInvoice {
  id: string;
  contractId: string;
  tenantId: string;
  propertyId: string;
  month: number;
  year: number;
  amount: number;
  status: InvoiceStatus;
  paymentId?: string;
  generatedAt: Date;
  dueDate: Date;
  isOverdue: boolean;
  tenantName?: string;
  propertyName?: string;
}

export type InvoiceStatus = 
  | 'Pending'
  | 'Paid'
  | 'Partial'
  | 'Late'
  | 'Cancelled';

@Injectable({
  providedIn: 'root'
})
export class PaymentsApi {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.BASE_LOCAGUEST_API}/api/Payments`;

  /**
   * Create a new payment
   */
  createPayment(request: CreatePaymentRequest): Observable<Payment> {
    return this.http.post<Payment>(this.baseUrl, request);
  }

  /**
   * Get all payments for a tenant
   */
  getPaymentsByTenant(tenantId: string): Observable<Payment[]> {
    return this.http.get<Payment[]>(`${this.baseUrl}/tenant/${tenantId}`);
  }

  /**
   * Get all payments for a property
   */
  getPaymentsByProperty(propertyId: string): Observable<Payment[]> {
    return this.http.get<Payment[]>(`${this.baseUrl}/property/${propertyId}`);
  }

  /**
   * Get payment statistics
   */
  getPaymentStats(params: {
    tenantId?: string;
    propertyId?: string;
    month?: number;
    year?: number;
  }): Observable<PaymentStats> {
    let httpParams = new HttpParams();
    
    if (params.tenantId) httpParams = httpParams.set('tenantId', params.tenantId);
    if (params.propertyId) httpParams = httpParams.set('propertyId', params.propertyId);
    if (params.month) httpParams = httpParams.set('month', params.month.toString());
    if (params.year) httpParams = httpParams.set('year', params.year.toString());

    return this.http.get<PaymentStats>(`${this.baseUrl}/stats`, { params: httpParams });
  }

  /**
   * Update an existing payment
   */
  updatePayment(id: string, request: Omit<UpdatePaymentRequest, 'id'>): Observable<Payment> {
    return this.http.put<Payment>(`${this.baseUrl}/${id}`, request);
  }

  /**
   * Delete (void) a payment
   */
  deletePayment(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  getPaymentQuittance(paymentId: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${paymentId}/quittance`, {
      responseType: 'blob',
    });
  }

  /**
   * Helper: Get formatted month name
   */
  getMonthName(month: number): string {
    const date = new Date(2000, month - 1, 1);
    return date.toLocaleDateString('fr-FR', { month: 'long' });
  }

  /**
   * Helper: Get payment status badge class
   */
  getStatusBadgeClass(status: PaymentStatus): string {
    const classes: Record<PaymentStatus, string> = {
      'Paid': 'badge-success',
      'PaidLate': 'badge-warning',
      'Partial': 'badge-warning',
      'Late': 'badge-danger',
      'Pending': 'badge-secondary',
      'Voided': 'badge-dark'
    };
    return classes[status] || 'badge-secondary';
  }

  /**
   * Helper: Get payment status label
   */
  getStatusLabel(status: PaymentStatus): string {
    const labels: Record<PaymentStatus, string> = {
      'Paid': 'Payé',
      'PaidLate': 'Payé en retard',
      'Partial': 'Paiement partiel',
      'Late': 'En retard',
      'Pending': 'En attente',
      'Voided': 'Annulé'
    };
    return labels[status] || status;
  }

  /**
   * Helper: Get payment method label
   */
  getMethodLabel(method: PaymentMethod): string {
    const labels: Record<PaymentMethod, string> = {
      'Cash': 'Espèces',
      'BankTransfer': 'Virement',
      'Check': 'Chèque',
      'Other': 'Autre'
    };
    return labels[method] || method;
  }
}
