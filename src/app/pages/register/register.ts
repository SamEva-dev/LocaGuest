import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
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
export class Register {
 constructor(private translate: TranslateService) {
      translate.setDefaultLang('fr');
      translate.use('fr'); // 
  }
 private auth = inject(AuthService);
 private router = inject(Router);
  private toast = inject(ToastService);

 showPassword = signal(false);
  isLoading = signal(false);

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
      this.toast.success('AUTH.REGISTER_SUCCESS');
      this.router.navigate(['/login']);
    
    } catch (error: any) {
      console.error('❌ Erreur register:', error);
      // AuthService shows a toast already; keep a safe fallback here
      if (!error?.status) {
        this.toast.error('AUTH.REGISTER_FAILED');
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

}
