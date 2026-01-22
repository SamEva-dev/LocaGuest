import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../core/auth/services/auth.service';

@Component({
  selector: 'app-confirm-email',
  imports: [TranslatePipe],
  templateUrl: './confirm-email.html',
  styleUrl: './confirm-email.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmEmail {
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  isLoading = signal(true);
  isSuccess = signal(false);
  email = signal('');

  constructor(private translate: TranslateService) {
    translate.setDefaultLang('fr');
    translate.use('fr');

    const email = (this.route.snapshot.queryParamMap.get('email') ?? '').trim();
    if (email) this.email.set(email);

    const token = (this.route.snapshot.queryParamMap.get('token') ?? '').trim();
    if (!token || !email) {
      this.isLoading.set(false);
      this.isSuccess.set(false);
      return;
    }

    this.confirm(email, token);
  }

  private async confirm(email: string, token: string) {
    this.isLoading.set(true);
    try {
      await this.auth.validateEmail(email, token);
      this.isSuccess.set(true);
    } finally {
      this.isLoading.set(false);
    }
  }

  goToLogin() {
    this.router.navigate(['/login'], {
      queryParams: this.email() ? { email: this.email() } : undefined
    });
  }
}
