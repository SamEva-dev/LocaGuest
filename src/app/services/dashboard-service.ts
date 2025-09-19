import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private http = inject(HttpClient);

  stats = signal({
    properties: 12,
    tenants: 28,
    monthlyRevenue: 15840,
    occupancyRate: 94
  });

  load() {
    // 🚀 Simule un appel backend
    // plus tard: return this.http.get('/api/dashboard').subscribe(...)
    setTimeout(() => {
      this.stats.set({
        properties: 14,
        tenants: 32,
        monthlyRevenue: 16200,
        occupancyRate: 96
      });
    }, 1000);
  }
}
