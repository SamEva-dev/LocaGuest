// core/auth/mfa.service.ts
import { inject, Injectable, signal } from '@angular/core';
import { AuthApi } from '../../api/auth.api';
import { ToastService } from '../../ui/toast.service';
import { MfaSetupResponse } from '../../mfa/mfa.models';

@Injectable({ providedIn: 'root' })
export class MfaService {
  private api = inject(AuthApi);
  private toast = inject(ToastService);

  setupState = signal<MfaSetupResponse | null>(null);

  async enable(type: 'TOTP' | 'SMS') {
    try {
      const res = await this.api.enableMfa(type).toPromise();
      this.setupState.set(res!);
    } catch {
      this.toast.error('AUTH.MFA_SETUP_FAILED');
    }
  }

  async verify(code: string) {
    try {
      await this.api.verifyMfa({ code }).toPromise();
      this.toast.success('AUTH.MFA_VERIFIED');
    } catch {
      this.toast.error('AUTH.MFA_INVALID');
    }
  }

  async disable() {
    try {
      await this.api.disableMfa().toPromise();
      this.toast.info('AUTH.MFA_DISABLED');
    } catch {
      this.toast.error('AUTH.MFA_DISABLE_FAILED');
    }
  }
}
