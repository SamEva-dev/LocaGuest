import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../core/ui/toast.service';
import { AuthService } from '../../core/auth/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [TranslatePipe, CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login {
   
   private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);
  showPassword = signal(false);
  isLoading = signal(false);
  rememberMe= signal(false);

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
      console.log('🔐 Login avec:', email);
      console.log('📝 Remember me:', this.rememberMe());
      
      await this.auth.login(email, password);
      this.router.navigate(['/app']);
      
      console.log('✅ Login réussi');
      console.log('🎫 Token stocké:', this.auth.getAccessToken()?.substring(0, 50) + '...');
      console.log('🔄 Refresh token:', sessionStorage.getItem('lg.refresh') ? 'Présent' : 'Absent');
       console.log('👤 User:', this.auth.user());
    } catch (error) {
      console.error('❌ Erreur login:', error);
      this.toast.error('Erreur de connexion');
    } finally {
      this.isLoading.set(false);
    }
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
