import { Component, input, signal, inject, effect, viewChild } from '@angular/core';
import { DatePipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { InternalTabManagerService } from '../../../../core/services/internal-tab-manager.service';
import { RevenueChart } from '../../../../components/charts/revenue-chart/revenue-chart';
import { PropertyDetail, Payment, Contract, FinancialSummary, CreateContractDto } from '../../../../core/api/properties.api';
import { PropertiesService } from '../../../../core/services/properties.service';
import { TenantSelectionModal, TenantSelectionResult } from '../../components/tenant-selection-modal/tenant-selection-modal';

@Component({
  selector: 'property-detail-tab',
  standalone: true,
  imports: [TranslatePipe, DatePipe, RevenueChart, TenantSelectionModal],
  templateUrl: './property-detail-tab.html'
})
export class PropertyDetailTab {
  data = input<any>();
  private tabManager = inject(InternalTabManagerService);
  private propertiesService = inject(PropertiesService);
  
  tenantModal = viewChild<TenantSelectionModal>('tenantModal');

  activeSubTab = signal('overview');
  isLoading = signal(false);
  
  property = signal<PropertyDetail | null>(null);
  payments = signal<Payment[]>([]);
  recentPayments = signal<Payment[]>([]);
  contracts = signal<Contract[]>([]);
  financialSummary = signal<FinancialSummary | null>(null);
  
  showTenantModal = signal(false);
  availableTenants = signal<any[]>([]);

  subTabs = [
    { id: 'overview', label: 'PROPERTY.SUB_TABS.OVERVIEW', icon: 'ph-house' },
    { id: 'tenants', label: 'PROPERTY.SUB_TABS.TENANTS', icon: 'ph-users-three' },
    { id: 'contracts', label: 'PROPERTY.SUB_TABS.CONTRACTS', icon: 'ph-file-text' },
    { id: 'documents', label: 'PROPERTY.SUB_TABS.DOCUMENTS', icon: 'ph-folder' },
    { id: 'payments', label: 'PROPERTY.SUB_TABS.PAYMENTS', icon: 'ph-currency-eur' },
    { id: 'projection', label: 'PROPERTY.SUB_TABS.PROJECTION', icon: 'ph-chart-line-up' },
  ];

  constructor() {
    effect(() => {
      const tabData = this.data();
      console.log('🔍 PropertyDetailTab data:', tabData);
      if (tabData?.propertyId) {
        console.log('✅ Loading property:', tabData.propertyId);
        this.loadProperty(tabData.propertyId);
      } else {
        console.warn('⚠️ No propertyId found in data');
      }
    });
  }

  private loadProperty(id: string) {
    this.isLoading.set(true);
    
    // Load property details
    this.propertiesService.getProperty(id).subscribe({
      next: (property) => {
        this.property.set(property);
        this.isLoading.set(false);
        console.log('✅ Property loaded:', property.name);
      },
      error: (err) => {
        console.error('❌ Error loading property:', err);
        this.isLoading.set(false);
      }
    });

    // Load payments
    this.propertiesService.getPropertyPayments(id).subscribe({
      next: (payments) => {
        this.payments.set(payments);
        this.recentPayments.set(payments.slice(0, 3));
        console.log('✅ Payments loaded:', payments.length);
      },
      error: (err) => console.error('❌ Error loading payments:', err)
    });

    // Load contracts
    this.propertiesService.getPropertyContracts(id).subscribe({
      next: (contracts) => {
        this.contracts.set(contracts);
        console.log('✅ Contracts loaded:', contracts.length);
      },
      error: (err) => console.error('❌ Error loading contracts:', err)
    });

    // Load financial summary
    this.propertiesService.getFinancialSummary(id).subscribe({
      next: (summary) => {
        this.financialSummary.set(summary);
        console.log('✅ Financial summary loaded', summary);
      },
      error: (err) => console.error('❌ Error loading financial summary:', err)
    });
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  addTenant() {
    const propertyId = this.data()?.propertyId;
    if (!propertyId) {
      console.error('⚠️ No propertyId available');
      return;
    }

    console.log('🔍 Loading available tenants for property:', propertyId);
    this.propertiesService.getAvailableTenants(propertyId).subscribe({
      next: (tenants: any) => {
        console.log('✅ Available tenants loaded:', tenants.length);
        this.availableTenants.set(tenants);
        this.showTenantModal.set(true);
        
        // Passer les locataires au modal après rendu
        setTimeout(() => {
          const modal = this.tenantModal();
          if (modal) {
            modal.setTenants(tenants);
          }
        }, 0);
      },
      error: (err: any) => {
        console.error('❌ Error loading available tenants:', err);
        alert('Erreur lors du chargement des locataires disponibles');
      }
    });
  }

  closeTenantModal() {
    this.showTenantModal.set(false);
  }

  onTenantAssigned(result: TenantSelectionResult) {
    const propertyId = this.data()?.propertyId;
    if (!propertyId) return;

    const contractDto: CreateContractDto = {
      propertyId,
      tenantId: result.tenantId,
      type: result.type,
      startDate: result.startDate,
      endDate: result.endDate,
      rent: result.rent,
      deposit: result.deposit
    };

    console.log('🔄 Assigning tenant to property:', contractDto);
    this.propertiesService.assignTenant(propertyId, contractDto).subscribe({
      next: (contract: any) => {
        console.log('✅ Tenant assigned successfully:', contract);
        this.showTenantModal.set(false);
        // Recharger les contrats
        this.loadProperty(propertyId);
        alert(`Locataire ${result.tenantName} associé avec succès !`);
      },
      error: (err: any) => {
        console.error('❌ Error assigning tenant:', err);
        alert('Erreur lors de l\'association du locataire');
      }
    });
  }

  openTenantTab(contract: Contract) {
    if (contract.tenantId) {
      this.tabManager.openTenant(contract.tenantId, contract.tenantName || 'Tenant');
    }
  }
}
