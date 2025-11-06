import { Injectable, inject, signal } from '@angular/core';
import { DashboardApi, DashboardSummary, Activity, Deadline, OccupancyChartData, RevenueChartData } from '../api/dashboard.api';
import { Observable, catchError, of, shareReplay, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private dashboardApi = inject(DashboardApi);

  // Signals for reactive state
  summary = signal<DashboardSummary | null>(null);
  activities = signal<Activity[]>([]);
  deadlines = signal<Deadline | null>(null);
  loading = signal(false);

  // Cached observables
  private summaryCache$?: Observable<DashboardSummary>;
  private activitiesCache$?: Observable<Activity[]>;
  private deadlinesCache$?: Observable<Deadline>;

  getSummary(): Observable<DashboardSummary> {
    console.log('this.summaryCache$',!this.summaryCache$)
    if (!this.summaryCache$) {
      this.loading.set(true);
      this.summaryCache$ = this.dashboardApi.getSummary().pipe(
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
        }),
        shareReplay(1)
      );
    }
    return this.summaryCache$;
  }

  getActivities(limit: number = 20): Observable<Activity[]> {
    if (!this.activitiesCache$) {
      this.activitiesCache$ = this.dashboardApi.getActivities(limit).pipe(
        tap(data => this.activities.set(data)),
        catchError((err: unknown) => {
          console.error('Error loading activities:', err);
          return of([]);
        }),
        shareReplay(1)
      );
    }
    return this.activitiesCache$;
  }

  getDeadlines(): Observable<Deadline> {
    if (!this.deadlinesCache$) {
      this.deadlinesCache$ = this.dashboardApi.getDeadlines().pipe(
        tap(data => this.deadlines.set(data)),
        catchError((err: unknown) => {
          console.error('Error loading deadlines:', err);
          return of({ lateRent: [], nextDue: [], renewals: [] });
        }),
        shareReplay(1)
      );
    }
    return this.deadlinesCache$;
  }

  getOccupancyChart(year: number = 2025): Observable<OccupancyChartData[]> {
    return this.dashboardApi.getOccupancyChart(year).pipe(
      catchError((err: unknown) => {
        console.error('Error loading occupancy chart:', err);
        return of([]);
      })
    );
  }

  getRevenueChart(year: number = 2025): Observable<RevenueChartData[]> {
    return this.dashboardApi.getRevenueChart(year).pipe(
      catchError((err: unknown) => {
        console.error('Error loading revenue chart:', err);
        return of([]);
      })
    );
  }

  // Invalidate cache and reload
  refresh(): void {
    this.summaryCache$ = undefined;
    this.activitiesCache$ = undefined;
    this.deadlinesCache$ = undefined;
    
    this.getSummary().subscribe();
    this.getActivities().subscribe();
    this.getDeadlines().subscribe();
  }

  // Clear all data
  clear(): void {
    this.summary.set(null);
    this.activities.set([]);
    this.deadlines.set(null);
    this.summaryCache$ = undefined;
    this.activitiesCache$ = undefined;
    this.deadlinesCache$ = undefined;
  }
}
