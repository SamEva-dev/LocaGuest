import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { driver, Driver } from 'driver.js';

@Injectable({ providedIn: 'root' })
export class ProfitabilityTourService {
  private readonly translate = inject(TranslateService);

  start(): void {
    const steps: any[] = [];

    this.addStepIfExists(
      steps,
      '[data-tour="profitability.header"]',
      'TOUR.PROFITABILITY.ROOT.STEP_1.TITLE',
      'TOUR.PROFITABILITY.ROOT.STEP_1.DESC',
      'bottom',
      'start'
    );

    this.addStepIfExists(
      steps,
      '[data-tour="profitability.filters"]',
      'TOUR.PROFITABILITY.ROOT.STEP_2.TITLE',
      'TOUR.PROFITABILITY.ROOT.STEP_2.DESC',
      'left',
      'end'
    );

    this.addStepIfExists(
      steps,
      '[data-tour="profitability.filters.period"]',
      'TOUR.PROFITABILITY.FILTERS.STEP_1.TITLE',
      'TOUR.PROFITABILITY.FILTERS.STEP_1.DESC',
      'bottom',
      'end'
    );

    this.addStepIfExists(
      steps,
      '[data-tour="profitability.filters.year"]',
      'TOUR.PROFITABILITY.FILTERS.STEP_2.TITLE',
      'TOUR.PROFITABILITY.FILTERS.STEP_2.DESC',
      'bottom',
      'end'
    );

    this.addStepIfExists(
      steps,
      '[data-tour="profitability.stats"]',
      'TOUR.PROFITABILITY.STATS.STEP_1.TITLE',
      'TOUR.PROFITABILITY.STATS.STEP_1.DESC',
      'top',
      'start'
    );

    this.addStepIfExists(
      steps,
      '[data-tour="profitability.stats.revenue"]',
      'TOUR.PROFITABILITY.STATS.STEP_2.TITLE',
      'TOUR.PROFITABILITY.STATS.STEP_2.DESC',
      'top',
      'start'
    );

    this.addStepIfExists(
      steps,
      '[data-tour="profitability.stats.expenses"]',
      'TOUR.PROFITABILITY.STATS.STEP_3.TITLE',
      'TOUR.PROFITABILITY.STATS.STEP_3.DESC',
      'top',
      'start'
    );

    this.addStepIfExists(
      steps,
      '[data-tour="profitability.stats.net-profit"]',
      'TOUR.PROFITABILITY.STATS.STEP_4.TITLE',
      'TOUR.PROFITABILITY.STATS.STEP_4.DESC',
      'top',
      'start'
    );

    this.addStepIfExists(
      steps,
      '[data-tour="profitability.stats.rate"]',
      'TOUR.PROFITABILITY.STATS.STEP_5.TITLE',
      'TOUR.PROFITABILITY.STATS.STEP_5.DESC',
      'top',
      'start'
    );

    this.addStepIfExists(
      steps,
      '[data-tour="profitability.chart"]',
      'TOUR.PROFITABILITY.CHART.STEP_1.TITLE',
      'TOUR.PROFITABILITY.CHART.STEP_1.DESC',
      'top',
      'start'
    );

    this.addStepIfExists(
      steps,
      '[data-tour="profitability.performance"]',
      'TOUR.PROFITABILITY.PERFORMANCE.STEP_1.TITLE',
      'TOUR.PROFITABILITY.PERFORMANCE.STEP_1.DESC',
      'top',
      'start'
    );

    this.createDriver(steps).drive();
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
}
