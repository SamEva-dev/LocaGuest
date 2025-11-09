import { Injectable, inject, signal } from '@angular/core';
import { PropertiesApi, PropertyListItem, PropertyDetail, Payment, Contract, FinancialSummary, PaginatedResult, CreatePropertyDto, UpdatePropertyDto } from '../api/properties.api';
import { Observable, catchError, of, shareReplay, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PropertiesService {
  private propertiesApi = inject(PropertiesApi);

  // Signals for reactive state
  properties = signal<PropertyListItem[]>([]);
  selectedProperty = signal<PropertyDetail | null>(null);
  loading = signal(false);

  // Cached observables
  private propertiesCache$?: Observable<PaginatedResult<PropertyListItem>>;

  getProperties(params?: {
    status?: string;
    city?: string;
    q?: string;
    page?: number;
    pageSize?: number;
  }): Observable<PaginatedResult<PropertyListItem>> {
    this.loading.set(true);
    return this.propertiesApi.getProperties(params).pipe(
      tap(result => {
        this.properties.set(result.items);
        this.loading.set(false);
      }),
      catchError((err: unknown) => {
        console.error('Error loading properties:', err);
        this.loading.set(false);
        return of({ totalCount: 0, page: 1, pageSize: 10, items: [] });
      }),
      shareReplay(1)
    );
  }

  getProperty(id: string): Observable<PropertyDetail> {
    this.loading.set(true);
    return this.propertiesApi.getProperty(id).pipe(
      tap(property => {
        this.selectedProperty.set(property);
        this.loading.set(false);
      }),
      catchError((err: unknown) => {
        console.error('Error loading property:', err);
        this.loading.set(false);
        throw err;
      })
    );
  }

  getPropertyPayments(id: string, from?: Date, to?: Date): Observable<Payment[]> {
    return this.propertiesApi.getPropertyPayments(id, from, to).pipe(
      catchError((err: unknown) => {
        console.error('Error loading property payments:', err);
        return of([]);
      })
    );
  }

  getPropertyContracts(id: string): Observable<Contract[]> {
    return this.propertiesApi.getPropertyContracts(id).pipe(
      catchError((err: unknown) => {
        console.error('Error loading property contracts:', err);
        return of([]);
      })
    );
  }

  getFinancialSummary(id: string): Observable<FinancialSummary> {
    return this.propertiesApi.getFinancialSummary(id).pipe(
      catchError((err: unknown) => {
        console.error('Error loading financial summary:', err);
        return of({
          propertyId: id,
          totalRevenue: 0,
          monthlyRent: 0,
          occupancyRate: 0
        });
      })
    );
  }

  // Mutations
  createProperty(dto: CreatePropertyDto): Observable<PropertyDetail> {
    console.log('Creating property:', dto);
    return this.propertiesApi.createProperty(dto).pipe(
      tap((created) => {
        // Optimistic refresh of list if present
        if (this.properties()?.length) {
          this.properties.set([created as unknown as PropertyListItem, ...this.properties()]);
        }
      }),
      catchError((err: unknown) => {
        console.error('Error creating property:', err);
        throw err;
      })
    );
  }

  updateProperty(id: string, dto: UpdatePropertyDto): Observable<PropertyDetail> {
    return this.propertiesApi.updateProperty(id, dto).pipe(
      catchError((err: unknown) => {
        console.error('Error updating property:', err);
        throw err;
      })
    );
  }

  deleteProperty(id: string): Observable<void> {
    return this.propertiesApi.deleteProperty(id).pipe(
      tap(() => {
        this.properties.set(this.properties().filter(p => p.id !== id));
      }),
      catchError((err: unknown) => {
        console.error('Error deleting property:', err);
        throw err;
      })
    );
  }

  // Clear cache
  refresh(): void {
    this.propertiesCache$ = undefined;
  }

  // Clear all data
  clear(): void {
    this.properties.set([]);
    this.selectedProperty.set(null);
    this.propertiesCache$ = undefined;
  }
}
