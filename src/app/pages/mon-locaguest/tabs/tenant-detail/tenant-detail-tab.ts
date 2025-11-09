import { Component, input, signal, inject, effect } from '@angular/core';
import { DatePipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { InternalTabManagerService } from '../../../../core/services/internal-tab-manager.service';
import { OccupancyChart } from '../../../../components/charts/occupancy-chart/occupancy-chart';
import { TenantDetail, TenantPayment, TenantPaymentStats } from '../../../../core/api/tenants.api';
import { TenantsService } from '../../../../core/services/tenants.service';
import { Contract } from '../../../../core/api/properties.api';

@Component({
  selector: 'tenant-detail-tab',
  standalone: true,
  imports: [TranslatePipe, DatePipe, OccupancyChart],
  templateUrl: './tenant-detail-tab.html'
})
export class TenantDetailTab {
  data = input<any>();
  private tabManager = inject(InternalTabManagerService);
  private tenantsService = inject(TenantsService);

  activeSubTab = signal('contracts');
  isLoading = signal(false);
  
  tenant = signal<TenantDetail | null>(null);
  payments = signal<TenantPayment[]>([]);
  contracts = signal<Contract[]>([]);
  paymentStats = signal<TenantPaymentStats | null>(null);

  subTabs = [
    { id: 'contracts', label: 'TENANT.SUB_TABS.CONTRACTS', icon: 'ph-file-text' },
    { id: 'payment-history', label: 'TENANT.SUB_TABS.PAYMENT_HISTORY', icon: 'ph-currency-eur' },
    { id: 'documents', label: 'TENANT.SUB_TABS.DOCUMENTS', icon: 'ph-folder' },
  ];

  constructor() {
    effect(() => {
      const tabData = this.data();
      console.log('🔍 TenantDetailTab data:', tabData);
      if (tabData?.tenantId) {
        console.log('✅ Loading tenant:', tabData.tenantId);
        this.loadTenant(tabData.tenantId);
      } else {
        console.warn('⚠️ No tenantId found in data');
      }
    });
  }

  private loadTenant(id: string) {
    this.isLoading.set(true);
    
    // Load tenant details
    this.tenantsService.getTenant(id).subscribe({
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

    // Load payments
    this.tenantsService.getTenantPayments(id).subscribe({
      next: (payments) => {
        this.payments.set(payments);
        console.log('✅ Tenant payments loaded:', payments.length);
      },
      error: (err) => console.error('❌ Error loading tenant payments:', err)
    });

    // Load contracts
    this.tenantsService.getTenantContracts(id).subscribe({
      next: (contracts) => {
        this.contracts.set(contracts);
        console.log('✅ Tenant contracts loaded:', contracts.length);
      },
      error: (err) => console.error('❌ Error loading tenant contracts:', err)
    });

    // Load payment stats
    this.tenantsService.getPaymentStats(id).subscribe({
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

  openPropertyTab(contract: Contract) {
    // Extract property ID from contract if available
    // Assuming contract has propertyId field or we need to navigate based on contract data
    alert('Ouvrir property - À implémenter avec propertyId du contract');
  }
}
