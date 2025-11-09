import { Injectable, inject, signal } from '@angular/core';
import { TenantsApi, TenantListItem, TenantDetail, TenantPayment, TenantPaymentStats, CreateTenantDto, UpdateTenantDto } from '../api/tenants.api';
import { Contract, PaginatedResult } from '../api/properties.api';
import { Observable, catchError, of, shareReplay, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TenantsService {
  private tenantsApi = inject(TenantsApi);

  // Signals for reactive state
  tenants = signal<TenantListItem[]>([]);
  selectedTenant = signal<TenantDetail | null>(null);
  loading = signal(false);

  // Cached observables
  private tenantsCache$?: Observable<PaginatedResult<TenantListItem>>;

  getTenants(params?: {
    q?: string;
    status?: string;
    page?: number;
    pageSize?: number;
  }): Observable<PaginatedResult<TenantListItem>> {
    this.loading.set(true);
    return this.tenantsApi.getTenants(params).pipe(
      tap(result => {
        this.tenants.set(result.items);
        this.loading.set(false);
      }),
      catchError((err: unknown) => {
        console.error('Error loading tenants:', err);
        this.loading.set(false);
        return of({ totalCount: 0, page: 1, pageSize: 10, items: [] });
      }),
      shareReplay(1)
    );
  }

  getTenant(id: string): Observable<TenantDetail> {
    this.loading.set(true);
    return this.tenantsApi.getTenant(id).pipe(
      tap(tenant => {
        this.selectedTenant.set(tenant);
        this.loading.set(false);
      }),
      catchError((err: unknown) => {
        console.error('Error loading tenant:', err);
        this.loading.set(false);
        throw err;
      })
    );
  }

  getTenantPayments(id: string, from?: Date, to?: Date): Observable<TenantPayment[]> {
    return this.tenantsApi.getTenantPayments(id, from, to).pipe(
      catchError((err: unknown) => {
        console.error('Error loading tenant payments:', err);
        return of([]);
      })
    );
  }

  getTenantContracts(id: string): Observable<Contract[]> {
    return this.tenantsApi.getTenantContracts(id).pipe(
      catchError((err: unknown) => {
        console.error('Error loading tenant contracts:', err);
        return of([]);
      })
    );
  }

  getPaymentStats(id: string): Observable<TenantPaymentStats> {
    return this.tenantsApi.getPaymentStats(id).pipe(
      catchError((err: unknown) => {
        console.error('Error loading payment stats:', err);
        return of({
          tenantId: id,
          totalPaid: 0,
          totalPayments: 0,
          latePayments: 0,
          onTimeRate: 1.0
        });
      })
    );
  }

  // Mutations
  createTenant(dto: CreateTenantDto): Observable<TenantDetail> {
    console.log('Creating tenant:', dto);
    return this.tenantsApi.createTenant(dto).pipe(
      tap((created) => {
        if (this.tenants()?.length) {
          this.tenants.set([created as unknown as TenantListItem, ...this.tenants()]);
        }
      }),
      catchError((err: unknown) => {
        console.error('Error creating tenant:', err);
        throw err;
      })
    );
  }

  updateTenant(id: string, dto: UpdateTenantDto): Observable<TenantDetail> {
    return this.tenantsApi.updateTenant(id, dto).pipe(
      catchError((err: unknown) => {
        console.error('Error updating tenant:', err);
        throw err;
      })
    );
  }

  deleteTenant(id: string): Observable<void> {
    return this.tenantsApi.deleteTenant(id).pipe(
      tap(() => {
        this.tenants.set(this.tenants().filter(t => t.id !== id));
      }),
      catchError((err: unknown) => {
        console.error('Error deleting tenant:', err);
        throw err;
      })
    );
  }

  // Clear cache
  refresh(): void {
    this.tenantsCache$ = undefined;
  }

  // Clear all data
  clear(): void {
    this.tenants.set([]);
    this.selectedTenant.set(null);
    this.tenantsCache$ = undefined;
  }
}
