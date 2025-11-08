import { Component, inject, computed } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { OccupancyChart } from '../../components/charts/occupancy-chart/occupancy-chart';
import { RevenueChart } from '../../components/charts/revenue-chart/revenue-chart';
import { TabManagerService } from '../../core/services/tab-manager.service';
import { DashboardService } from '../../core/services/dashboard.service';

@Component({
  selector: 'app-dashboard',
  imports: [TranslatePipe, OccupancyChart, RevenueChart],
  templateUrl: './dashboard.html'
})
export class Dashboard {
  private tabManager = inject(TabManagerService);
  private translate = inject(TranslateService)
  dashboard = inject(DashboardService);

  // Charger données
  summary$ = this.dashboard.getSummary();
  activities$ = this.dashboard.getActivities(20);

  // Mapper les stat cards à partir du summary
  stats = computed(() => {
    const s = this.dashboard.summary();
    return [
      { key: 'properties', label: 'DASHBOARD.STATS.PROPERTIES', value: s?.propertiesCount ?? 0, icon: 'ph-house', delta: undefined, deltaPositive: true },
      { key: 'tenants', label: 'DASHBOARD.STATS.TENANTS', value: s?.activeTenants ?? 0, icon: 'ph-users-three', delta: undefined, deltaPositive: true },
      { key: 'occupancy', label: 'DASHBOARD.STATS.OCCUPANCY', value: `${Math.round((s?.occupancyRate ?? 0)*100)}%`, icon: 'ph-chart-line-up', delta: undefined, deltaPositive: true },
      { key: 'revenue', label: 'DASHBOARD.STATS.REVENUE', value: `€ ${s?.monthlyRevenue?.toLocaleString?.() ?? 0}`, icon: 'ph-currency-eur', delta: undefined, deltaPositive: true },
    ];
  });

  activities = this.dashboard.activities();

  ngOnInit() {
    this.summary$.subscribe();
    this.activities$.subscribe();
  }

  openPropertyDemo() {
    this.tabManager.openProperty('1', 'T3 - Centre Ville');
  }

  openTenantDemo() {
    this.tabManager.openTenant('1', 'Marie Dupont');
  }
}
