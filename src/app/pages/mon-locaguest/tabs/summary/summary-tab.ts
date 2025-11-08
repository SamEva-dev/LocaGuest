import { Component, inject, signal, computed, effect } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { InternalTabManagerService } from '../../../../core/services/internal-tab-manager.service';
import { OccupancyChart } from '../../../../components/charts/occupancy-chart/occupancy-chart';
import { PropertiesApi, PropertyListItem } from '../../../../core/api/properties.api';
import { TenantsApi, TenantListItem } from '../../../../core/api/tenants.api';
import { DashboardApi } from '../../../../core/api/dashboard.api';

@Component({
  selector: 'summary-tab',
  standalone: true,
  imports: [TranslatePipe, OccupancyChart],
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
  
  properties = signal<PropertyListItem[]>([]);
  tenants = signal<TenantListItem[]>([]);
  notifications = signal<any[]>([]);
  deadlines = signal<any[]>([]);

  stats = computed(() => {
    const props = this.properties();
    const tens = this.tenants();
    const occupied = props.filter(p => p.status === 'Occupied' || p.status === 'Occupé').length;
    const total = props.length;
    const occupancy = total > 0 ? Math.round((occupied / total) * 100) : 0;
    const revenue = props.reduce((sum, p) => sum + (p.rent || 0), 0);
    
    return [
      { key: 'properties', label: 'SUMMARY.STATS.PROPERTIES', value: total.toString(), icon: 'ph-house', bgColor: '#38B2AC', delta: undefined, deltaPositive: true },
      { key: 'tenants', label: 'SUMMARY.STATS.ACTIVE_TENANTS', value: tens.length.toString(), icon: 'ph-users-three', bgColor: '#ED8936', delta: undefined, deltaPositive: true },
      { key: 'occupancy', label: 'SUMMARY.STATS.OCCUPANCY', value: `${occupancy}%`, icon: 'ph-chart-line-up', bgColor: '#4299E1', delta: undefined, deltaPositive: false },
      { key: 'revenue', label: 'SUMMARY.STATS.REVENUE', value: `€ ${revenue.toLocaleString()}`, icon: 'ph-currency-eur', bgColor: '#48BB78', delta: undefined, deltaPositive: true },
    ];
  });

  constructor() {
    // Load data on init
    this.loadProperties();
    this.loadTenants();
    this.loadNotifications();
    
    // Reload when view mode changes
    effect(() => {
      const mode = this.viewMode();
      if (mode === 'properties' && this.properties().length === 0) {
        this.loadProperties();
      } else if (mode === 'tenants' && this.tenants().length === 0) {
        this.loadTenants();
      }
    });
  }

  private loadProperties() {
    this.isLoading.set(true);
    this.propertiesApi.getProperties({ pageSize: 50 }).subscribe({
      next: (result) => {
        this.properties.set(result.data);
        this.isLoading.set(false);
        console.log('✅ Properties loaded:', result.data.length);
      },
      error: (err) => {
        console.error('❌ Error loading properties:', err);
        this.isLoading.set(false);
      }
    });
  }

  private loadTenants() {
    this.isLoading.set(true);
    this.tenantsApi.getTenants({ pageSize: 50 }).subscribe({
      next: (result) => {
        this.tenants.set(result.data);
        this.isLoading.set(false);
        console.log('✅ Tenants loaded:', result.data.length);
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
    this.tabManager.openProperty(property.id, property.name);
  }

  openTenant(tenant: TenantListItem) {
    this.tabManager.openTenant(tenant.id, tenant.fullName);
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }
}
