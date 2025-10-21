import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environnements/environment.prod';
import { AnalyticsOverview, AnalyticsPropertyPerformance, AnalyticsOptimization, AnalyticsResponse } from '../../models/analytics.models';


@Injectable({ providedIn: 'root' })
export class AnalyticsApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.BASE_LOCAGUEST_API}/analytics`;

  getOverview(period: string, propertyId?: string): Observable<AnalyticsResponse> {
    let url = `${this.baseUrl}?period=${encodeURIComponent(period)}`;
    if (propertyId) url += `&propertyId=${encodeURIComponent(propertyId)}`;
    return this.http.get<AnalyticsResponse>(url);
  }
}
