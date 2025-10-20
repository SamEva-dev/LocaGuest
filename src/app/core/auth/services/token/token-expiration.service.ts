// core/auth/token-expiration.service.ts
import { inject, Injectable, signal } from '@angular/core';
import { AuthService } from '../auth.service';
import { AuthState } from '../../auth.state';
import { ToastService } from '../../../ui/toast.service';

/**
 * ⏱️ TokenExpirationService
 * Surveille localement la date d’expiration du token d’accès.
 * - Déclenche un refresh automatique ~1 minute avant expiration.
 * - Affiche un toast pour prévenir l’utilisateur.
 * - Si le refresh échoue, déclenche une déconnexion propre.
 */
@Injectable({ providedIn: 'root' })
export class TokenExpirationService {
  private readonly auth = inject(AuthService);
  private readonly state = inject(AuthState);
  private readonly toast = inject(ToastService);

  private readonly isRunning = signal(false);
  private intervalId?: ReturnType<typeof setInterval>;

  /** Lance le monitoring automatique */
  startMonitor(intervalMs = 15000) {
    if (this.isRunning()) return;
    this.isRunning.set(true);

    this.intervalId = setInterval(async () => {
      const tokens = this.state.tokens();
      if (!tokens?.expiresAtUtc) return;

      const expiresAt = new Date(tokens.expiresAtUtc).getTime();
      const now = Date.now();
      const remainingMs = expiresAt - now;

      // 🔔 Moins d'une minute avant expiration → prévenons l'utilisateur
      if (remainingMs < 60000 && remainingMs > 0) {
        this.toast.info('AUTH.SESSION_EXPIRING');
      }

      // ⏳ Expiration passée → refresh ou logout
      if (remainingMs <= 0) {
        const refreshed = await this.auth.refreshIfNeeded();
        if (!refreshed) {
          this.toast.error('AUTH.SESSION_EXPIRED');
          this.auth.logout();
        }
      }
    }, intervalMs);
  }

  /** Stoppe la surveillance (ex : logout manuel) */
  stopMonitor() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
      this.isRunning.set(false);
    }
  }
}
