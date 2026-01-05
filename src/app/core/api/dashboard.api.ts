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
  upcomingDeadlines: Array<{
    type: string;
    title: string;
    description: string;
    date: string;
    propertyCode: string;
    tenantName: string;
  }>;
}

export interface OccupancyChartData {
  month: number;
  monthName: string;
  occupiedUnits: number;
  totalUnits: number;
  occupancyRate: number;
}

export interface RevenueChartData {
  month: number;
  monthName: string;
  expectedRevenue: number;
  actualRevenue: number;
  collectionRate: number;
}

@Injectable({ providedIn: 'root' })
export class DashboardApi {
  private http = inject(HttpClient);
  private baseUrl = `${environment.BASE_LOCAGUEST_API}/api/Dashboard`;

  getSummary(month?: number, year?: number): Observable<DashboardSummary> {
    let params = new HttpParams();
    if (month) params = params.set('month', month.toString());
    if (year) params = params.set('year', year.toString());
    
    return this.http.get<DashboardSummary>(`${this.baseUrl}/summary`, { params });
  }

  getActivities(limit: number = 20): Observable<Activity[]> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.http.get<Activity[]>(`${this.baseUrl}/activities`, { params });
  }

  getDeadlines(): Observable<Deadline> {
    return this.http.get<Deadline>(`${this.baseUrl}/deadlines`);
  }

  getOccupancyChart(year: number = 2025): Observable<{ monthlyData: OccupancyChartData[] }> {
    const params = new HttpParams().set('year', year.toString());
    return this.http.get<{ monthlyData: OccupancyChartData[] }>(`${this.baseUrl}/charts/occupancy`, { params });
  }

  getRevenueChart(year: number = 2025): Observable<{ monthlyData: RevenueChartData[] }> {
    const params = new HttpParams().set('year', year.toString());
    return this.http.get<{ monthlyData: RevenueChartData[] }>(`${this.baseUrl}/charts/revenue`, { params });
  }

  getAvailableYears(): Observable<{ years: number[] }> {
    return this.http.get<{ years: number[] }>(`${this.baseUrl}/available-years`);
  }
}
