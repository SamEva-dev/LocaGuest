import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../core/auth/services/auth.service';

@Component({
  selector: 'app-register',
  imports: [TranslatePipe],
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

 showPassword = signal(false);
  isLoading = signal(false);

  async register(fullName: string, email: string, password: string) {
    this.isLoading.set(true);
    try {
      console.log('🔐 Register avec:', { fullName, email, passwordLength: password.length });
      
      // Extraire prénom et nom du fullName
      const names = fullName.trim().split(' ');
      const firstName = names[0] || '';
      const lastName = names.slice(1).join(' ') || names[0]; // Si pas de nom, utiliser le prénom
      
      console.log('📝 Données extraites:', { firstName, lastName });
      
      await this.auth.register(fullName, email, password);
      
      console.log('✅ Register réussi');
      
      // Après register, login automatique
      await this.auth.login(email, password);
      
      console.log('✅ Login automatique réussi');
      console.log('🎫 Token stocké:', this.auth.getAccessToken()?.substring(0, 50) + '...');
      console.log('👤 User:', this.auth.user());
      
      this.router.navigate(['/app']);
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
