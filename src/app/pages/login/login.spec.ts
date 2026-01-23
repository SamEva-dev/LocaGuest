import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { Subject } from 'rxjs';

import { Login } from './login';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../core/auth/services/auth.service';
import { AuthApi } from '../../core/api/auth.api';
import { ExternalAuthApi } from '../../core/api/external-auth.api';
import { ToastService } from '../../core/ui/toast.service';

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;

  const langChange$ = new Subject<any>();
  const translationChange$ = new Subject<any>();
  const defaultLangChange$ = new Subject<any>();

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: { get: () => null } } } },
        {
          provide: TranslateService,
          useValue: {
            currentLang: 'fr',
            setDefaultLang: () => undefined,
            use: () => of('fr'),
            get: (k: any) => of(k),
            stream: (k: any) => of(k),
            instant: (k: any) => k,
            onLangChange: langChange$,
            onTranslationChange: translationChange$,
            onDefaultLangChange: defaultLangChange$,
          }
        },
        { provide: AuthService, useValue: { forgotPassword: async () => undefined, setRememberMe: () => undefined, isAuthenticated: () => false, mfaPendingUser: () => null, logout: () => undefined } },
        { provide: AuthApi, useValue: { prelogin: () => of({ nextStep: 'Register' }), login: () => of({ requiresMfa: false }), verify2FA: () => of({}), verifyRecoveryCode: () => of({}) } },
        { provide: ExternalAuthApi, useValue: { getGoogleConfig: () => of({ clientId: null }), getFacebookConfig: () => of({ appId: null }), loginWithGoogle: () => of({ success: false }), loginWithFacebook: () => of({ success: false }) } },
        { provide: ToastService, useValue: { info: () => undefined, error: () => undefined, errorDirect: () => undefined, success: () => undefined, successDirect: () => undefined } },
      ]
    })
    .overrideTemplate(Login, '')
    .compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
