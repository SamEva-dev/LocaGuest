import { Component, inject, signal, computed, effect } from '@angular/core';
import { NgClass } from '@angular/common';
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
import { ConfirmService } from '../../../../core/ui/confirm.service';
import { ToastService } from '../../../../core/ui/toast.service';

@Component({
  selector: 'summary-tab',
  standalone: true,
  imports: [NgClass, TranslatePipe, OccupancyChart, AddPropertyForm, AddTenantForm, FormsModule],
  templateUrl: './summary-tab.html'
})
export class SummaryTab {
  private tabManager = inject(InternalTabManagerService);
  private propertiesApi = inject(PropertiesApi);
  private tenantsApi = inject(TenantsApi);
  private dashboardApi = inject(DashboardApi);
  private confirmService = inject(ConfirmService);
  private toasts = inject(ToastService);

  viewMode = signal<'properties' | 'tenants'>('properties');
  displayMode = signal<'card' | 'table'>('card');
  isLoading = signal(false);
  showAddPropertyForm = signal(false);
  showAddTenantForm = signal(false);
  
  // Search & Filters
  searchQuery = signal('');
  statusFilter = signal<string>('all');
  usageTypeFilter = signal<string>('all');
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

  openMenuId = signal<string | null>(null);

  stats = computed(() => {
    const props = this.properties();
    const tens = this.tenants();
    const occupied = props?.filter(p => p.status === 'Occupied' || p.status === 'Occupé' || p.status === 'PartiallyOccupied').length;
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
    
    if (this.usageTypeFilter() && this.usageTypeFilter() !== 'all') {
      params.propertyUsageType = this.usageTypeFilter();
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

  toggleMenu(id: string, event?: Event) {
    event?.stopPropagation();
    this.openMenuId.update((current) => (current === id ? null : id));
  }

  closeMenu(event?: Event) {
    event?.stopPropagation();
    this.openMenuId.set(null);
  }

  viewPropertyDetail(property: PropertyListItem, event?: Event) {
    event?.stopPropagation();
    this.openMenuId.set(null);
    this.openProperty(property);
  }

  editProperty(property: PropertyListItem, event?: Event) {
    event?.stopPropagation();
    this.openMenuId.set(null);
    this.tabManager.openProperty(property.id, property.name, { edit: true });
  }

  async deleteProperty(property: PropertyListItem, event?: Event) {
    event?.stopPropagation();
    this.openMenuId.set(null);

    const status = (property.status ?? '').toLowerCase();
    const isOccupiedStatus =
      status === 'occupied' ||
      status === 'occupé' ||
      status === 'partiallyoccupied' ||
      status === 'partiellement occupé' ||
      status === 'reserved' ||
      status === 'réservé';

    const hasOccupants = (property.occupiedRooms ?? 0) > 0;

    if (isOccupiedStatus || hasOccupants) {
      this.toasts.errorDirect('Suppression impossible: le bien est occupé (ou réservé).');
      return;
    }

    const confirmed = await this.confirmService.danger(
      'Supprimer le bien',
      `Êtes-vous sûr de vouloir supprimer "${property.name}" ?`
    );
    if (!confirmed) return;

    this.propertiesApi.deleteProperty(property.id).subscribe({
      next: () => {
        this.toasts.successDirect('Bien supprimé');
        this.reloadCurrentView();
      },
      error: (err) => {
        console.error('❌ Error deleting property:', err);
        this.toasts.errorDirect('Erreur lors de la suppression du bien');
      }
    });
  }

  viewTenantDetail(tenant: TenantListItem, event?: Event) {
    event?.stopPropagation();
    this.openMenuId.set(null);
    this.openTenant(tenant);
  }

  editTenant(tenant: TenantListItem, event?: Event) {
    event?.stopPropagation();
    this.openMenuId.set(null);
    this.openTenant(tenant);
  }

  async deleteTenant(tenant: TenantListItem, event?: Event) {
    event?.stopPropagation();
    this.openMenuId.set(null);

    if ((tenant.activeContracts ?? 0) > 0) {
      this.toasts.errorDirect('Suppression impossible: le locataire a un contrat actif.');
      return;
    }

    const confirmed = await this.confirmService.danger(
      'Supprimer le locataire',
      `Êtes-vous sûr de vouloir supprimer "${tenant.fullName}" ?`
    );
    if (!confirmed) return;

    this.tenantsApi.deleteTenant(tenant.id).subscribe({
      next: () => {
        this.toasts.successDirect('Locataire supprimé');
        this.reloadCurrentView();
      },
      error: (err) => {
        console.error('❌ Error deleting tenant:', err);
        this.toasts.errorDirect('Erreur lors de la suppression du locataire');
      }
    });
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

  onUsageTypeFilterChange(usageType: string) {
    console.log('Usage type filter:', usageType);
    this.usageTypeFilter.set(usageType);
    this.currentPage.set(1);
    this.reloadCurrentView();
  }

  getUsageTypeIcon(usageType: string): string {
    switch(usageType) {
      case 'complete': return 'ph-house';
      case 'colocation': return 'ph-users-three';
      case 'airbnb': return 'ph-airplane-in-flight';
      default: return 'ph-house';
    }
  }

  getUsageTypeLabel(usageType: string): string {
    switch(usageType) {
      case 'complete': return 'Location complète';
      case 'colocation': return 'Colocation';
      case 'airbnb': return 'Airbnb';
      default: return 'Non défini';
    }
  }

  getUsageTypeColor(usageType: string): string {
    switch(usageType) {
      case 'complete': return 'emerald';
      case 'colocation': return 'blue';
      case 'airbnb': return 'purple';
      default: return 'slate';
    }
  }

  getStatusClass(status: string): string {
    switch(status) {
      case 'Vacant': return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
      case 'Occupied': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'PartiallyOccupied': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
    }
  }

  getStatusLabel(status: string): string {
    switch(status) {
      case 'Vacant': return 'Vacant';
      case 'Occupied': return 'Occupé';
      case 'PartiallyOccupied': return 'Partiellement occupé';
      default: return status;
    }
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
