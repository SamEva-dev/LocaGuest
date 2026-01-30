import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../core/auth/services/auth.service';
import { AuthApi } from '../../core/api/auth.api';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-confirm-email',
  imports: [TranslatePipe],
  templateUrl: './confirm-email.html',
  styleUrl: './confirm-email.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmEmail {
  private auth = inject(AuthService);
  private authApi = inject(AuthApi);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  isLoading = signal(true);
  isSuccess = signal(false);
  email = signal('');
  errorMessage = signal('');

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
    this.errorMessage.set('');
    try {
      await this.auth.validateEmail(email, token);
      this.isSuccess.set(true);

      const ready = await this.waitForProvisioning(email);
      if (ready) {
        this.goToLogin();
        return;
      }

      this.errorMessage.set(
        "Votre compte est confirmé, mais la création de votre organisation prend plus de temps que prévu. Veuillez réessayer dans quelques instants."
      );
    } finally {
      this.isLoading.set(false);
    }
  }

  private async waitForProvisioning(email: string): Promise<boolean> {
    const normalized = (email ?? '').trim().toLowerCase();
    const startedAt = Date.now();

    const poll = async (ms: number) => {
      const deadline = Date.now() + ms;
      while (Date.now() < deadline) {
        try {
          const status = await firstValueFrom(this.authApi.getProvisioningStatus(normalized));
          if (status?.organizationId) {
            return true;
          }

          if (typeof status?.status === 'string' && status.status.toLowerCase().includes('failed')) {
            return false;
          }
        } catch {
          // ignore transient errors
        }

        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      return false;
    };

    if (await poll(10000)) return true;
    if (await poll(20000)) return true;

    const elapsed = Math.round((Date.now() - startedAt) / 1000);
    if (!this.errorMessage()) {
      this.errorMessage.set(
        `Création de votre organisation toujours en cours après ${elapsed}s. Veuillez réessayer.`
      );
    }
    return false;
  }

  retry() {
    const email = (this.route.snapshot.queryParamMap.get('email') ?? '').trim();
    if (!email) return;
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.waitForProvisioning(email)
      .then(ready => {
        if (ready) this.goToLogin();
      })
      .finally(() => this.isLoading.set(false));
  }

  goToLogin() {
    this.router.navigate(['/login'], {
      queryParams: this.email() ? { email: this.email() } : undefined
    });
  }
}
