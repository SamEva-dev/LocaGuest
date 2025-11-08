import { Component, input, signal, inject, effect, computed } from '@angular/core';
import { DatePipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { RevenueChart } from '../../../../components/charts/revenue-chart/revenue-chart';
import { OccupancyChart } from '../../../../components/charts/occupancy-chart/occupancy-chart';
import { PropertyDetail, FinancialSummary, Payment, Contract } from '../../../../core/api/properties.api';
import { TenantDetail, TenantPaymentStats } from '../../../../core/api/tenants.api';
import { PropertiesService } from '../../../../core/services/properties.service';
import { TenantsService } from '../../../../core/services/tenants.service';

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

  paymentProgress = computed(() => {
    const total = this.payments().length;
    if (total === 0) return 0;
    const paid = this.payments().filter(p => p.status === 'Paid').length;
    return Math.round((paid / total) * 100);
  });

  constructor() {
    effect(() => {
      const tabData = this.data();
      if (tabData?.propertyId && tabData?.tenantId) {
        this.loadRelation(tabData.propertyId, tabData.tenantId);
      }
    });
  }

  private loadRelation(propertyId: string, tenantId: string) {
    this.isLoading.set(true);
    
    // Load property
    this.propertiesService.getProperty(propertyId).subscribe({
      next: (property) => {
        this.property.set(property);
        console.log('✅ Property loaded:', property.name);
      },
      error: (err) => console.error('❌ Error loading property:', err)
    });

    // Load tenant
    this.tenantsService.getTenant(tenantId).subscribe({
      next: (tenant) => {
        this.tenant.set(tenant);
        this.isLoading.set(false);
        console.log('✅ Tenant loaded:', tenant.fullName);
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
        console.log('✅ Payments loaded:', payments.length);
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
        console.log('✅ Contracts loaded:', contracts.length);
      },
      error: (err) => console.error('❌ Error loading contracts:', err)
    });

    // Load financial summary
    this.propertiesService.getFinancialSummary(propertyId).subscribe({
      next: (summary) => {
        this.financialSummary.set(summary);
        console.log('✅ Financial summary loaded');
      },
      error: (err) => console.error('❌ Error loading financial summary:', err)
    });

    // Load tenant payment stats
    this.tenantsService.getPaymentStats(tenantId).subscribe({
      next: (stats) => {
        this.paymentStats.set(stats);
        console.log('✅ Payment stats loaded');
      },
      error: (err) => console.error('❌ Error loading payment stats:', err)
    });
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }
}
