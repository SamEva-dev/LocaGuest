import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../core/auth/services/auth.service';

@Component({
  selector: 'app-reset-password',
  imports: [TranslatePipe],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResetPassword {
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  isLoading = signal(false);
  email = signal('');
  token = signal('');
  showPassword = signal(false);

  password = signal('');
  confirmPassword = signal('');

  constructor(private translate: TranslateService) {
    translate.setDefaultLang('fr');
    translate.use('fr');

    const email = (this.route.snapshot.queryParamMap.get('email') ?? '').trim();
    const token = (this.route.snapshot.queryParamMap.get('token') ?? '').trim();

    if (email) this.email.set(email);
    if (token) this.token.set(token);
  }

  get passwordsMismatch(): boolean {
    return !!this.password() && !!this.confirmPassword() && this.password() !== this.confirmPassword();
  }

  async submit() {
    const email = (this.email() ?? '').trim();
    const token = (this.token() ?? '').trim();
    const password = this.password();
    const confirm = this.confirmPassword();

    if (!email || !token) return;
    if (!password || password !== confirm) return;

    this.isLoading.set(true);
    try {
      await this.auth.resetPassword(email, token, password, confirm);
      this.router.navigate(['/login'], { queryParams: { email } });
    } finally {
      this.isLoading.set(false);
    }
  }

  backToLogin() {
    this.router.navigate(['/login']);
  }
}
