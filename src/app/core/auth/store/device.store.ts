// core/auth/device.store.ts
import { inject, Injectable, signal } from '@angular/core';
import { AuthApi } from '../../api/auth.api';

@Injectable({ providedIn: 'root' })
export class DeviceStore {
  private api = inject(AuthApi);
  devices = signal<{ id: string; ip: string; userAgent: string; lastSeen: string; current: boolean }[]>([]);

  async load() {
    const res = await this.api.listDevices().toPromise();
    this.devices.set(res ?? []);
  }

  async revoke(id: string) {
    await this.api.revokeDevice(id).toPromise();
    this.devices.update(d => d.filter(x => x.id !== id));
  }

  async revokeAll() {
    await this.api.revokeAllDevices().toPromise();
    this.devices.set([]);
  }
}
