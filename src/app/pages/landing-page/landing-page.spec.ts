import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { LandingPage } from './landing-page';
import { TranslateService } from '@ngx-translate/core';
import { SubscriptionService } from '../../core/services/subscription.service';
import { PublicStatsApi } from '../../core/api/public-stats.api';

describe('LandingPage', () => {
  let component: LandingPage;
  let fixture: ComponentFixture<LandingPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LandingPage],
      providers: [
        { provide: PLATFORM_ID, useValue: 'browser' },
        provideRouter([]),
        { provide: TranslateService, useValue: { setDefaultLang: () => undefined, use: () => of('fr'), get: (k: any) => of(k), stream: (k: any) => of(k), currentLang: 'fr' } },
        { provide: SubscriptionService, useValue: { loadPlans: () => of([]) } },
        { provide: PublicStatsApi, useValue: { getStats: () => of({ propertiesCount: 0, usersCount: 0, satisfactionRate: 0, organizationsCount: 0, averageRating: 0 }) } },
      ]
    })
    .overrideTemplate(LandingPage, '')
    .compileComponents();

    fixture = TestBed.createComponent(LandingPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
