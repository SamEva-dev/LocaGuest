/**
 * TRACKING INTEGRATION EXAMPLE
 * Copy this code into your app.component.ts or main layout component
 */

import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter, Subject, takeUntil } from 'rxjs';
import { TrackingService } from './src/app/core/services/tracking.service';

@Component({
  selector: 'app-root',
  template: `<router-outlet></router-outlet>`
})
export class AppComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private tracking = inject(TrackingService);
  private destroy$ = new Subject<void>();
  
  private sensitivePages = [
    '/login',
    '/register',
    '/reset-password',
    '/auth'
  ];

  ngOnInit(): void {
    // Auto-track page views on navigation
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe((event: NavigationEnd) => {
      // Don't track sensitive pages (GDPR/privacy)
      if (!this.isSensitivePage(event.urlAfterRedirects)) {
        this.tracking.trackPageView(
          this.getPageName(event.urlAfterRedirects),
          event.urlAfterRedirects
        ).subscribe();
      }
    });
  }

  ngOnDestroy(): void {
    // Flush pending tracking events before app exit
    this.tracking.flush();
    this.destroy$.next();
    this.destroy$.complete();
  }

  private isSensitivePage(url: string): boolean {
    return this.sensitivePages.some(page => url.startsWith(page));
  }

  private getPageName(url: string): string {
    // Extract page name from URL
    const parts = url.split('/').filter(p => p);
    return parts.length > 0 ? parts[0] : 'home';
  }
}

/**
 * USAGE EXAMPLES IN COMPONENTS
 */

// Example 1: Track button clicks in a component
@Component({
  selector: 'app-properties-list',
  template: `
    <button (click)="addProperty()">Ajouter un bien</button>
  `
})
export class PropertiesListComponent {
  private tracking = inject(TrackingService);

  addProperty(): void {
    // Track the action
    this.tracking.trackButtonClick('ADD_PROPERTY_BUTTON').subscribe();
    
    // Continue with business logic
    // ... navigate to form, etc.
  }
}

// Example 2: Track form submission
@Component({
  selector: 'app-property-form',
  template: `<form (ngSubmit)="onSubmit()">...</form>`
})
export class PropertyFormComponent {
  private tracking = inject(TrackingService);

  onSubmit(): void {
    // Track form submission
    this.tracking.trackFormSubmit('PROPERTY_FORM', {
      hasPhotos: this.form.value.photos?.length > 0,
      propertyType: this.form.value.type
    }).subscribe();
    
    // Submit to API
    this.propertiesService.create(this.form.value).subscribe({
      next: (property) => {
        // Track business action
        this.tracking.trackPropertyCreated(property.id).subscribe();
      }
    });
  }
}

// Example 3: Track feature usage
@Component({
  selector: 'app-dashboard',
  template: `<button (click)="exportData()">Export CSV</button>`
})
export class DashboardComponent {
  private tracking = inject(TrackingService);

  exportData(): void {
    this.tracking.trackFeatureUsed('EXPORT_CSV', {
      dataType: 'properties',
      format: 'csv'
    }).subscribe();
    
    // Perform export
    this.exportService.exportToCsv();
  }
}

// Example 4: Track search
@Component({
  selector: 'app-search',
  template: `<input (change)="onSearch($event)" />`
})
export class SearchComponent {
  private tracking = inject(TrackingService);

  onSearch(query: string): void {
    this.propertiesService.search(query).subscribe(results => {
      this.tracking.trackSearch(query, results.length).subscribe();
    });
  }
}

// Example 5: Track modal opening
@Component({
  selector: 'app-tenant-selection',
  template: `...`
})
export class TenantSelectionComponent implements OnInit {
  private tracking = inject(TrackingService);

  ngOnInit(): void {
    this.tracking.trackModalOpened('TENANT_SELECTION_MODAL').subscribe();
  }
}

// Example 6: Track errors
@Component({
  selector: 'app-some-feature'
})
export class SomeFeatureComponent {
  private tracking = inject(TrackingService);

  someMethod(): void {
    this.apiService.doSomething().subscribe({
      error: (error) => {
        // Track error for analytics
        this.tracking.trackError(error, 'SomeFeatureComponent.someMethod').subscribe();
        
        // Show error to user
        this.toast.error('An error occurred');
      }
    });
  }
}

// Example 7: Track subscription upgrade clicks
@Component({
  selector: 'app-pricing',
  template: `
    <button (click)="selectPlan(plan)">Choose {{ plan.name }}</button>
  `
})
export class PricingComponent {
  private tracking = inject(TrackingService);
  private subscription = inject(SubscriptionService);

  selectPlan(plan: Plan): void {
    const currentPlan = this.subscription.currentPlan();
    
    // Track upgrade intent
    this.tracking.trackUpgradeClicked(
      currentPlan?.code || 'free',
      plan.code
    ).subscribe();
    
    // Continue to checkout
    this.tracking.trackCheckoutStarted(plan.code, this.isAnnual()).subscribe();
    
    // Redirect to Stripe...
  }
}

// Example 8: Track document downloads
@Component({
  selector: 'app-documents'
})
export class DocumentsComponent {
  private tracking = inject(TrackingService);

  downloadDocument(doc: Document): void {
    this.tracking.trackDownload(doc.name, doc.type).subscribe();
    
    this.documentsService.download(doc.id).subscribe();
  }
}

// Example 9: Track tab changes
@Component({
  selector: 'app-property-detail',
  template: `
    <mat-tab-group (selectedTabChange)="onTabChange($event)">
      <mat-tab label="Overview"></mat-tab>
      <mat-tab label="Tenants"></mat-tab>
      <mat-tab label="Contracts"></mat-tab>
    </mat-tab-group>
  `
})
export class PropertyDetailComponent {
  private tracking = inject(TrackingService);
  private currentTab = 'overview';

  onTabChange(event: any): void {
    const tabNames = ['overview', 'tenants', 'contracts'];
    const newTab = tabNames[event.index];
    
    this.tracking.trackTabChanged(newTab, this.currentTab).subscribe();
    this.currentTab = newTab;
  }
}

/**
 * DECORATOR FOR AUTOMATIC TRACKING (Advanced)
 */
export function Track(eventType: string, metadataFn?: () => any) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
      const tracking = inject(TrackingService);
      const metadata = metadataFn ? metadataFn.call(this) : undefined;
      
      tracking.track(eventType, undefined, undefined, metadata).subscribe();
      
      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

// Usage with decorator
@Component({
  selector: 'app-example'
})
export class ExampleComponent {
  @Track('IMPORTANT_ACTION', () => ({ timestamp: Date.now() }))
  importantAction(): void {
    // This action will be automatically tracked
    console.log('Action performed');
  }
}
