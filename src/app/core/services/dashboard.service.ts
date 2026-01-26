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
  loadingSummary = signal(false);
  loadingActivities = signal(false);
  summaryError = signal<string | null>(null);
  activitiesError = signal<string | null>(null);

  getSummary(month?: number, year?: number): Observable<DashboardSummary> {
    this.loadingSummary.set(true);
    this.summaryError.set(null);
    return this.dashboardApi.getSummary(month, year).pipe(
      tap(data => {
        this.summary.set(data);
        this.loadingSummary.set(false);
      }),
      catchError((err: unknown) => {
        console.error('Error loading dashboard summary:', err);
        this.summaryError.set('Error loading dashboard summary');
        this.loadingSummary.set(false);
        return of<DashboardSummary>({
          propertiesCount: 0,
          occupiedPropertiesCount: 0,
          activeTenants: 0,
          occupancyRate: 0,
          monthlyRevenue: 0
        });
      })
    );
  }

  getActivities(limit: number = 20): Observable<Activity[]> {
    this.loadingActivities.set(true);
    this.activitiesError.set(null);
    return this.dashboardApi.getActivities(limit).pipe(
      tap(data => {
        this.activities.set(data);
        this.loadingActivities.set(false);
      }),
      catchError((err: unknown) => {
        console.error('Error loading activities:', err);
        this.activitiesError.set('Error loading activities');
        this.loadingActivities.set(false);
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

  getOccupancyChart(month: number, year: number): Observable<OccupancyChartData[]> {
    return this.dashboardApi.getOccupancyChart(month, year).pipe(
      map(response => response.dailyData),
      catchError((err: unknown) => {
        console.error('Error loading occupancy chart:', err);
        return of([]);
      })
    );
  }

  getRevenueChart(month: number, year: number): Observable<RevenueChartData[]> {
    return this.dashboardApi.getRevenueChart(month, year).pipe(
      map(response => response.dailyData),
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
