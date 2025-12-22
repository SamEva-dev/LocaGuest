import { ChangeDetectionStrategy, Component, inject, signal, OnDestroy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../core/auth/services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../core/ui/toast.service';

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
 private router = inject(Router);
  private toast = inject(ToastService);

 private redirectTimeoutId: number | null = null;

 showPassword = signal(false);
  isLoading = signal(false);
  errorMessage : string='';
  succesMessage : string='';
  form = {
    organizationName: '',
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: ''
  };

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
      console.log('🔐 Register avec:', { firstName, lastName, email, passwordLength: password.length });
      
      // Valider que les mots de passe correspondent
      if (password !== confirmPassword) {
        this.toast.error('AUTH.PASSWORDS_NOT_MATCH');
        return;
      }

      if (!organizationName?.trim()) {
        this.toast.error('AUTH.ORGANIZATION_REQUIRED');
        return;
      }
      
      console.log('📝 Données envoyées:', { firstName, lastName, email });
      
      await this.auth.register({ 
        email, 
        password,
        organizationName,
        firstName, 
        lastName,
        phone
      });
      
      console.log('✅ Register réussi');
      this.toast.successDirect('Inscription réussie. Vous serez redirigé vers la page de login dans 5s.');
      this.succesMessage = 'Inscription réussie. Vous serez redirigé vers la page de login dans 5s.';
      this.redirectTimeoutId = window.setTimeout(() => {
        this.router.navigate(['/login']);
      }, 5000);
    
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
