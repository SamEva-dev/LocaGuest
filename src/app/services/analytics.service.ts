import { inject, Injectable, signal } from '@angular/core';
import { LocaGuestApi } from '../core/api/locaguest.api';
import { firstValueFrom } from 'rxjs';
import { AnalyticsChartPoint, AnalyticsOptimization, AnalyticsOverview, AnalyticsPropertyPerformance, AnalyticsYieldShare } from '../models/analytics.models';
import { AnalyticsApi } from '../core/api/analytics.api';

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly api = inject(AnalyticsApi);

  readonly overview = signal<AnalyticsOverview | null>(null);
  readonly performances = signal<AnalyticsPropertyPerformance[]>([]);
  readonly optimizations = signal<AnalyticsOptimization[]>([]);
  readonly cashflow = signal<AnalyticsChartPoint[]>([]);
readonly yieldShare = signal<AnalyticsYieldShare[]>([]);
  readonly loading = signal(false);

  async load(period = '6m', propertyId?: string) {
  this.loading.set(true);
  try {
    const result = await firstValueFrom(this.api.getOverview(period, propertyId));
    this.overview.set(result.overview);
    this.performances.set(result.performances);
    this.optimizations.set(result.optimizations);
    this.cashflow.set(result.cashflow ?? []);
    this.yieldShare.set(result.yieldShare ?? []);
  } finally {
    this.loading.set(false);
  }
}
}
