import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { FinancialDashboardDto } from '../../models/financial.models';
import { LocaGuestApi } from './locaguest.api';

@Injectable({ providedIn: 'root' })
export class FinancialApi {
  private readonly http = inject(LocaGuestApi);

  /** Vue d’ensemble complète (toutes sections) */
  getDashboard(year?: number): Observable<FinancialDashboardDto> {
    const params = year ? `?year=${year}` : '';
    return this.http.get<FinancialDashboardDto>(`/financial${params}`);
  }

  /** Export CSV ou Excel */
  export(year?: number): Observable<Blob> {
    const params = year ? `?year=${year}` : '';
    return this.http.getFile(`/financial/export${params}`);
  }
}
