import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
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
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  isLoading = signal(false);
  prefilledEmail = signal('');

  constructor(private translate: TranslateService) {
    translate.setDefaultLang('fr');
    translate.use('fr'); // 

    const qEmail = (this.route.snapshot.queryParamMap.get('email') ?? '').trim();
    if (qEmail) this.prefilledEmail.set(qEmail);
  }

  async sendResetLink(email: string) {
    this.isLoading.set(true);
    try {
      await this.auth.forgotPassword((email ?? '').trim());
      // Option: toast succès
    } finally {
      this.isLoading.set(false);
    }
  }

  backToLogin() {
    this.router.navigate(['/login']);
  }
}
