import { ChangeDetectionStrategy, Component, inject, signal, OnInit, OnDestroy, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../core/ui/toast.service';
import { AuthService } from '../../core/auth/services/auth.service';
import { AuthApi } from '../../core/api/auth.api';
import { ExternalAuthApi } from '../../core/api/external-auth.api';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-login',
  imports: [TranslatePipe, CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login implements OnInit, OnDestroy {
   
  private auth = inject(AuthService);
  private authApi = inject(AuthApi);
  private externalAuthApi = inject(ExternalAuthApi);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);
  
  // OAuth state
  isGoogleLoading = signal(false);
  isFacebookLoading = signal(false);
  private googleClientId: string | null = null;
  private facebookAppId: string | null = null;
  private googleScriptLoaded = false;
  private facebookScriptLoaded = false;
  
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

  backToPrelogin() {
    this.loginStep.set('email');
    this.loginEmail.set('');
    this.userEmail.set('');
    this.errorMessage = '';
  }

  private completeLogin(result: any) {
    // Store tokens via AuthService
    this.auth.setRememberMe(this.rememberMe());
    // Apply login will store tokens and user
    (this.auth as any).applyLogin(result);
    
    this.toast.success('AUTH.LOGIN_SUCCESS');
    this.router.navigate(['/app']);
  }

  /**
   * Initialize Google Sign-In and handle login
   */
  async loginWithGoogle() {
    if (this.isGoogleLoading()) return;
    
    this.isGoogleLoading.set(true);
    try {
      // Load Google config if not already loaded
      if (!this.googleClientId) {
        const config = await firstValueFrom(this.externalAuthApi.getGoogleConfig());
        this.googleClientId = config.clientId || null;
      }

      if (!this.googleClientId) {
        this.toast.errorDirect('Google login is not configured');
        return;
      }

      // Load Google SDK if not loaded
      await this.loadGoogleSdk();

      // Trigger Google Sign-In popup
      const google = (window as any).google;
      if (!google?.accounts?.id) {
        this.toast.errorDirect('Google SDK not loaded');
        return;
      }

      google.accounts.id.initialize({
        client_id: this.googleClientId,
        callback: (response: any) => this.handleGoogleCallback(response),
        auto_select: false,
        cancel_on_tap_outside: true
      });

      // Show One Tap or prompt
      google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // Fallback to standard OAuth popup
          this.openGoogleOAuthPopup();
        }
      });
    } catch (error: any) {
      console.error('❌ Google login error:', error);
      this.toast.errorDirect(error?.error?.error || 'Google login failed');
    } finally {
      this.isGoogleLoading.set(false);
    }
  }

  private async handleGoogleCallback(response: any) {
    if (!response.credential) {
      this.toast.errorDirect('Google authentication failed');
      return;
    }

    this.isGoogleLoading.set(true);
    try {
      const result = await firstValueFrom(
        this.externalAuthApi.loginWithGoogle(response.credential)
      );

      if (result.success) {
        if (result.requiresRegistration) {
          // Redirect to registration with pre-filled data
          this.router.navigate(['/register'], {
            queryParams: {
              email: result.user?.email,
              firstName: result.user?.firstName,
              lastName: result.user?.lastName,
              provider: 'google'
            }
          });
        } else {
          this.completeLogin(result);
        }
      } else {
        this.toast.errorDirect(result.error || 'Google login failed');
      }
    } catch (error: any) {
      console.error('❌ Google callback error:', error);
      this.toast.errorDirect(error?.error?.error || 'Google login failed');
    } finally {
      this.isGoogleLoading.set(false);
    }
  }

  private openGoogleOAuthPopup() {
    if (!this.googleClientId) return;
    
    const redirectUri = `${window.location.origin}/auth/google/callback`;
    const scope = 'openid email profile';
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${this.googleClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token id_token&scope=${encodeURIComponent(scope)}&nonce=${Date.now()}`;
    
    window.open(url, 'google-login', 'width=500,height=600');
  }

  private loadGoogleSdk(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.googleScriptLoaded || (window as any).google?.accounts?.id) {
        this.googleScriptLoaded = true;
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        this.googleScriptLoaded = true;
        resolve();
      };
      script.onerror = () => reject(new Error('Failed to load Google SDK'));
      document.head.appendChild(script);
    });
  }

  /**
   * Initialize Facebook Login and handle login
   */
  async loginWithFacebook() {
    if (this.isFacebookLoading()) return;
    
    this.isFacebookLoading.set(true);
    try {
      // Load Facebook config if not already loaded
      if (!this.facebookAppId) {
        const config = await firstValueFrom(this.externalAuthApi.getFacebookConfig());
        this.facebookAppId = config.appId || null;
      }

      if (!this.facebookAppId) {
        this.toast.errorDirect('Facebook login is not configured');
        return;
      }

      // Load Facebook SDK if not loaded
      await this.loadFacebookSdk();

      const FB = (window as any).FB;
      if (!FB) {
        this.toast.errorDirect('Facebook SDK not loaded');
        return;
      }

      // Trigger Facebook Login
      FB.login((response: any) => {
        if (response.authResponse) {
          this.handleFacebookCallback(response.authResponse.accessToken);
        } else {
          this.isFacebookLoading.set(false);
          this.toast.errorDirect('Facebook login cancelled');
        }
      }, { scope: 'email,public_profile' });
    } catch (error: any) {
      console.error('❌ Facebook login error:', error);
      this.toast.errorDirect(error?.error?.error || 'Facebook login failed');
      this.isFacebookLoading.set(false);
    }
  }

  private async handleFacebookCallback(accessToken: string) {
    try {
      const result = await firstValueFrom(
        this.externalAuthApi.loginWithFacebook(accessToken)
      );

      if (result.success) {
        if (result.requiresRegistration) {
          // Redirect to registration with pre-filled data
          this.router.navigate(['/register'], {
            queryParams: {
              email: result.user?.email,
              firstName: result.user?.firstName,
              lastName: result.user?.lastName,
              provider: 'facebook'
            }
          });
        } else {
          this.completeLogin(result);
        }
      } else {
        this.toast.errorDirect(result.error || 'Facebook login failed');
      }
    } catch (error: any) {
      console.error('❌ Facebook callback error:', error);
      this.toast.errorDirect(error?.error?.error || 'Facebook login failed');
    } finally {
      this.isFacebookLoading.set(false);
    }
  }

  private loadFacebookSdk(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.facebookScriptLoaded || (window as any).FB) {
        this.facebookScriptLoaded = true;
        
        // Re-initialize with our app ID
        if ((window as any).FB && this.facebookAppId) {
          (window as any).FB.init({
            appId: this.facebookAppId,
            cookie: true,
            xfbml: false,
            version: 'v18.0'
          });
        }
        resolve();
        return;
      }

      // Define callback before loading script
      (window as any).fbAsyncInit = () => {
        (window as any).FB.init({
          appId: this.facebookAppId,
          cookie: true,
          xfbml: false,
          version: 'v18.0'
        });
        this.facebookScriptLoaded = true;
        resolve();
      };

      const script = document.createElement('script');
      script.src = 'https://connect.facebook.net/en_US/sdk.js';
      script.async = true;
      script.defer = true;
      script.onerror = () => reject(new Error('Failed to load Facebook SDK'));
      document.head.appendChild(script);
    });
  }

  ngOnDestroy() {
    // Cleanup if needed
  }

  goToRegister() {
  // Navigation Angular
  this.router.navigate(['/register']);
}
goToForgotPassword() {
  const email = (this.loginEmail?.() ?? this.userEmail?.() ?? '').trim();
  this.router.navigate(['/forgot-password'], {
    queryParams: email ? { email } : undefined
  });
}

}
