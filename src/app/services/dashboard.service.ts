import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {  ActivityItem, DashboardStatItem,  PropertyFilter,  PropertyRow } from '../models/models';
import { DashboardApi } from '../core/api/dashboard.api';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly api = inject(DashboardApi);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly stats = signal<DashboardStatItem[]>([]);
  readonly properties = signal<PropertyRow[]>([]);
  readonly activities = signal<ActivityItem[]>([]);

  async loadAll() {
    this.loading.set(true);
    this.error.set(null);
    try {
      const data = await firstValueFrom(this.api.getDashboard());
      this.stats.set(data.stats ?? []);
      this.properties.set(data.properties ?? []);
      this.activities.set(data.activities ?? []);
    } catch (e: any) {
      this.error.set(e?.message ?? 'COMMON.ERROR');
    } finally {
      this.loading.set(false);
    }
  }

  async filterProperties(filter: PropertyFilter): Promise<PropertyRow[]> {
    const local = this.properties();

    if (local && local.length) {
      const filtered = local.filter(p => {
        if (filter.status && p.status !== filter.status) return false;
        if (filter.type && p.type !== filter.type) return false;
        if (filter.tenant !== undefined) {
          const hasTenant = !!p.tenant;
          if (filter.tenant && !hasTenant) return false;
          if (!filter.tenant && hasTenant) return false;
        }
        if (filter.minRent && +p.rent < filter.minRent) return false;
        if (filter.maxRent && +p.rent > filter.maxRent) return false;
        return true;
      });

      if (filtered.length > 0) {
        this.properties.set(filtered);
        return filtered;
      }
    }

    // fallback backend
    this.loading.set(true);
    try {
      const result = await this.api.getFilteredProperties(filter).toPromise();
      this.properties.set(result ?? []);
      return result ?? [];
    } finally {
      this.loading.set(false);
    }
  }

  async refreshStats() {
    try {
      const s = await firstValueFrom(this.api.getStats());
      this.stats.set(s);
    } catch (e: any) { /* optionnel */ }
  }

  

  async deleteProperty(id: string, etag?: string) {
    await firstValueFrom(this.api.deleteProperty(id, etag));
    this.properties.update(list => list.filter(p => p.id !== id));
  }
}

