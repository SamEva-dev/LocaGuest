import { Injectable, inject, signal } from '@angular/core';
import { AnalyticsApi, ProfitabilityStats, RevenueEvolution, PropertyPerformance } from '../api/analytics.api';
import { Observable, catchError, of, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private analyticsApi = inject(AnalyticsApi);

  // Signals for reactive state
  profitabilityStats = signal<ProfitabilityStats | null>(null);
  revenueEvolution = signal<RevenueEvolution[]>([]);
  propertyPerformance = signal<PropertyPerformance[]>([]);
  availableYears = signal<number[]>([]);
  loading = signal(false);

  getProfitabilityStats(): Observable<ProfitabilityStats> {
    this.loading.set(true);
    return this.analyticsApi.getProfitabilityStats().pipe(
      tap(stats => {
        this.profitabilityStats.set(stats);
        this.loading.set(false);
      }),
      catchError((err: unknown) => {
        console.error('Error loading profitability stats:', err);
        this.loading.set(false);
        throw err;
      })
    );
  }

  getRevenueEvolution(months: number, year?: number): Observable<RevenueEvolution[]> {
    this.loading.set(true);
    return this.analyticsApi.getRevenueEvolution(months, year).pipe(
      tap(evolution => {
        this.revenueEvolution.set(evolution);
        this.loading.set(false);
      }),
      catchError((err: unknown) => {
        console.error('Error loading revenue evolution:', err);
        this.loading.set(false);
        return of([]);
      })
    );
  }

  getPropertyPerformance(): Observable<PropertyPerformance[]> {
    this.loading.set(true);
    return this.analyticsApi.getPropertyPerformance().pipe(
      tap(performance => {
        this.propertyPerformance.set(performance);
        this.loading.set(false);
      }),
      catchError((err: unknown) => {
        console.error('Error loading property performance:', err);
        this.loading.set(false);
        return of([]);
      })
    );
  }

  getAvailableYears(): Observable<number[]> {
    return this.analyticsApi.getAvailableYears().pipe(
      tap(years => {
        this.availableYears.set(years);
      }),
      catchError((err: unknown) => {
        console.error('Error loading available years:', err);
        return of([new Date().getFullYear()]);
      })
    );
  }

  // Clear all data
  clear(): void {
    this.profitabilityStats.set(null);
    this.revenueEvolution.set([]);
    this.propertyPerformance.set([]);
    this.availableYears.set([]);
  }
}
