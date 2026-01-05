// core/auth/mfa.service.ts
import { inject, Injectable, signal } from '@angular/core';
import { TwoFactorApi, EnableTwoFactorResponse } from '../../api/two-factor.api';
import { ToastService } from '../../ui/toast.service';

@Injectable({ providedIn: 'root' })
export class MfaService {
  private api = inject(TwoFactorApi);
  private toast = inject(ToastService);

  setupState = signal<EnableTwoFactorResponse | null>(null);

  async enable() {
    try {
      const res = await this.api.enable().toPromise();
      this.setupState.set(res!);
    } catch {
      this.toast.error('AUTH.MFA_SETUP_FAILED');
    }
  }

  async verify(code: string) {
    try {
      await this.api.verifyAndEnable({ code }).toPromise();
      this.toast.success('AUTH.MFA_VERIFIED');
    } catch {
      this.toast.error('AUTH.MFA_INVALID');
    }
  }

  async disable(password: string) {
    try {
      await this.api.disable({ password }).toPromise();
      this.toast.info('AUTH.MFA_DISABLED');
    } catch {
      this.toast.error('AUTH.MFA_DISABLE_FAILED');
    }
  }
}
