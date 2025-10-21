import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth/services/auth.service';
import { ToastService } from '../../core/ui/toast.service';

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
      await this.auth.login(email, password);
      this.router.navigate(['/dashboard']);
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
  this.router.navigate(['/register']);
}
goToForgotPassword() {
  this.router.navigate(['/forgot-password']);
}

}
