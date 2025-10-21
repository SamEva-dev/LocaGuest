import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ContractDto, ContractStatsDto } from '../../models/models';
import { LocaGuestApi } from './locaguest.api';

@Injectable({ providedIn: 'root' })
export class ContractApi {
  private readonly http = inject(LocaGuestApi);

  /** Récupère tous les contrats */
  getAll(): Observable<ContractDto[]> {
    return this.http.get<ContractDto[]>('/contracts');
  }

  /** Récupère les stats globales */
  getStats(): Observable<ContractStatsDto> {
    return this.http.get<ContractStatsDto>('/contracts/stats');
  }

  /** Détails d’un contrat spécifique */
  getById(id: string): Observable<ContractDto> {
    return this.http.get<ContractDto>(`/contracts/${id}`);
  }

  /** Création */
  create(body: ContractDto): Observable<ContractDto> {
    return this.http.post<ContractDto>('/contracts', body);
  }

  /** Mise à jour avec ETag */
  update(id: string, body: ContractDto, etag: string): Observable<ContractDto> {
    return this.http.putIfMatch<ContractDto>(`/contracts/${id}`, body, etag);
  }

  /** Suppression */
  delete(id: string, etag?: string): Observable<void> {
    return this.http.delete<void>(`/contracts/${id}`, { etag });
  }

  getFilteredContracts(filter: Record<string, any>): Observable<ContractDto[]> {
  const query = new URLSearchParams();
  Object.entries(filter).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.append(key, value.toString());
    }
  });
  return this.http.get<ContractDto[]>(`/contracts/filter?${query.toString()}`);
}

  /** Documents du contrat */
  getDocuments(id: string): Observable<{ id: string; title: string; url: string; size: string }[]> {
    return this.http.get<{ id: string; title: string; url: string; size: string }[]>(`/contracts/${id}/documents`);
  }
}
