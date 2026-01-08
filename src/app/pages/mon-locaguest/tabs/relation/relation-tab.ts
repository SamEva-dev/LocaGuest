import { Component, input, signal, inject, effect, computed } from '@angular/core';
import { DatePipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { RevenueChart } from '../../../../components/charts/revenue-chart/revenue-chart';
import { OccupancyChart } from '../../../../components/charts/occupancy-chart/occupancy-chart';
import { PropertyDetail, FinancialSummary, Payment, Contract } from '../../../../core/api/properties.api';
import { TenantDetail, TenantPaymentStats } from '../../../../core/api/tenants.api';
import { PropertiesService } from '../../../../core/services/properties.service';
import { TenantsService } from '../../../../core/services/tenants.service';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { Permissions } from '../../../../core/auth/permissions';

@Component({
  selector: 'relation-tab',
  standalone: true,
  imports: [TranslatePipe, DatePipe, RevenueChart, OccupancyChart],
  templateUrl: './relation-tab.html'
})
export class RelationTab {
  data = input<any>();
  private propertiesService = inject(PropertiesService);
  private tenantsService = inject(TenantsService);
  private auth = inject(AuthService);

  activeSubTab = signal('overview');
  isLoading = signal(false);
  
  property = signal<PropertyDetail | null>(null);
  tenant = signal<TenantDetail | null>(null);
  payments = signal<Payment[]>([]);
  contracts = signal<Contract[]>([]);
  activeContract = signal<Contract | null>(null);
  financialSummary = signal<FinancialSummary | null>(null);
  paymentStats = signal<TenantPaymentStats | null>(null);

  subTabs = [
    { id: 'overview', label: 'RELATION.SUB_TABS.OVERVIEW', icon: 'ph-info' },
    { id: 'payments', label: 'RELATION.SUB_TABS.PAYMENTS', icon: 'ph-currency-eur' },
    { id: 'documents', label: 'RELATION.SUB_TABS.DOCUMENTS', icon: 'ph-file-text' },
    { id: 'performance', label: 'RELATION.SUB_TABS.PERFORMANCE', icon: 'ph-chart-line-up' },
  ];

  get visibleSubTabs() {
    return this.subTabs.filter(t => this.canAccessSubTab(t.id));
  }

  paymentProgress = computed(() => {
    const total = this.payments().length;
    if (total === 0) return 0;
    const paid = this.payments().filter(p => p.status === 'Paid').length;
    return Math.round((paid / total) * 100);
  });

  constructor() {
    effect(() => {
      if (!this.canAccessSubTab(this.activeSubTab())) {
        this.activeSubTab.set('overview');
      }
    });

    effect(() => {
      const tabData = this.data();
      if (tabData?.propertyId && tabData?.tenantId) {
        this.loadRelation(tabData.propertyId, tabData.tenantId);
      }
    });
  }

  private canAccessSubTab(tabId: string): boolean {
    switch (tabId) {
      case 'overview':
        return this.auth.hasPermission(Permissions.PropertiesRead) && this.auth.hasPermission(Permissions.TenantsRead);
      case 'documents':
        return this.auth.hasPermission(Permissions.DocumentsRead);
      case 'payments':
      case 'performance':
        return this.auth.hasPermission(Permissions.AnalyticsRead);
      default:
        return true;
    }
  }

  selectSubTab(tabId: string) {
    if (!this.canAccessSubTab(tabId)) return;
    this.activeSubTab.set(tabId);
  }

  private loadRelation(propertyId: string, tenantId: string) {
    this.isLoading.set(true);
    
    // Load property
    this.propertiesService.getProperty(propertyId).subscribe({
      next: (property) => {
        this.property.set(property);
      },
      error: (err) => console.error('❌ Error loading property:', err)
    });

    // Load tenant
    this.tenantsService.getTenant(tenantId).subscribe({
      next: (tenant) => {
        this.tenant.set(tenant);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('❌ Error loading tenant:', err);
        this.isLoading.set(false);
      }
    });

    // Load property payments
    this.propertiesService.getPropertyPayments(propertyId).subscribe({
      next: (payments) => {
        this.payments.set(payments);
      },
      error: (err) => console.error('❌ Error loading payments:', err)
    });

    // Load contracts
    this.propertiesService.getPropertyContracts(propertyId).subscribe({
      next: (contracts) => {
        this.contracts.set(contracts);
        // Find active contract for this tenant
        const tenantContract = contracts.find(c => c.tenantId === tenantId);
        this.activeContract.set(tenantContract || null);
      },
      error: (err) => console.error('❌ Error loading contracts:', err)
    });

    // Load financial summary
    this.propertiesService.getFinancialSummary(propertyId).subscribe({
      next: (summary) => {
        this.financialSummary.set(summary);
      },
      error: (err) => console.error('❌ Error loading financial summary:', err)
    });

    // Load tenant payment stats
    this.tenantsService.getPaymentStats(tenantId).subscribe({
      next: (stats) => {
        this.paymentStats.set(stats);
      },
      error: (err) => console.error('❌ Error loading payment stats:', err)
    });
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }
}
