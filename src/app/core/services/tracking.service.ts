import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { environment } from '../../../environnements/environment';

/**
 * Service for tracking user behavior and analytics
 * Automatically injects TenantId and UserId from backend (multi-tenant secure)
 */
@Injectable({ providedIn: 'root' })
export class TrackingService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.BASE_LOCAGUEST_API}/api/tracking`;
  
  // Queue for batching events (performance optimization)
  private eventQueue: TrackingEventDto[] = [];
  private batchTimeout: any;
  private readonly BATCH_SIZE = 10;
  private readonly BATCH_DELAY_MS = 5000;

  /**
   * Track a single event
   * @param eventType Event type (e.g., 'PAGE_VIEW', 'BUTTON_CLICK')
   * @param pageName Optional page name
   * @param url Optional URL
   * @param metadata Optional additional data
   */
  track(
    eventType: string,
    pageName?: string,
    url?: string,
    metadata?: any
  ): Observable<void> {
    const event: TrackingEventDto = {
      eventType,
      pageName: pageName || null,
      url: url || null,
      metadata: metadata || null
    };

    // Add to batch queue for performance
    this.eventQueue.push(event);

    if (this.eventQueue.length >= this.BATCH_SIZE) {
      this.flushBatch();
    } else if (!this.batchTimeout) {
      this.batchTimeout = setTimeout(() => this.flushBatch(), this.BATCH_DELAY_MS);
    }

    // Return immediately (fire and forget)
    return of(void 0);
  }

  /**
   * Track immediately without batching (use sparingly)
   */
  trackImmediate(
    eventType: string,
    pageName?: string,
    url?: string,
    metadata?: any
  ): Observable<void> {
    const event: TrackingEventDto = {
      eventType,
      pageName: pageName || null,
      url: url || null,
      metadata: metadata || null
    };

    return this.http.post<void>(`${this.apiUrl}/event`, event).pipe(
      catchError((error) => {
        // Never throw - tracking should not break user experience
        console.warn('Tracking error:', error);
        return of(void 0);
      })
    );
  }

  /**
   * Flush pending events in batch
   */
  private flushBatch(): void {
    if (this.eventQueue.length === 0) return;

    const batch = [...this.eventQueue];
    this.eventQueue = [];

    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }

    this.http.post<void>(`${this.apiUrl}/events/batch`, batch).pipe(
      catchError((error) => {
        console.warn('Batch tracking error:', error);
        return of(void 0);
      })
    ).subscribe();
  }

  /**
   * Force flush all pending events (call before app exit)
   */
  flush(): void {
    this.flushBatch();
  }

  // Convenience methods for common events

  trackPageView(pageName: string, url: string): Observable<void> {
    return this.track('PAGE_VIEW', pageName, url);
  }

  trackButtonClick(buttonName: string, metadata?: any): Observable<void> {
    return this.track('BUTTON_CLICK', undefined, undefined, { button: buttonName, ...metadata });
  }

  trackFeatureUsed(featureName: string, metadata?: any): Observable<void> {
    return this.track('FEATURE_USED', undefined, undefined, { feature: featureName, ...metadata });
  }

  trackFormSubmit(formName: string, metadata?: any): Observable<void> {
    return this.track('FORM_SUBMIT', undefined, undefined, { form: formName, ...metadata });
  }

  trackError(error: any, context?: string): Observable<void> {
    return this.track('ERROR_OCCURRED', undefined, undefined, {
      error: error?.message || 'Unknown error',
      context: context || 'unknown',
      stack: error?.stack
    });
  }

  trackDownload(fileName: string, fileType?: string): Observable<void> {
    return this.track('DOWNLOAD_FILE', undefined, undefined, { fileName, fileType });
  }

  trackSearch(query: string, resultsCount?: number): Observable<void> {
    return this.track('SEARCH_PERFORMED', undefined, undefined, { query, resultsCount });
  }

  trackModalOpened(modalName: string): Observable<void> {
    return this.track('MODAL_OPENED', undefined, undefined, { modal: modalName });
  }

  trackTabChanged(tabName: string, from?: string): Observable<void> {
    return this.track('TAB_CHANGED', undefined, undefined, { tab: tabName, from });
  }

  // Business-specific tracking

  trackPropertyCreated(propertyId: string): Observable<void> {
    return this.track('PROPERTY_CREATED', undefined, undefined, { propertyId });
  }

  trackContractCreated(contractId: string): Observable<void> {
    return this.track('CONTRACT_CREATED', undefined, undefined, { contractId });
  }

  trackTenantCreated(tenantId: string): Observable<void> {
    return this.track('TENANT_CREATED', undefined, undefined, { tenantId });
  }

  trackPaymentRecorded(amount: number, currency: string): Observable<void> {
    return this.track('PAYMENT_RECORDED', undefined, undefined, { amount, currency });
  }

  trackDocumentGenerated(documentType: string): Observable<void> {
    return this.track('DOCUMENT_GENERATED', undefined, undefined, { documentType });
  }

  trackReminderSent(type: string): Observable<void> {
    return this.track('REMINDER_SENT', undefined, undefined, { type });
  }

  trackUpgradeClicked(from: string, to: string): Observable<void> {
    return this.track('UPGRADE_CLICKED', undefined, undefined, { from, to });
  }

  trackCheckoutStarted(planCode: string, isAnnual: boolean): Observable<void> {
    return this.track('CHECKOUT_STARTED', undefined, undefined, { planCode, isAnnual });
  }
}

/**
 * DTO for tracking event (matches backend)
 */
interface TrackingEventDto {
  eventType: string;
  pageName: string | null;
  url: string | null;
  metadata: any | null;
}

/**
 * Standard event types (same as backend)
 */
export const TrackingEventTypes = {
  // Pages
  PAGE_VIEW: 'PAGE_VIEW',
  PAGE_EXIT: 'PAGE_EXIT',
  
  // User actions
  BUTTON_CLICK: 'BUTTON_CLICK',
  FORM_SUBMIT: 'FORM_SUBMIT',
  DOWNLOAD_FILE: 'DOWNLOAD_FILE',
  
  // Business
  PROPERTY_CREATED: 'PROPERTY_CREATED',
  CONTRACT_CREATED: 'CONTRACT_CREATED',
  TENANT_CREATED: 'TENANT_CREATED',
  PAYMENT_RECORDED: 'PAYMENT_RECORDED',
  DOCUMENT_GENERATED: 'DOCUMENT_GENERATED',
  REMINDER_SENT: 'REMINDER_SENT',
  
  // Features
  FEATURE_USED: 'FEATURE_USED',
  SEARCH_PERFORMED: 'SEARCH_PERFORMED',
  FILTER_APPLIED: 'FILTER_APPLIED',
  EXPORT_TRIGGERED: 'EXPORT_TRIGGERED',
  
  // Navigation
  TAB_CHANGED: 'TAB_CHANGED',
  MODAL_OPENED: 'MODAL_OPENED',
  MODAL_CLOSED: 'MODAL_CLOSED',
  
  // Subscription
  UPGRADE_CLICKED: 'UPGRADE_CLICKED',
  PRICING_PAGE_VIEWED: 'PRICING_PAGE_VIEWED',
  CHECKOUT_STARTED: 'CHECKOUT_STARTED',
  
  // Errors
  ERROR_OCCURRED: 'ERROR_OCCURRED',
  API_ERROR: 'API_ERROR'
} as const;
