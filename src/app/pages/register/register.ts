import { ChangeDetectionStrategy, Component, inject, signal, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../core/auth/services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../core/ui/toast.service';
import { AuthApi } from '../../core/api/auth.api';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-register',
  imports: [TranslatePipe, CommonModule, FormsModule],
  templateUrl: './register.html',
  styleUrl: './register.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Register implements OnDestroy {
 constructor(private translate: TranslateService) {
      translate.setDefaultLang('fr');
      translate.use('fr'); // 
  }
 private auth = inject(AuthService);
 private authApi = inject(AuthApi);
 private router = inject(Router);
 private route = inject(ActivatedRoute);
  private toast = inject(ToastService);

 private redirectTimeoutId: number | null = null;

 showPassword = signal(false);
  isLoading = signal(false);
  emailLocked = signal(false);
  errorMessage : string='';
  succesMessage : string='';
 joinMode = signal(false);
 invitationToken = signal<string>('');
  form = {
    organizationName: '',
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: ''
  };

  ngOnInit() {
    const mode = this.route.snapshot.queryParamMap.get('mode');
    const token = this.route.snapshot.queryParamMap.get('token');

    const prefillEmail = (this.route.snapshot.queryParamMap.get('email') ?? '').trim().toLowerCase();
    if (prefillEmail) {
      this.form.email = prefillEmail;
      this.emailLocked.set(true);
    }

    if (mode === 'join' && token) {
      this.joinMode.set(true);
      this.invitationToken.set(token);
    }
  }

  changeEmail() {
    this.emailLocked.set(false);
  }

  get passwordsMismatch(): boolean {
    return !!this.form.password && !!this.form.confirmPassword && this.form.password !== this.form.confirmPassword;
  }

  async register(
    organizationName: string,
    firstName: string,
    lastName: string,
    phone: string,
    email: string,
    password: string,
    confirmPassword: string
  ) {
    
    this.isLoading.set(true);
    try {
      this.errorMessage = '';
      this.succesMessage = '';
      
      // Valider que les mots de passe correspondent
      if (password !== confirmPassword) {
        this.toast.error('AUTH.PASSWORDS_NOT_MATCH');
        return;
      }

      if (!organizationName?.trim()) {
        this.toast.error('AUTH.ORGANIZATION_REQUIRED');
        return;
      }
      
      const result = await this.auth.register({ 
        email, 
        password,
        organizationName,
        firstName, 
        lastName,
        phone
      });
      
      // Check if this is a reactivated account (welcome back)
      if (result && result.status === 'reactivated') {
        this.toast.successDirect(result.message || 'Heureux de vous revoir! Votre compte a été réactivé.');
        this.succesMessage = result.message || 'Heureux de vous revoir! Votre compte a été réactivé.';
        // For reactivated accounts, redirect to app directly since they're already logged in
        this.redirectTimeoutId = window.setTimeout(() => {
          this.router.navigate(['/app']);
        }, 2000);
      } else if (result?.accessToken && result?.refreshToken) {
        this.toast.successDirect(result.message || 'Inscription réussie. Connexion en cours...');
        this.succesMessage = result.message || 'Inscription réussie. Connexion en cours...';
        this.redirectTimeoutId = window.setTimeout(() => {
          this.router.navigate(['/app']);
        }, 1200);
      } else {
        this.toast.success('AUTH.REGISTER_SUCCESS');

        const normalized = (email ?? '').trim().toLowerCase();
        this.router.navigate(['/check-email'], { queryParams: { type: 'verify', email: normalized } });
      }
    
    } catch (error: any) {
      console.error('❌ Erreur register:', error);
      const body = error?.error;
      console.error('❌ Erreur register.body:', body);
      const backendMessage =
        (typeof body === 'string' && body.trim().length > 0 ? body : null) ||
        (typeof body?.error === 'string' && body.error.trim().length > 0 ? body.error : null) ||
        (typeof body?.message === 'string' && body.message.trim().length > 0 ? body.message : null) ||
        (typeof body?.title === 'string' && body.title.trim().length > 0 ? body.title : null) ||
        (typeof error?.message === 'string' && error.message.trim().length > 0 ? error.message : null);

        console.error('❌ backendMessage:', backendMessage);
      if (backendMessage) {
        this.toast.errorDirect(backendMessage);
        this.errorMessage =backendMessage; 
      } else {
        this.toast.error('AUTH.REGISTER_FAILED');
        this.errorMessage = "Something went wrong"; 
      }
    } finally {
      this.isLoading.set(false);
    }
  }

  async submit() {
    if (this.passwordsMismatch) {
      this.toast.error('AUTH.PASSWORDS_NOT_MATCH');
      return;
    }

    if (this.joinMode()) {
      return this.acceptInvitation();
    }

    return this.register(
      this.form.organizationName,
      this.form.firstName,
      this.form.lastName,
      this.form.phone,
      this.form.email,
      this.form.password,
      this.form.confirmPassword
    );
  }

  private async acceptInvitation() {
    this.isLoading.set(true);
    try {
      this.errorMessage = '';
      this.succesMessage = '';

      const token = this.invitationToken();
      const email = (this.form.email ?? '').trim();
      const password = this.form.password;

      if (!token) {
        this.toast.errorDirect('Invitation token missing');
        return;
      }
      if (!email) {
        this.toast.error('COMMON.FIELD_REQUIRED');
        return;
      }

      const res = await firstValueFrom(this.authApi.acceptLocaGuestInvitation({
        token,
        email,
        password,
        firstName: this.form.firstName,
        lastName: this.form.lastName,
      }));

      this.auth.applyLogin({
        accessToken: res.accessToken,
        refreshToken: res.refreshToken,
        expiresIn: 900,
        requiresMfa: false,
      });

      this.toast.successDirect('Invitation acceptée. Connexion en cours...');
      this.router.navigate(['/app']);
    } catch (error: any) {
      const body = error?.error;
      const backendMessage =
        (typeof body === 'string' && body.trim().length > 0 ? body : null) ||
        (typeof body?.error === 'string' && body.error.trim().length > 0 ? body.error : null) ||
        (typeof body?.message === 'string' && body.message.trim().length > 0 ? body.message : null) ||
        (typeof body?.title === 'string' && body.title.trim().length > 0 ? body.title : null) ||
        (typeof error?.message === 'string' && error.message.trim().length > 0 ? error.message : null);

      if (backendMessage) {
        this.toast.errorDirect(backendMessage);
        this.errorMessage = backendMessage;
      } else {
        this.toast.error('AUTH.REGISTER_FAILED');
        this.errorMessage = 'Something went wrong';
      }
    } finally {
      this.isLoading.set(false);
    }
  }

  goToLogin() {
  this.router.navigate(['/login']);
}

 ngOnDestroy(): void {
  if (this.redirectTimeoutId !== null) {
    window.clearTimeout(this.redirectTimeoutId);
    this.redirectTimeoutId = null;
  }
 }

}
