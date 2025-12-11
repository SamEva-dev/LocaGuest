import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environnements/environment';

export interface CheckoutSessionResponse {
  sessionId: string;
  checkoutUrl: string;
}

export interface BillingInvoice {
  id: string;
  date: string;
  description: string;
  amount: number;
  currency: string;
  status: string;
  invoicePdf?: string;
}

export interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
}

@Injectable({ providedIn: 'root' })
export class BillingApi {
  private http = inject(HttpClient);
  private baseUrl = `${environment.BASE_LOCAGUEST_API}/api/billing`;

  /**
   * Creates a Stripe Checkout session
   */
  createCheckoutSession(
    planId: string,
    isAnnual: boolean,
    successUrl?: string,
    cancelUrl?: string
  ): Observable<CheckoutSessionResponse> {
    return this.http.post<CheckoutSessionResponse>(`${this.baseUrl}/checkout`, {
      planId,
      isAnnual,
      successUrl: successUrl || `${window.location.origin}/settings/billing?success=true`,
      cancelUrl: cancelUrl || `${window.location.origin}/pricing?canceled=true`
    });
  }

  /**
   * Gets billing invoices for the current user
   */
  getInvoices(): Observable<BillingInvoice[]> {
    return this.http.get<BillingInvoice[]>(`${this.baseUrl}/invoices`);
  }

  /**
   * Cancels the current subscription
   */
  cancelSubscription(immediately: boolean = false): Observable<any> {
    return this.http.post(`${this.baseUrl}/cancel`, {
      cancelImmediately: immediately
    });
  }

  /**
   * Gets the Stripe Customer Portal URL
   */
  getCustomerPortalUrl(returnUrl?: string): Observable<{ url: string }> {
    const params: Record<string, string> = returnUrl ? { returnUrl } : {};
    return this.http.get<{ url: string }>(`${this.baseUrl}/portal-url`, { params });
  }
}
