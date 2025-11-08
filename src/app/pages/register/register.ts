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

  async register(firstName: string, lastName: string, email: string, password: string, confirmPassword: string) {
    
    this.isLoading.set(true);
    try {
      console.log('🔐 Register avec:', { firstName, lastName, email, passwordLength: password.length });
      
      // Valider que les mots de passe correspondent
      if (password !== confirmPassword) {
        throw new Error('Les mots de passe ne correspondent pas');
      }
      
      console.log('📝 Données envoyées:', { firstName, lastName, email });
      
      await this.auth.register({ 
        email, 
        password, 
        confirmPassword,
        firstName, 
        lastName
      });
      
      console.log('✅ Register réussi');
      this.toast.success('AUTH.REGISTER_SUCCESS');
      this.router.navigate(['/login']);
    
    } catch (error) {
      console.error('❌ Erreur register:', error);
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }

  goToLogin() {
  this.router.navigate(['/login']);
}

}
