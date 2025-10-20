// core/auth/session-monitor.service.ts
import { inject, Injectable, signal } from '@angular/core';
import { AuthService } from './auth.service';
import { TokenExpirationService } from './token/token-expiration.service';
import { DeviceStore } from '../store/device.store';
import { ToastService } from '../../ui/toast.service';
import { HubConnectionBuilder } from '@microsoft/signalr';
import { environment } from '../../../../environnements/environment';

@Injectable({ providedIn: 'root' })
export class SessionMonitorService {
  private readonly devices = inject(DeviceStore);
  private readonly auth = inject(AuthService);
  private readonly tokenWatcher = inject(TokenExpirationService);
  private readonly toast = inject(ToastService);

  private readonly intervalMs = 60000; // 1 min
  private intervalId?: ReturnType<typeof setInterval>;
  private isRunning = signal(false);

  private connection = new HubConnectionBuilder()
    .withUrl(`${environment.BASE_AUTH_API}/hubs/sessions`)
    .withAutomaticReconnect()
    .build();

    async startRealtime() {
    await this.connection.start();
    this.connection.on('SessionRevoked', (deviceId: string) => {
        this.toast.warn('AUTH.SESSION_REVOKED');
        this.auth.logout();
        this.stop();
    });
    }

  /** Lance la surveillance combinée (token + révocation distante) */
  start() {
    if (this.isRunning()) return;
    this.isRunning.set(true);

    // 1️⃣ Lancer la surveillance de l’expiration locale
    this.tokenWatcher.startMonitor();

    // 2️⃣ Lancer le polling des sessions actives
    this.intervalId = setInterval(async () => {
      try {
        await this.devices.load(); // récupère les devices depuis l’API
        const current = this.devices.devices().find(d => d.current);
        if (!current) return;

        // Si la session courante n’existe plus → déconnexion
        if (!this.devices.devices().some(d => d.id === current.id)) {
          this.toast.warn('AUTH.SESSION_REVOKED');
          this.auth.logout();
          this.stop();
        }
      } catch {
        // ignore temporairement si offline
      }
    }, this.intervalMs);
  }

  /** Stoppe la surveillance */
  stop() {
    this.tokenWatcher.stopMonitor();
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    this.isRunning.set(false);
  }
}
