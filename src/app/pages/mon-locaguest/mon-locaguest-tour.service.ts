import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { driver, Driver } from 'driver.js';

export type MonLocaGuestTourContext = 'summary' | 'property' | 'tenant';

@Injectable({ providedIn: 'root' })
export class MonLocaGuestTourService {
  private readonly translate = inject(TranslateService);

  start(context: MonLocaGuestTourContext = 'summary'): void {
    switch (context) {
      case 'property':
        this.startProperty();
        return;
      case 'tenant':
        this.startTenant();
        return;
      default:
        this.startSummary();
        return;
    }
  }

  private createDriver(steps: any[]): Driver {
    return driver({
      showProgress: true,
      animate: true,
      overlayOpacity: 0.65,
      allowClose: true,
      nextBtnText: this.translate.instant('TOUR.COMMON.NEXT'),
      prevBtnText: this.translate.instant('TOUR.COMMON.PREV'),
      doneBtnText: this.translate.instant('TOUR.COMMON.DONE'),
      steps
    });
  }

  private selectorExists(selector: string): boolean {
    return typeof document !== 'undefined' && !!document.querySelector(selector);
  }

  private addStepIfExists(steps: any[], selector: string, titleKey: string, descKey: string, side: any, align: any) {
    if (!this.selectorExists(selector)) return;
    steps.push({
      element: selector,
      popover: {
        title: this.translate.instant(titleKey),
        description: this.translate.instant(descKey),
        side,
        align
      }
    });
  }

  private startSummary(): void {
    const steps = [
      {
        element: '[data-tour="mlg.tabs"]',
        popover: {
          title: this.translate.instant('TOUR.MON_LOCAGUEST.STEP_1.TITLE'),
          description: this.translate.instant('TOUR.MON_LOCAGUEST.STEP_1.DESC'),
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: '[data-tour="mlg.tab.summary"]',
        popover: {
          title: this.translate.instant('TOUR.MON_LOCAGUEST.STEP_2.TITLE'),
          description: this.translate.instant('TOUR.MON_LOCAGUEST.STEP_2.DESC'),
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: '[data-tour="summary.actions"]',
        popover: {
          title: this.translate.instant('TOUR.MON_LOCAGUEST.STEP_3.TITLE'),
          description: this.translate.instant('TOUR.MON_LOCAGUEST.STEP_3.DESC'),
          side: 'bottom',
          align: 'end'
        }
      },
      {
        element: '[data-tour="summary.view-switch"]',
        popover: {
          title: this.translate.instant('TOUR.MON_LOCAGUEST.STEP_4.TITLE'),
          description: this.translate.instant('TOUR.MON_LOCAGUEST.STEP_4.DESC'),
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: '[data-tour="summary.search"]',
        popover: {
          title: this.translate.instant('TOUR.MON_LOCAGUEST.STEP_5.TITLE'),
          description: this.translate.instant('TOUR.MON_LOCAGUEST.STEP_5.DESC'),
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: '[data-tour="summary.list"]',
        popover: {
          title: this.translate.instant('TOUR.MON_LOCAGUEST.STEP_6.TITLE'),
          description: this.translate.instant('TOUR.MON_LOCAGUEST.STEP_6.DESC'),
          side: 'top',
          align: 'start'
        }
      },
      {
        element: '[data-tour="summary.notifications"]',
        popover: {
          title: this.translate.instant('TOUR.MON_LOCAGUEST.STEP_7.TITLE'),
          description: this.translate.instant('TOUR.MON_LOCAGUEST.STEP_7.DESC'),
          side: 'left',
          align: 'start'
        }
      },
      {
        element: '[data-tour="summary.deadlines"]',
        popover: {
          title: this.translate.instant('TOUR.MON_LOCAGUEST.STEP_8.TITLE'),
          description: this.translate.instant('TOUR.MON_LOCAGUEST.STEP_8.DESC'),
          side: 'left',
          align: 'start'
        }
      }
    ];

    this.createDriver(steps).drive();
  }

  private startProperty(): void {
    const steps: any[] = [];
    this.addStepIfExists(
      steps,
      '[data-tour="mlg.tabs"]',
      'TOUR.PROPERTY_DETAIL.ROOT.STEP_1.TITLE',
      'TOUR.PROPERTY_DETAIL.ROOT.STEP_1.DESC',
      'bottom',
      'start'
    );
    this.addStepIfExists(
      steps,
      '[data-tour="property.subtabs"]',
      'TOUR.PROPERTY_DETAIL.ROOT.STEP_2.TITLE',
      'TOUR.PROPERTY_DETAIL.ROOT.STEP_2.DESC',
      'bottom',
      'start'
    );

    // Informations sub-tab
    if (this.selectorExists('[data-tour="property.info.edit"]')) {
      this.addStepIfExists(steps, '[data-tour="property.info.edit"]', 'TOUR.PROPERTY_DETAIL.INFO.STEP_1.TITLE', 'TOUR.PROPERTY_DETAIL.INFO.STEP_1.DESC', 'bottom', 'end');
      this.addStepIfExists(steps, '[data-tour="property.info.print"]', 'TOUR.PROPERTY_DETAIL.INFO.STEP_2.TITLE', 'TOUR.PROPERTY_DETAIL.INFO.STEP_2.DESC', 'bottom', 'end');
      this.addStepIfExists(steps, '[data-tour="property.info.photos.add"]', 'TOUR.PROPERTY_DETAIL.INFO.STEP_3.TITLE', 'TOUR.PROPERTY_DETAIL.INFO.STEP_3.DESC', 'right', 'start');
      this.addStepIfExists(steps, '[data-tour="property.info.photos.delete"]', 'TOUR.PROPERTY_DETAIL.INFO.STEP_4.TITLE', 'TOUR.PROPERTY_DETAIL.INFO.STEP_4.DESC', 'right', 'start');
    }

    // Tenants sub-tab
    if (this.selectorExists('[data-tour="property.tenants.view-toggle"]')) {
      this.addStepIfExists(steps, '[data-tour="property.tenants.view-toggle"]', 'TOUR.PROPERTY_DETAIL.TENANTS.STEP_1.TITLE', 'TOUR.PROPERTY_DETAIL.TENANTS.STEP_1.DESC', 'bottom', 'end');
      this.addStepIfExists(steps, '[data-tour="property.tenants.list"]', 'TOUR.PROPERTY_DETAIL.TENANTS.STEP_2.TITLE', 'TOUR.PROPERTY_DETAIL.TENANTS.STEP_2.DESC', 'top', 'start');
      this.addStepIfExists(steps, '[data-tour="property.tenants.open-tenant"]', 'TOUR.PROPERTY_DETAIL.TENANTS.STEP_3.TITLE', 'TOUR.PROPERTY_DETAIL.TENANTS.STEP_3.DESC', 'right', 'start');
      this.addStepIfExists(steps, '[data-tour="property.tenants.dissociate"]', 'TOUR.PROPERTY_DETAIL.TENANTS.STEP_4.TITLE', 'TOUR.PROPERTY_DETAIL.TENANTS.STEP_4.DESC', 'left', 'start');
      this.addStepIfExists(steps, '[data-tour="property.tenants.profile"]', 'TOUR.PROPERTY_DETAIL.TENANTS.STEP_5.TITLE', 'TOUR.PROPERTY_DETAIL.TENANTS.STEP_5.DESC', 'top', 'start');
      this.addStepIfExists(steps, '[data-tour="property.tenants.contract"]', 'TOUR.PROPERTY_DETAIL.TENANTS.STEP_6.TITLE', 'TOUR.PROPERTY_DETAIL.TENANTS.STEP_6.DESC', 'top', 'start');
      this.addStepIfExists(steps, '[data-tour="property.tenants.addendum"]', 'TOUR.PROPERTY_DETAIL.TENANTS.STEP_7.TITLE', 'TOUR.PROPERTY_DETAIL.TENANTS.STEP_7.DESC', 'top', 'start');
      this.addStepIfExists(steps, '[data-tour="property.tenants.renew"]', 'TOUR.PROPERTY_DETAIL.TENANTS.STEP_8.TITLE', 'TOUR.PROPERTY_DETAIL.TENANTS.STEP_8.DESC', 'top', 'start');
    }

    // Contracts sub-tab
    if (this.selectorExists('[data-tour="property.contracts.new"]')) {
      this.addStepIfExists(steps, '[data-tour="property.contracts.new"]', 'TOUR.PROPERTY_DETAIL.CONTRACTS.STEP_1.TITLE', 'TOUR.PROPERTY_DETAIL.CONTRACTS.STEP_1.DESC', 'bottom', 'end');
      this.addStepIfExists(steps, '[data-tour="property.contracts.paper"]', 'TOUR.PROPERTY_DETAIL.CONTRACTS.STEP_2.TITLE', 'TOUR.PROPERTY_DETAIL.CONTRACTS.STEP_2.DESC', 'bottom', 'end');
      this.addStepIfExists(steps, '[data-tour="property.contracts.add-inventory"]', 'TOUR.PROPERTY_DETAIL.CONTRACTS.STEP_3.TITLE', 'TOUR.PROPERTY_DETAIL.CONTRACTS.STEP_3.DESC', 'bottom', 'end');
      this.addStepIfExists(steps, '[data-tour="property.contracts.actions"]', 'TOUR.PROPERTY_DETAIL.CONTRACTS.STEP_4.TITLE', 'TOUR.PROPERTY_DETAIL.CONTRACTS.STEP_4.DESC', 'top', 'start');
    }

    this.createDriver(steps).drive();
  }

  private startTenant(): void {
    const steps: any[] = [];
    this.addStepIfExists(steps, '[data-tour="mlg.tabs"]', 'TOUR.TENANT_DETAIL.ROOT.STEP_1.TITLE', 'TOUR.TENANT_DETAIL.ROOT.STEP_1.DESC', 'bottom', 'start');
    this.addStepIfExists(steps, '[data-tour="tenant.header"]', 'TOUR.TENANT_DETAIL.ROOT.STEP_2.TITLE', 'TOUR.TENANT_DETAIL.ROOT.STEP_2.DESC', 'bottom', 'start');
    this.addStepIfExists(steps, '[data-tour="tenant.print"]', 'TOUR.TENANT_DETAIL.ROOT.STEP_3.TITLE', 'TOUR.TENANT_DETAIL.ROOT.STEP_3.DESC', 'left', 'start');
    this.addStepIfExists(steps, '[data-tour="tenant.status"]', 'TOUR.TENANT_DETAIL.ROOT.STEP_4.TITLE', 'TOUR.TENANT_DETAIL.ROOT.STEP_4.DESC', 'right', 'start');
    this.addStepIfExists(steps, '[data-tour="tenant.actions"]', 'TOUR.TENANT_DETAIL.ROOT.STEP_5.TITLE', 'TOUR.TENANT_DETAIL.ROOT.STEP_5.DESC', 'top', 'end');
    this.addStepIfExists(steps, '[data-tour="tenant.subtabs"]', 'TOUR.TENANT_DETAIL.ROOT.STEP_6.TITLE', 'TOUR.TENANT_DETAIL.ROOT.STEP_6.DESC', 'bottom', 'start');

    // Contracts sub-tab
    if (this.selectorExists('[data-tour="tenant.contracts.new"]')) {
      this.addStepIfExists(steps, '[data-tour="tenant.contracts.new"]', 'TOUR.TENANT_DETAIL.CONTRACTS.STEP_1.TITLE', 'TOUR.TENANT_DETAIL.CONTRACTS.STEP_1.DESC', 'bottom', 'end');
      this.addStepIfExists(steps, '[data-tour="tenant.contracts.list"]', 'TOUR.TENANT_DETAIL.CONTRACTS.STEP_2.TITLE', 'TOUR.TENANT_DETAIL.CONTRACTS.STEP_2.DESC', 'top', 'start');
      this.addStepIfExists(steps, '[data-tour="tenant.contracts.open-property"]', 'TOUR.TENANT_DETAIL.CONTRACTS.STEP_3.TITLE', 'TOUR.TENANT_DETAIL.CONTRACTS.STEP_3.DESC', 'right', 'start');
      this.addStepIfExists(steps, '[data-tour="tenant.contracts.toggle-documents"]', 'TOUR.TENANT_DETAIL.CONTRACTS.STEP_4.TITLE', 'TOUR.TENANT_DETAIL.CONTRACTS.STEP_4.DESC', 'left', 'start');
      this.addStepIfExists(steps, '[data-tour="tenant.contracts.actions"]', 'TOUR.TENANT_DETAIL.CONTRACTS.STEP_5.TITLE', 'TOUR.TENANT_DETAIL.CONTRACTS.STEP_5.DESC', 'top', 'start');
      this.addStepIfExists(steps, '[data-tour="tenant.contracts.renew"]', 'TOUR.TENANT_DETAIL.CONTRACTS.STEP_6.TITLE', 'TOUR.TENANT_DETAIL.CONTRACTS.STEP_6.DESC', 'top', 'start');
      this.addStepIfExists(steps, '[data-tour="tenant.contracts.addendum"]', 'TOUR.TENANT_DETAIL.CONTRACTS.STEP_7.TITLE', 'TOUR.TENANT_DETAIL.CONTRACTS.STEP_7.DESC', 'top', 'start');
      this.addStepIfExists(steps, '[data-tour="tenant.contracts.notice"]', 'TOUR.TENANT_DETAIL.CONTRACTS.STEP_8.TITLE', 'TOUR.TENANT_DETAIL.CONTRACTS.STEP_8.DESC', 'top', 'start');
      this.addStepIfExists(steps, '[data-tour="tenant.contracts.view"]', 'TOUR.TENANT_DETAIL.CONTRACTS.STEP_9.TITLE', 'TOUR.TENANT_DETAIL.CONTRACTS.STEP_9.DESC', 'top', 'start');
      this.addStepIfExists(steps, '[data-tour="tenant.contracts.exit-inventory"]', 'TOUR.TENANT_DETAIL.CONTRACTS.STEP_10.TITLE', 'TOUR.TENANT_DETAIL.CONTRACTS.STEP_10.DESC', 'top', 'start');
      this.addStepIfExists(steps, '[data-tour="tenant.contracts.pdf"]', 'TOUR.TENANT_DETAIL.CONTRACTS.STEP_11.TITLE', 'TOUR.TENANT_DETAIL.CONTRACTS.STEP_11.DESC', 'top', 'start');
      this.addStepIfExists(steps, '[data-tour="tenant.contracts.history"]', 'TOUR.TENANT_DETAIL.CONTRACTS.STEP_12.TITLE', 'TOUR.TENANT_DETAIL.CONTRACTS.STEP_12.DESC', 'top', 'start');
    }

    // Payments sub-tab
    if (this.selectorExists('[data-tour="tenant.payments.add-payment"]')) {
      this.addStepIfExists(steps, '[data-tour="tenant.payments.stats"]', 'TOUR.TENANT_DETAIL.PAYMENTS.STEP_1.TITLE', 'TOUR.TENANT_DETAIL.PAYMENTS.STEP_1.DESC', 'bottom', 'start');
      this.addStepIfExists(steps, '[data-tour="tenant.payments.add-payment"]', 'TOUR.TENANT_DETAIL.PAYMENTS.STEP_2.TITLE', 'TOUR.TENANT_DETAIL.PAYMENTS.STEP_2.DESC', 'bottom', 'end');
      this.addStepIfExists(steps, '[data-tour="tenant.payments.add-deposit"]', 'TOUR.TENANT_DETAIL.PAYMENTS.STEP_3.TITLE', 'TOUR.TENANT_DETAIL.PAYMENTS.STEP_3.DESC', 'bottom', 'end');
      this.addStepIfExists(steps, '[data-tour="tenant.payments.table"]', 'TOUR.TENANT_DETAIL.PAYMENTS.STEP_4.TITLE', 'TOUR.TENANT_DETAIL.PAYMENTS.STEP_4.DESC', 'top', 'start');
    }

    // Payment history sub-tab
    if (this.selectorExists('[data-tour="tenant.paymentHistory.summary"]')) {
      this.addStepIfExists(steps, '[data-tour="tenant.paymentHistory.summary"]', 'TOUR.TENANT_DETAIL.PAYMENT_HISTORY.STEP_1.TITLE', 'TOUR.TENANT_DETAIL.PAYMENT_HISTORY.STEP_1.DESC', 'bottom', 'start');
    }

    // Documents sub-tab
    if (this.selectorExists('[data-tour="tenant.documents.manager"]')) {
      this.addStepIfExists(steps, '[data-tour="tenant.documents.manager"]', 'TOUR.TENANT_DETAIL.DOCUMENTS.STEP_1.TITLE', 'TOUR.TENANT_DETAIL.DOCUMENTS.STEP_1.DESC', 'top', 'start');
    }

    this.createDriver(steps).drive();
  }
}
