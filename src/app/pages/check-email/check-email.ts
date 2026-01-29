import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthApi } from '../../core/api/auth.api';
import { ToastService } from '../../core/ui/toast.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-check-email',
  imports: [TranslatePipe],
  templateUrl: './check-email.html',
  styleUrl: './check-email.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckEmail {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private authApi = inject(AuthApi);
  private toast = inject(ToastService);

  email = signal('');
  type = signal<'verify' | 'reset'>('verify');
  isResending = signal(false);

  constructor(private translate: TranslateService) {
    translate.setDefaultLang('fr');
    translate.use('fr');

    const email = (this.route.snapshot.queryParamMap.get('email') ?? '').trim();
    const type = (this.route.snapshot.queryParamMap.get('type') ?? '').trim().toLowerCase();

    if (email) this.email.set(email);
    if (type === 'reset') this.type.set('reset');
  }

  backToLogin() {
    this.router.navigate(['/login'], { queryParams: { email: this.email() || undefined } });
  }

  async resendEmail() {
    if (this.isResending()) return;

    const email = (this.email() ?? '').trim().toLowerCase();
    if (!email) {
      this.toast.error('COMMON.FIELD_REQUIRED');
      return;
    }

    try {
      this.isResending.set(true);
      await firstValueFrom(this.authApi.resendEmailConfirmation(email));
      this.toast.successDirect('Email renvoyé. Vérifie ta boîte mail.');
    } catch (err: any) {
      const backendMessage = err?.error?.error || err?.error?.message;
      if (backendMessage) {
        this.toast.errorDirect(backendMessage);
      } else {
        this.toast.error('COMMON.ERROR');
      }
    } finally {
      this.isResending.set(false);
    }
  }
}
