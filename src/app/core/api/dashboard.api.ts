import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environnements/environment';

export interface DashboardSummary {
  propertiesCount: number;
  activeTenants: number;
  occupancyRate: number;
  monthlyRevenue: number;
}

export interface Activity {
  type: string;
  title: string;
  date: Date;
}

export interface Deadline {
  lateRent: Array<{ propertyName: string; amount: number; daysLate: number }>;
  nextDue: Array<{ propertyName: string; amount: number; daysUntil: number }>;
  renewals: Array<{ propertyName: string; daysUntil: number }>;
}

export interface OccupancyChartData {
  month: number;
  rate: number;
}

export interface RevenueChartData {
  month: number;
  revenue: number;
}

@Injectable({ providedIn: 'root' })
export class DashboardApi {
  private http = inject(HttpClient);
  private baseUrl = `${environment.BASE_LOCAGUEST_API}/api/dashboard`;

  getSummary(): Observable<DashboardSummary> {
    console.log("call summary here");
    return this.http.get<DashboardSummary>(`${this.baseUrl}/summary`);
  }

  getActivities(limit: number = 20): Observable<Activity[]> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.http.get<Activity[]>(`${this.baseUrl}/activities`, { params });
  }

  getDeadlines(): Observable<Deadline> {
    return this.http.get<Deadline>(`${this.baseUrl}/deadlines`);
  }

  getOccupancyChart(year: number = 2025): Observable<OccupancyChartData[]> {
    const params = new HttpParams().set('year', year.toString());
    return this.http.get<OccupancyChartData[]>(`${this.baseUrl}/charts/occupancy`, { params });
  }

  getRevenueChart(year: number = 2025): Observable<RevenueChartData[]> {
    const params = new HttpParams().set('year', year.toString());
    return this.http.get<RevenueChartData[]>(`${this.baseUrl}/charts/revenue`, { params });
  }
}
