import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { LocaGuestApi } from './locaguest.api';
import { ActivityItem, DashboardPayload, DashboardStatItem, PropertyRow } from '../../models/models';
//import { ActivityItem, DashboardPayload, DashboardStatItem, PropertyRow } from './models';

@Injectable({ providedIn: 'root' })
export class DashboardApi {
  private readonly http = inject(LocaGuestApi);

  /** Récupère la payload complète du Dashboard */
  getDashboard(): Observable<DashboardPayload> {
    return this.http.get<DashboardPayload>('/dashboard');
  }

  /** Endpoints granulaires si tu préfères charger en lazy */
  getStats(): Observable<DashboardStatItem[]> {
    return this.http.get<DashboardStatItem[]>('/dashboard/stats');
  }

  getProperties(): Observable<PropertyRow[]> {
    return this.http.get<PropertyRow[]>('/dashboard/properties');
  }

  getActivities(): Observable<ActivityItem[]> {
    return this.http.get<ActivityItem[]>('/dashboard/activities');
  }

  getFilteredProperties(filter: Record<string, any>): Observable<PropertyRow[]> {
      const query = new URLSearchParams();
      Object.entries(filter).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          query.append(key, value.toString());
        }
      });
      return this.http.get<PropertyRow[]>(`/dashboard/properties/filter?${query.toString()}`);
    }

  /** Suppression d’un bien (If-Match en option) */
  deleteProperty(id: string, etag?: string): Observable<void> {
    return this.http.delete<void>(`/properties/${id}`, { etag });
  }
}
