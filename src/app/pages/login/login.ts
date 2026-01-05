import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../core/ui/toast.service';
import { AuthService } from '../../core/auth/services/auth.service';
import { AuthApi } from '../../core/api/auth.api';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-login',
  imports: [TranslatePipe, CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login {
   
  private auth = inject(AuthService);
  private authApi = inject(AuthApi);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);
  
  // Login state
  showPassword = signal(false);
  isLoading = signal(false);
  rememberMe = signal(false);
  loginStep = signal<'email' | 'password'>('email');
  loginEmail = signal<string>('');
  
  // 2FA state
  show2FAInput = signal(false);
  mfaToken = signal<string>('');
  twoFactorCode = signal<string>('');
  userEmail = signal<string>('');
  
  // Recovery code state
  useRecoveryCode = signal(false);
  recoveryCode = signal<string>('');
  
  // Remember device state
  rememberDevice2FA = signal(false);

  errorMessage : string='';

  constructor(private translate: TranslateService) {
      translate.setDefaultLang('fr');
      translate.use('fr'); // 
  }

  ngOnInit() {
    const expired = this.route.snapshot.queryParamMap.get('expired');
    if (expired) this.toast.info('AUTH.SESSION_EXPIRED');
  }

  async continueWithEmail(email: string) {
    this.isLoading.set(true);
    this.errorMessage = '';
    try {
      const normalized = (email ?? '').trim().toLowerCase();
      if (!normalized) {
        this.toast.error('COMMON.FIELD_REQUIRED');
        return;
      }

      const res = await firstValueFrom(this.authApi.prelogin({ email: normalized }));

      if (res.nextStep === 'Password') {
        this.loginEmail.set(normalized);
        this.userEmail.set(normalized);
        this.loginStep.set('password');
        return;
      }

      if (res.nextStep === 'Register') {
        this.router.navigate(['/register']);
        return;
      }

      const message = res.error || 'COMMON.ERROR';
      this.errorMessage = res.error || '';
      this.toast.errorDirect(message);
    } catch (error: any) {
      const backendMessage = this.getBackendErrorMessage(error);
      if (backendMessage) {
        this.errorMessage = backendMessage;
        this.toast.errorDirect(backendMessage);
      } else {
        this.toast.error('COMMON.NETWORK_ERROR');
      }
    } finally {
      this.isLoading.set(false);
    }
  }

  private getBackendErrorMessage(err: any): string | null {
    const body = err?.error;
    if (!body) return null;
    if (typeof body === 'string') return body;
    if (typeof body.error === 'string' && body.error.trim().length > 0) return body.error;
    if (typeof body.message === 'string' && body.message.trim().length > 0) return body.message;
    if (typeof body.title === 'string' && body.title.trim().length > 0) return body.title;
    return null;
  }

  private generateDeviceFingerprint(): string {
    // Simple fingerprint based on User-Agent (can be improved with fingerprintjs library)
    const userAgent = navigator.userAgent;
    return btoa(userAgent); // Base64 encode
  }


  async login(email: string, password: string) {
    this.isLoading.set(true);
    this.errorMessage = '';
    try {
      this.auth.setRememberMe(this.rememberMe());
      this.userEmail.set(email);
      
      const deviceFingerprint = this.generateDeviceFingerprint();
      
      // Call login API directly to handle 2FA response
      const result = await firstValueFrom(this.authApi.login({ 
        email, 
        password,
        deviceFingerprint 
      }));
      
      // Check if 2FA is required
      if (result.requiresMfa && result.mfaToken) {
        this.mfaToken.set(result.mfaToken);
        this.show2FAInput.set(true);
        this.toast.info('AUTH.MFA.ENTER_CODE');
        return; // Stop here, wait for 2FA code
      }
      
      // No 2FA required, proceed with normal login
      this.completeLogin(result);
      
    } catch (error: any) {
      console.error('❌ Login error:', error);
      const backendMessage = this.getBackendErrorMessage(error);
      if (backendMessage) {
        this.errorMessage = backendMessage;
        this.toast.errorDirect(backendMessage);
      } else if (error.status === 401) {
        this.toast.error('AUTH.INVALID_CREDENTIALS');
      } else {
        this.toast.error('COMMON.NETWORK_ERROR');
      }
    } finally {
      this.isLoading.set(false);
    }
  }

  async verify2FA() {
    const code = this.twoFactorCode();
    if (code.length !== 6) {
      this.toast.error('AUTH.MFA.INVALID_CODE_LENGTH');
      return;
    }

    this.isLoading.set(true);
    try {
      const result = await firstValueFrom(
        this.authApi.verify2FA(
          this.mfaToken(), 
          code,
          this.rememberDevice2FA(),
          this.generateDeviceFingerprint(),
          navigator.userAgent
        )
      );
      
      this.completeLogin(result);
      
    } catch (error: any) {
      console.error('❌ 2FA verification error:', error);
      const backendMessage = this.getBackendErrorMessage(error);
      if (backendMessage) {
        this.toast.errorDirect(backendMessage);
      } else if (error.status === 401) {
        this.toast.error('AUTH.MFA.INVALID_CODE');
      } else {
        this.toast.error('COMMON.ERROR');
      }
      // Clear code on error
      this.twoFactorCode.set('');
    } finally {
      this.isLoading.set(false);
    }
  }

  async verifyRecoveryCode() {
    const code = this.recoveryCode().trim();
    if (code.length < 8) {
      this.toast.error('AUTH.MFA.INVALID_RECOVERY_CODE');
      return;
    }

    this.isLoading.set(true);
    try {
      const result = await firstValueFrom(
        this.authApi.verifyRecoveryCode(
          this.mfaToken(), 
          code,
          this.rememberDevice2FA(),
          this.generateDeviceFingerprint(),
          navigator.userAgent
        )
      );
      
      this.completeLogin(result);
      
    } catch (error: any) {
      console.error('❌ Recovery code verification error:', error);
      const backendMessage = this.getBackendErrorMessage(error);
      if (backendMessage) {
        this.toast.errorDirect(backendMessage);
      } else if (error.status === 401) {
        this.toast.error('AUTH.MFA.INVALID_RECOVERY_CODE');
      } else {
        this.toast.error('COMMON.ERROR');
      }
      // Clear code on error
      this.recoveryCode.set('');
    } finally {
      this.isLoading.set(false);
    }
  }

  toggleRecoveryCode() {
    this.useRecoveryCode.set(!this.useRecoveryCode());
    // Clear both codes when switching
    this.twoFactorCode.set('');
    this.recoveryCode.set('');
  }

  backToLogin() {
    this.show2FAInput.set(false);
    this.mfaToken.set('');
    this.twoFactorCode.set('');
    this.recoveryCode.set('');
    this.useRecoveryCode.set(false);
    this.rememberDevice2FA.set(false);
  }

  private completeLogin(result: any) {
    // Store tokens via AuthService
    this.auth.setRememberMe(this.rememberMe());
    // Apply login will store tokens and user
    (this.auth as any).applyLogin(result);
    
    this.toast.success('AUTH.LOGIN_SUCCESS');
    this.router.navigate(['/app']);
  }

  loginWithGoogle() {
    // TODO: Intégrer Firebase, Auth0, ou ton backend (OAuth2 Google)
  }

  loginWithFacebook() {
    // TODO: Intégrer Firebase, Auth0, ou ton backend (OAuth2 Facebook)
  }

  goToRegister() {
  // Navigation Angular
  this.router.navigate(['/register']);
}
goToForgotPassword() {
  this.router.navigate(['/forgot-password']);
}

}
