import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environnements/environment.dev';

export interface PublicStats {
  propertiesCount: number;
  usersCount: number;
  satisfactionRate: number;
}

@Injectable({ providedIn: 'root' })
export class PublicStatsApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.BASE_LOCAGUEST_API}/api/PublicStats`;

  getStats(): Observable<PublicStats> {
    return this.http.get<PublicStats>(this.baseUrl);
  }
}
