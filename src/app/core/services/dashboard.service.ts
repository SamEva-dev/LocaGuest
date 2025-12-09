import { Injectable, inject, signal } from '@angular/core';
import { DashboardApi, DashboardSummary, Activity, Deadline, OccupancyChartData, RevenueChartData } from '../api/dashboard.api';
import { Observable, catchError, of, tap, map } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private dashboardApi = inject(DashboardApi);

  // Signals for reactive state
  summary = signal<DashboardSummary | null>(null);
  activities = signal<Activity[]>([]);
  deadlines = signal<Deadline | null>(null);
  loading = signal(false);

  getSummary(): Observable<DashboardSummary> {
    this.loading.set(true);
    return this.dashboardApi.getSummary().pipe(
      tap(data => {
        this.summary.set(data);
        this.loading.set(false);
      }),
      catchError((err: unknown) => {
        console.error('Error loading dashboard summary:', err);
        this.loading.set(false);
        return of({
          propertiesCount: 0,
          activeTenants: 0,
          occupancyRate: 0,
          monthlyRevenue: 0
        });
      })
    );
  }

  getActivities(limit: number = 20): Observable<Activity[]> {
    return this.dashboardApi.getActivities(limit).pipe(
      tap(data => this.activities.set(data)),
      catchError((err: unknown) => {
        console.error('Error loading activities:', err);
        return of([]);
      })
    );
  }

  getDeadlines(): Observable<Deadline> {
    return this.dashboardApi.getDeadlines().pipe(
      tap(data => this.deadlines.set(data)),
      catchError((err: unknown) => {
        console.error('Error loading deadlines:', err);
        return of({ upcomingDeadlines: [] });
      })
    );
  }

  getOccupancyChart(year: number = 2025): Observable<OccupancyChartData[]> {
    return this.dashboardApi.getOccupancyChart(year).pipe(
      map(response => response.monthlyData),
      catchError((err: unknown) => {
        console.error('Error loading occupancy chart:', err);
        return of([]);
      })
    );
  }

  getRevenueChart(year: number = 2025): Observable<RevenueChartData[]> {
    return this.dashboardApi.getRevenueChart(year).pipe(
      map(response => response.monthlyData),
      catchError((err: unknown) => {
        console.error('Error loading revenue chart:', err);
        return of([]);
      })
    );
  }

  getAvailableYears(): Observable<number[]> {
    return this.dashboardApi.getAvailableYears().pipe(
      map(response => response.years),
      catchError((err: unknown) => {
        console.error('Error loading available years:', err);
        return of([new Date().getFullYear()]);
      })
    );
  }

  // Clear all data
  clear(): void {
    this.summary.set(null);
    this.activities.set([]);
    this.deadlines.set(null);
  }
}
