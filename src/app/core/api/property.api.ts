import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PropertyDto } from '../../models/models';
import { LocaGuestApi } from './locaguest.api';

@Injectable({ providedIn: 'root' })
export class PropertyApi {
  private readonly http = inject(LocaGuestApi);

  getAll(): Observable<PropertyDto[]> {
    return this.http.get<PropertyDto[]>('/properties');
  }

  getById(id: string): Observable<PropertyDto> {
    return this.http.get<PropertyDto>(`/properties/${id}`);
  }

  create(body: PropertyDto): Observable<PropertyDto> {
    return this.http.post<PropertyDto>('/properties', body);
  }

  update(id: string, body: PropertyDto, etag: string): Observable<PropertyDto> {
    return this.http.putIfMatch<PropertyDto>(`/properties/${id}`, body, etag);
  }

  delete(id: string, etag?: string): Observable<void> {
    return this.http.delete<void>(`/properties/${id}`, { etag });
  }
}
