import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../services/auth';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  imports: [TranslatePipe, CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login {
   private translate = inject(TranslateService)
   private auth = inject(AuthService);
  private router = inject(Router);

  showPassword = signal(false);
  isLoading = signal(false);
  rememberMe= signal(false);


  async login(email: string, password: string) {
    console.log(email, password);
    this.isLoading.set(true);
   // await this.auth.login(email, password);
    this.router.navigate(['/dashboard']);
    this.isLoading.set(false);
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
