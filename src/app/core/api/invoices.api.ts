import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environnements/environment';

export interface RentInvoiceDto {
  id: string;
  contractId: string;
  tenantId: string;
  propertyId: string;
  month: number;
  year: number;
  amount: number;
  status: string;
  paymentId?: string;
  generatedAt: Date;
  dueDate: Date;
  isOverdue: boolean;
  tenantName?: string;
  propertyName?: string;
}

@Injectable({ providedIn: 'root' })
export class InvoicesApi {
  private http = inject(HttpClient);
  private baseUrl = `${environment.BASE_LOCAGUEST_API}/api/Invoices`;

  getInvoicesByTenant(tenantId: string): Observable<RentInvoiceDto[]> {
    return this.http.get<RentInvoiceDto[]>(`${this.baseUrl}/tenant/${tenantId}`);
  }

  getInvoicePdf(invoiceId: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${invoiceId}/pdf`, {
      responseType: 'blob',
    });
  }
}
