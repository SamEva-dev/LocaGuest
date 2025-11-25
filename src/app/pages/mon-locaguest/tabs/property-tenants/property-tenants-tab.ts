import { Component, input, signal, computed, inject, output } from '@angular/core';
import { DatePipe, NgClass } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { PropertyDetail, Contract } from '../../../../core/api/properties.api';
import { TenantListItem } from '../../../../core/api/tenants.api';
import { PropertiesService } from '../../../../core/services/properties.service';
import { InternalTabManagerService } from '../../../../core/services/internal-tab-manager.service';

interface TenantWithContract {
  tenant: TenantListItem;
  contract: Contract;
  room?: string;
}

@Component({
  selector: 'property-tenants-tab',
  standalone: true,
  imports: [NgClass, DatePipe, TranslatePipe],
  templateUrl: './property-tenants-tab.html'
})
export class PropertyTenantsTab {
  property = input.required<PropertyDetail>();
  contracts = input<Contract[]>([]);
  associatedTenants = input<TenantListItem[]>([]);
  
  private propertiesService = inject(PropertiesService);
  private tabManager = inject(InternalTabManagerService);
  
  isLoading = signal(false);
  showActions = signal(false);
  
  // Computed properties
  currentTenants = computed(() => {
    const activeContracts = this.contracts().filter(c => 
      c.status === 'Active' && new Date(c.endDate) > new Date()
    );
    
    return activeContracts.map(contract => {
      const tenant = this.associatedTenants().find(t => t.id === contract.tenantId);
      return {
        tenant: tenant || { id: contract.tenantId, fullName: contract.tenantName || 'Inconnu', code: '', status: 'Active' },
        contract,
        room: this.getRoomForTenant(contract.tenantId)
      } as TenantWithContract;
    });
  });
  
  historicalTenants = computed(() => {
    const pastContracts = this.contracts().filter(c => 
      c.status === 'Terminated' || new Date(c.endDate) <= new Date()
    );
    
    return pastContracts.map(contract => {
      const tenant = this.associatedTenants().find(t => t.id === contract.tenantId);
      return {
        tenant: tenant || { id: contract.tenantId, fullName: contract.tenantName || 'Inconnu', code: '', status: 'Inactive' },
        contract
      } as TenantWithContract;
    });
  });
  
  isColocation = computed(() => {
    return this.property()?.propertyUsageType?.toLowerCase() === 'colocation';
  });
  
  hasActiveTenants = computed(() => {
    return this.currentTenants().length > 0;
  });
  
  // Actions
  openTenantDetail(tenant: TenantListItem) {
    if (!tenant.id) return;
    this.tabManager.openTenant(tenant.id, tenant.fullName || 'Locataire');
  }
  
  openContractDetail(contract: Contract) {
    console.log('Open contract:', contract.id);
    // TODO: Implement contract detail view
  }
  
  createContract() {
    // TODO: Open contract creation wizard with pre-selected property
    console.log('Create contract for property:', this.property().id);
  }
  
  addPaperContract() {
    // TODO: Open paper contract entry form
    console.log('Add paper contract');
  }
  
  generateContract() {
    // TODO: Open contract generation wizard
    console.log('Generate contract');
  }
  
  viewInventory() {
    // TODO: Open inventory view
    console.log('View inventory');
  }
  
  getTenantStatus(contract: Contract): { label: string; color: string } {
    const endDate = new Date(contract.endDate);
    const today = new Date();
    const daysUntilEnd = Math.floor((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (contract.status === 'Terminated') {
      return { label: 'Parti', color: 'slate' };
    }
    
    if (daysUntilEnd <= 0) {
      return { label: 'Parti', color: 'slate' };
    }
    
    if (daysUntilEnd <= 60) {
      return { label: 'Préavis', color: 'orange' };
    }
    
    return { label: 'Actif', color: 'emerald' };
  }
  
  getInitials(name: string): string {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }
  
  formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
  
  private getRoomForTenant(tenantId: string): string | undefined {
    // TODO: Implement room assignment logic for colocation
    // This would typically come from contract metadata
    return undefined;
  }
}
