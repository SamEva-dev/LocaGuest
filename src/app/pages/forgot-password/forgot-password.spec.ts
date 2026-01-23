import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { ForgotPassword } from './forgot-password';
import { AuthService } from '../../core/auth/services/auth.service';
import { TranslateService } from '@ngx-translate/core';

describe('ForgotPassword', () => {
  let component: ForgotPassword;
  let fixture: ComponentFixture<ForgotPassword>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ForgotPassword],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { queryParamMap: { get: () => null } }
          }
        },
        { provide: AuthService, useValue: { forgotPassword: async () => undefined } },
        { provide: TranslateService, useValue: { setDefaultLang: () => undefined, use: () => of('fr'), get: (k: any) => of(k), stream: (k: any) => of(k) } },
      ]
    })
    .overrideTemplate(ForgotPassword, '')
    .compileComponents();

    fixture = TestBed.createComponent(ForgotPassword);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
