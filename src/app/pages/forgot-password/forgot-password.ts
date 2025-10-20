import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../core/auth/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  imports: [TranslatePipe],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForgotPassword {
private translate = inject(TranslateService)
   private auth = inject(AuthService);
  private router = inject(Router);

 isLoading = signal(false);

  async sendResetLink(email: string) {
    this.isLoading.set(true);
    try {
      await this.auth.forgotPassword(email);
      // Option: toast succès
    } finally {
      this.isLoading.set(false);
    }
  }

  backToLogin() {
    this.router.navigate(['/login']);
  }
}
