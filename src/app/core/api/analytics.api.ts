import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environnements/environment.prod';
import { AnalyticsOverview, AnalyticsPropertyPerformance, AnalyticsOptimization, AnalyticsResponse } from '../../models/analytics.models';

export interface ProfitabilityStats {
  monthlyRevenue: number;
  monthlyExpenses: number;
  netProfit: number;
  profitabilityRate: number;
  revenueChangePercent: number;
  expensesChangePercent: number;
  profitChangePercent: number;
  targetRate: number;
}

export interface RevenueEvolution {
  month: string;
  revenue: number;
  expenses: number;
}

export interface PropertyPerformance {
  propertyId: string;
  propertyName: string;
  revenue: number;
  expenses: number;
  netProfit: number;
  roi: number;
}


@Injectable({ providedIn: 'root' })
export class AnalyticsApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.BASE_LOCAGUEST_API}/api/analytics`;

  getOverview(period: string, propertyId?: string): Observable<AnalyticsResponse> {
    let url = `${this.baseUrl}?period=${encodeURIComponent(period)}`;
    if (propertyId) url += `&propertyId=${encodeURIComponent(propertyId)}`;
    return this.http.get<AnalyticsResponse>(url);
  }

  getProfitabilityStats(): Observable<ProfitabilityStats> {
    return this.http.get<ProfitabilityStats>(`${this.baseUrl}/profitability-stats`);
  }

  getRevenueEvolution(months: number, year?: number): Observable<RevenueEvolution[]> {
    let url = `${this.baseUrl}/revenue-evolution?months=${months}`;
    if (year) url += `&year=${year}`;
    return this.http.get<RevenueEvolution[]>(url);
  }

  getPropertyPerformance(): Observable<PropertyPerformance[]> {
    return this.http.get<PropertyPerformance[]>(`${this.baseUrl}/property-performance`);
  }

  getAvailableYears(): Observable<number[]> {
    return this.http.get<number[]>(`${this.baseUrl}/available-years`);
  }
}
