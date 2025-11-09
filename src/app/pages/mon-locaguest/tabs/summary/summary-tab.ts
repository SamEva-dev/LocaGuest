import { Component, inject, signal, computed, effect } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, takeUntil } from 'rxjs/operators';
import { InternalTabManagerService } from '../../../../core/services/internal-tab-manager.service';
import { OccupancyChart } from '../../../../components/charts/occupancy-chart/occupancy-chart';
import { PropertiesApi, PropertyListItem } from '../../../../core/api/properties.api';
import { TenantsApi, TenantListItem } from '../../../../core/api/tenants.api';
import { DashboardApi } from '../../../../core/api/dashboard.api';
import { AddPropertyForm } from '../../forms/add-property/add-property-form';
import { AddTenantForm } from '../../forms/add-tenant/add-tenant-form';

@Component({
  selector: 'summary-tab',
  standalone: true,
  imports: [TranslatePipe, OccupancyChart, AddPropertyForm, AddTenantForm, FormsModule],
  templateUrl: './summary-tab.html'
})
export class SummaryTab {
  private tabManager = inject(InternalTabManagerService);
  private propertiesApi = inject(PropertiesApi);
  private tenantsApi = inject(TenantsApi);
  private dashboardApi = inject(DashboardApi);

  viewMode = signal<'properties' | 'tenants'>('properties');
  displayMode = signal<'card' | 'table'>('card');
  isLoading = signal(false);
  showAddPropertyForm = signal(false);
  showAddTenantForm = signal(false);
  
  // Search & Filters
  searchQuery = signal('');
  statusFilter = signal<string>('all');
  currentPage = signal(1);
  pageSize = signal(50);
  totalItems = signal(0);
  
  // Search subjects for debounce
  private searchSubject$ = new Subject<string>();
  private destroy$ = new Subject<void>();
  
  properties = signal<PropertyListItem[]>([]);
  tenants = signal<TenantListItem[]>([]);
  notifications = signal<any[]>([]);
  deadlines = signal<any[]>([]);

  stats = computed(() => {
    const props = this.properties();
    const tens = this.tenants();
    const occupied = props?.filter(p => p.status === 'Occupied' || p.status === 'Occupé').length;
    const total = props?.length;
    const occupancy = total > 0 ? Math.round((occupied / total) * 100) : 0;
    const revenue = props?.reduce((sum, p) => sum + (p.rent || 0), 0);
    console.log('tens', tens);
    
    return [
      { key: 'properties', label: 'SUMMARY.STATS.PROPERTIES', value: total?.toString(), icon: 'ph-house', bgColor: '#38B2AC', delta: undefined, deltaPositive: true },
      { key: 'tenants', label: 'SUMMARY.STATS.ACTIVE_TENANTS', value: tens?.length.toString(), icon: 'ph-users-three', bgColor: '#ED8936', delta: undefined, deltaPositive: true },
      { key: 'occupancy', label: 'SUMMARY.STATS.OCCUPANCY', value: `${occupancy}%`, icon: 'ph-chart-line-up', bgColor: '#4299E1', delta: undefined, deltaPositive: false },
      { key: 'revenue', label: 'SUMMARY.STATS.REVENUE', value: `€ ${revenue?.toLocaleString()}`, icon: 'ph-currency-eur', bgColor: '#48BB78', delta: undefined, deltaPositive: true },
    ];
  });

  constructor() {
    // Load data on init
    //this.loadProperties();
    //this.loadTenants();
    //this.loadNotifications();
    
    // Setup search debounce
    this.searchSubject$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(query => {
        console.log('Search queryx:', query);
        this.searchQuery.set(query);
        this.currentPage.set(1);
       
          this.reloadCurrentView();

      });
    
    // Reload when view mode changes
    effect(() => {
      const mode = this.viewMode();
      // if (mode === 'properties' && this.properties()?.length === 0) {
      //   this.loadProperties();
      // } else if (mode === 'tenants' && this.tenants()?.length === 0) {
      //   this.loadTenants();
      // }
    });
  }

  ngOnInit() {
    this.loadProperties();
    this.loadTenants();
    this.loadNotifications();
  }
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }


  private loadProperties() {
    this.isLoading.set(true);
    const params: any = {
      page: this.currentPage(),
      pageSize: this.pageSize()
    };
    
    if (this.searchQuery()) {
      params.search = this.searchQuery();
    }
    
    if (this.statusFilter() && this.statusFilter() !== 'all') {
      params.status = this.statusFilter();
    }
    
    this.propertiesApi.getProperties(params).subscribe({
      next: (result) => {
        console.log('✅ params:', params);
        this.properties.set(result.items);
        this.totalItems.set(result.totalCount);
        this.isLoading.set(false);
        console.log('✅ Properties loaded:', result.items?.length, '/', result.totalCount);
      },
      error: (err) => {
        console.error('❌ Error loading properties:', err);
        this.isLoading.set(false);
      }
    });
  }

  private loadTenants() {
    this.isLoading.set(true);
    const params: any = {
      page: this.currentPage(),
      pageSize: this.pageSize()
    };
    
    if (this.searchQuery()) {
      params.search = this.searchQuery();
    }
    
    if (this.statusFilter() && this.statusFilter() !== 'all') {
      params.status = this.statusFilter();
    }
    
    this.tenantsApi.getTenants(params).subscribe({
      next: (result) => {
        this.tenants.set(result.items);
        this.totalItems.set(result.totalCount);
        this.isLoading.set(false);
        console.log('✅ Tenants loaded:', result.items?.length, '/', result.totalCount);
      },
      error: (err) => {
        console.error('❌ Error loading tenants:', err);
        this.isLoading.set(false);
      }
    });
  }

  private loadNotifications() {
    this.dashboardApi.getActivities(10).subscribe({
      next: (activities) => {
        this.notifications.set(activities.map((a: any) => ({
          id: a.id || Math.random().toString(),
          type: a.type || 'info',
          title: a.title || a.description || 'Notification',
          when: this.formatDate(a.createdAt || a.timestamp || new Date())
        })));
      },
      error: (err) => console.error('❌ Error loading notifications:', err)
    });
    
    this.dashboardApi.getDeadlines().subscribe({
      next: (deadlines: any) => {
        const items = Array.isArray(deadlines) ? deadlines : [];
        this.deadlines.set(items.map((d: any) => ({
          id: d.id || Math.random().toString(),
          title: d.title || d.description || 'Deadline',
          date: this.formatDeadline(d.dueDate || d.date || new Date())
        })));
      },
      error: (err) => console.error('❌ Error loading deadlines:', err)
    });
  }

  private formatDate(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return 'il y a quelques minutes';
    if (hours < 24) return `il y a ${hours}h`;
    return 'hier';
  }

  private formatDeadline(date: Date): string {
    return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  }

  openProperty(property: PropertyListItem) {
    console.log('property', property);
    this.tabManager.openProperty(property.id, property.name);
  }

  openTenant(tenant: TenantListItem) {
    console.log('tenant', tenant);
    this.tabManager.openTenant(tenant.id, tenant.fullName);
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  // Form handlers
  openAddPropertyForm() {
    this.showAddPropertyForm.set(true);
  }

  closeAddPropertyForm() {
    this.showAddPropertyForm.set(false);
  }

  onPropertyCreated(property: any) {
    console.log('Property created, reloading list...');
    this.loadProperties();
  }

  openAddTenantForm() {
    this.showAddTenantForm.set(true);
  }

  closeAddTenantForm() {
    this.showAddTenantForm.set(false);
  }

  onTenantCreated(tenant: any) {
    console.log('Tenant created, reloading list...');
    this.loadTenants();
  }

  // Search & Filter handlers
  onSearchInput(query: string) {
    console.log('Search query:', query);
    this.searchSubject$.next(query);
  }

  onStatusFilterChange(status: string) {
    console.log('Status filter:', status);
    this.statusFilter.set(status);
    this.currentPage.set(1);
    this.reloadCurrentView();
  }

  reloadCurrentView() {
    if (this.viewMode() === 'properties') {
      this.loadProperties();
    } else {
      this.loadTenants();
    }
  }

  onPageChange(page: number) {
    this.currentPage.set(page);
    this.reloadCurrentView();
  }

  get totalPages(): number {
    return Math.ceil(this.totalItems() / this.pageSize());
  }

  get hasNextPage(): boolean {
    return this.currentPage() < this.totalPages;
  }

  get hasPrevPage(): boolean {
    return this.currentPage() > 1;
  }
}
