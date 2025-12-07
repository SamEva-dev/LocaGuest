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
  
  // 2FA state
  show2FAInput = signal(false);
  mfaToken = signal<string>('');
  twoFactorCode = signal<string>('');
  userEmail = signal<string>('');
  
  // Recovery code state
  useRecoveryCode = signal(false);
  recoveryCode = signal<string>('');

  constructor(private translate: TranslateService) {
      translate.setDefaultLang('fr');
      translate.use('fr'); // 
  }

  ngOnInit() {
    const expired = this.route.snapshot.queryParamMap.get('expired');
    if (expired) this.toast.info('AUTH.SESSION_EXPIRED');
  }


  async login(email: string, password: string) {
    this.isLoading.set(true);
    try {
      this.auth.setRememberMe(this.rememberMe());
      this.userEmail.set(email);
      
      console.log('🔐 Login attempt:', email);
      
      // Call login API directly to handle 2FA response
      const result = await firstValueFrom(this.authApi.login({ email, password }));
      
      // Check if 2FA is required
      if (result.requiresMfa && result.mfaToken) {
        console.log('🔐 2FA required');
        this.mfaToken.set(result.mfaToken);
        this.show2FAInput.set(true);
        this.toast.info('Enter the 6-digit code from your authenticator app');
        return; // Stop here, wait for 2FA code
      }
      
      // No 2FA required, proceed with normal login
      console.log('✅ Login successful (no 2FA)');
      this.completeLogin(result);
      
    } catch (error: any) {
      console.error('❌ Login error:', error);
      if (error.status === 401) {
        this.toast.error('Invalid email or password');
      } else {
        this.toast.error('Connection error');
      }
    } finally {
      this.isLoading.set(false);
    }
  }

  async verify2FA() {
    const code = this.twoFactorCode();
    if (code.length !== 6) {
      this.toast.error('Please enter a 6-digit code');
      return;
    }

    this.isLoading.set(true);
    try {
      console.log('🔐 Verifying 2FA code...');
      const result = await firstValueFrom(
        this.authApi.verify2FA(this.mfaToken(), code)
      );
      
      console.log('✅ 2FA verification successful');
      this.completeLogin(result);
      
    } catch (error: any) {
      console.error('❌ 2FA verification error:', error);
      if (error.status === 401) {
        this.toast.error('Invalid 2FA code. Please try again.');
      } else {
        this.toast.error('Verification error');
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
      this.toast.error('Please enter a valid recovery code');
      return;
    }

    this.isLoading.set(true);
    try {
      console.log('🔐 Verifying recovery code...');
      const result = await firstValueFrom(
        this.authApi.verifyRecoveryCode(this.mfaToken(), code)
      );
      
      console.log('✅ Recovery code verification successful');
      this.completeLogin(result);
      
    } catch (error: any) {
      console.error('❌ Recovery code verification error:', error);
      if (error.status === 401) {
        this.toast.error('Invalid recovery code. Please check and try again.');
      } else {
        this.toast.error('Verification error');
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
  }

  private completeLogin(result: any) {
    // Store tokens via AuthService
    this.auth.setRememberMe(this.rememberMe());
    // Apply login will store tokens and user
    (this.auth as any).applyLogin(result);
    
    this.toast.success('Login successful!');
    this.router.navigate(['/app']);
    
    console.log('✅ Login completed');
    console.log('🎫 Token stored');
    console.log('👤 User:', this.auth.user());
  }

  loginWithGoogle() {
    console.log('Connexion avec Google');
    // TODO: Intégrer Firebase, Auth0, ou ton backend (OAuth2 Google)
  }

  loginWithFacebook() {
    console.log('Connexion avec Facebook');
    // TODO: Intégrer Firebase, Auth0, ou ton backend (OAuth2 Facebook)
  }

  goToRegister() {
  // Navigation Angular
  console.log('Naviguer vers /register'); 
  this.router.navigate(['/register']);
}
goToForgotPassword() {
  this.router.navigate(['/forgot-password']);
}

}
