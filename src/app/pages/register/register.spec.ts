import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { Subject } from 'rxjs';

import { Register } from './register';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../core/auth/services/auth.service';
import { AuthApi } from '../../core/api/auth.api';
import { ToastService } from '../../core/ui/toast.service';

describe('Register', () => {
  let component: Register;
  let fixture: ComponentFixture<Register>;

  const langChange$ = new Subject<any>();
  const translationChange$ = new Subject<any>();
  const defaultLangChange$ = new Subject<any>();

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Register],
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
        { provide: AuthService, useValue: { register: async () => ({ status: 'ok' }), applyLogin: () => undefined } },
        { provide: AuthApi, useValue: { acceptLocaGuestInvitation: () => of({ accessToken: 'x', refreshToken: 'y' }) } },
        { provide: ToastService, useValue: { info: () => undefined, error: () => undefined, errorDirect: () => undefined, success: () => undefined, successDirect: () => undefined } },
      ]
    })
    .overrideTemplate(Register, '')
    .compileComponents();

    fixture = TestBed.createComponent(Register);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
