import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { driver, Driver } from 'driver.js';

@Injectable({ providedIn: 'root' })
export class MainLayoutTourService {
  private readonly translate = inject(TranslateService);

  start(): void {
    const steps: any[] = [];

    this.addStepIfExists(
      steps,
      '[data-tour="main.header"]',
      'TOUR.MAIN_LAYOUT.STEP_1.TITLE',
      'TOUR.MAIN_LAYOUT.STEP_1.DESC',
      'bottom',
      'start'
    );

    this.addStepIfExists(
      steps,
      '[data-tour="main.tabs"]',
      'TOUR.MAIN_LAYOUT.STEP_2.TITLE',
      'TOUR.MAIN_LAYOUT.STEP_2.DESC',
      'bottom',
      'start'
    );

    this.addStepIfExists(
      steps,
      '[data-tour="main.tab.dashboard"]',
      'TOUR.MAIN_LAYOUT.STEP_3.TITLE',
      'TOUR.MAIN_LAYOUT.STEP_3.DESC',
      'bottom',
      'start'
    );

    this.addStepIfExists(
      steps,
      '[data-tour="main.tab.mon-locaguest"]',
      'TOUR.MAIN_LAYOUT.STEP_4.TITLE',
      'TOUR.MAIN_LAYOUT.STEP_4.DESC',
      'bottom',
      'start'
    );

    this.addStepIfExists(
      steps,
      '[data-tour="main.tab.contracts"]',
      'TOUR.MAIN_LAYOUT.STEP_5.TITLE',
      'TOUR.MAIN_LAYOUT.STEP_5.DESC',
      'bottom',
      'start'
    );

    this.addStepIfExists(
      steps,
      '[data-tour="main.tab.documents"]',
      'TOUR.MAIN_LAYOUT.STEP_6.TITLE',
      'TOUR.MAIN_LAYOUT.STEP_6.DESC',
      'bottom',
      'start'
    );

    this.addStepIfExists(
      steps,
      '[data-tour="main.tab.profitability"]',
      'TOUR.MAIN_LAYOUT.STEP_7.TITLE',
      'TOUR.MAIN_LAYOUT.STEP_7.DESC',
      'bottom',
      'start'
    );

    this.addStepIfExists(
      steps,
      '[data-tour="main.tab.rentability"]',
      'TOUR.MAIN_LAYOUT.STEP_8.TITLE',
      'TOUR.MAIN_LAYOUT.STEP_8.DESC',
      'bottom',
      'start'
    );

    this.addStepIfExists(
      steps,
      '[data-tour="main.tab.settings"]',
      'TOUR.MAIN_LAYOUT.STEP_9.TITLE',
      'TOUR.MAIN_LAYOUT.STEP_9.DESC',
      'bottom',
      'end'
    );

    this.addStepIfExists(
      steps,
      '[data-tour="main.theme-toggle"]',
      'TOUR.MAIN_LAYOUT.STEP_10.TITLE',
      'TOUR.MAIN_LAYOUT.STEP_10.DESC',
      'left',
      'end'
    );

    this.addStepIfExists(
      steps,
      '[data-tour="main.notifications"]',
      'TOUR.MAIN_LAYOUT.STEP_11.TITLE',
      'TOUR.MAIN_LAYOUT.STEP_11.DESC',
      'left',
      'end'
    );

    this.addStepIfExists(
      steps,
      '[data-tour="main.user-menu"]',
      'TOUR.MAIN_LAYOUT.STEP_12.TITLE',
      'TOUR.MAIN_LAYOUT.STEP_12.DESC',
      'left',
      'end'
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
