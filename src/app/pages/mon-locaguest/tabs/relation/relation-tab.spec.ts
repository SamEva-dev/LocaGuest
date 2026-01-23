import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { RelationTab } from './relation-tab';
import { TranslateService } from '@ngx-translate/core';
import { PropertiesService } from '../../../../core/services/properties.service';
import { TenantsService } from '../../../../core/services/tenants.service';
import { AuthService } from '../../../../core/auth/services/auth.service';

describe('RelationTab', () => {
  let component: RelationTab;
  let fixture: ComponentFixture<RelationTab>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RelationTab],
      providers: [
        provideRouter([]),
        { provide: TranslateService, useValue: { setDefaultLang: () => undefined, use: () => of('fr'), get: (k: any) => of(k), stream: (k: any) => of(k) } },
        { provide: PropertiesService, useValue: { getProperty: () => of(null), getPropertyPayments: () => of([]), getPropertyContracts: () => of([]), getFinancialSummary: () => of(null) } },
        { provide: TenantsService, useValue: { getTenant: () => of(null), getPaymentStats: () => of(null) } },
        { provide: AuthService, useValue: { hasPermission: () => true } },
      ]
    })
      .overrideTemplate(RelationTab, '')
      .compileComponents();

    fixture = TestBed.createComponent(RelationTab);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
