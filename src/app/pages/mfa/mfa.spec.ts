import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MfaComponent } from './mfa';
import { AuthService } from '../../core/auth/services/auth.service';

describe('Mfa', () => {
  let component: MfaComponent;
  let fixture: ComponentFixture<MfaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MfaComponent],
      providers: [
        {
          provide: AuthService,
          useValue: {
            mfaPendingUser: () => ({ id: 'u1' }),
            verifyMfa: async () => undefined,
            logout: () => undefined,
          }
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MfaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
