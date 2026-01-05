import { Injectable, inject, signal } from '@angular/core';
import { PropertiesApi, PropertyListItem, PropertyDetail, Payment, Contract, FinancialSummary, PaginatedResult, CreatePropertyDto, UpdatePropertyDto } from '../api/properties.api';
import { Observable, catchError, map, of, shareReplay, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PropertiesService {
  private propertiesApi = inject(PropertiesApi);

  private toDate(value: unknown): Date | undefined {
    if (!value) return undefined;
    if (value instanceof Date) return value;
    if (typeof value === 'string' || typeof value === 'number') {
      const d = new Date(value);
      if (!Number.isNaN(d.getTime())) return d;
    }
    return undefined;
  }

  private normalizePayment(payment: Payment): Payment {
    return {
      ...payment,
      paymentDate: this.toDate((payment as any).paymentDate) as any,
    };
  }

  private normalizeContract(contract: Contract): Contract {
    return {
      ...contract,
      startDate: this.toDate((contract as any).startDate) as any,
      endDate: this.toDate((contract as any).endDate) as any,
      lastPaymentDate: this.toDate((contract as any).lastPaymentDate) as any,
      noticeEndDate: this.toDate((contract as any).noticeEndDate) as any,
    };
  }

  private normalizeProperty(property: PropertyDetail): PropertyDetail {
    return {
      ...property,
      createdAt: this.toDate((property as any).createdAt) as any,
      purchaseDate: this.toDate((property as any).purchaseDate) as any,
      electricDiagnosticDate: this.toDate((property as any).electricDiagnosticDate) as any,
      electricDiagnosticExpiry: this.toDate((property as any).electricDiagnosticExpiry) as any,
      gasDiagnosticDate: this.toDate((property as any).gasDiagnosticDate) as any,
      gasDiagnosticExpiry: this.toDate((property as any).gasDiagnosticExpiry) as any,
      asbestosDiagnosticDate: this.toDate((property as any).asbestosDiagnosticDate) as any,
    };
  }

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
    return this.propertiesApi.getProperties({
      status: params?.status,
      city: params?.city,
      search: params?.q,
      page: params?.page,
      pageSize: params?.pageSize,
    }).pipe(
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
      map(property => this.normalizeProperty(property)),
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
      map(payments => payments.map(p => this.normalizePayment(p))),
      catchError((err: unknown) => {
        console.error('Error loading property payments:', err);
        return of([]);
      })
    );
  }

  getPropertyContracts(id: string): Observable<Contract[]> {
    return this.propertiesApi.getPropertyContracts(id).pipe(
      map(contracts => contracts.map(c => this.normalizeContract(c))),
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
          occupancyRate: 0,
          totalPayments: 0,
          activeContracts: 0
        });
      })
    );
  }

  // Mutations
  createProperty(dto: CreatePropertyDto): Observable<PropertyDetail> {
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
      map(updated => this.normalizeProperty(updated)),
      tap(updated => {
        this.selectedProperty.set(updated);
      }),
      catchError((err: unknown) => {
        console.error('Error updating property:', err);
        throw err;
      })
    );
  }

  updatePropertyStatus(id: string, status: string): Observable<{ success: boolean }> {
    return this.propertiesApi.updatePropertyStatus(id, status).pipe(
      tap(() => {
        // Update local state if property is selected
        const current = this.selectedProperty();
        if (current && current.id === id) {
          this.selectedProperty.set({ ...current, status });
        }
      }),
      catchError((err: unknown) => {
        console.error('Error updating property status:', err);
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

  getAvailableTenants(propertyId: string): Observable<any[]> {
    return this.propertiesApi.getAvailableTenants(propertyId);
  }

  assignTenant(propertyId: string, contractDto: any): Observable<any> {
    return this.propertiesApi.assignTenant(propertyId, contractDto);
  }

  dissociateTenant(propertyId: string, tenantId: string): Observable<void> {
    return this.propertiesApi.dissociateTenant(propertyId, tenantId);
  }

  getAssociatedTenants(propertyId: string) {
    return this.propertiesApi.getAssociatedTenants(propertyId);
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
