import { Component, input, signal, computed, inject } from '@angular/core';
import { DatePipe, NgClass } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { PropertyDetail, Contract } from '../../../../core/api/properties.api';
import { TenantListItem } from '../../../../core/api/tenants.api';
import { PropertiesService } from '../../../../core/services/properties.service';
import { InternalTabManagerService } from '../../../../core/services/internal-tab-manager.service';
import { TenantsService } from '../../../../core/services/tenants.service';

interface TenantWithContract {
  tenant: TenantListItem;
  contract: Contract;
  room?: string;
  isFutureOccupant: boolean;
  statusLabel: string;
  statusColor: string;
  arrivalDate?: string;
  daysUntilArrival?: number;
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
  private tenantsService = inject(TenantsService);
  private tabManager = inject(InternalTabManagerService);
  
  isLoading = signal(false);
  showActions = signal(false);
  viewMode = signal<'cards' | 'list'>('cards'); // Par défaut: cards
  
  // Computed properties
  // ✅ CORRECTION: Filtrer uniquement Signed + Active (pas Draft, Expired, Cancelled)
  currentTenants = computed(() => {
    const validContracts = this.contracts().filter(c => 
      c.status === 'Signed' || c.status === 'Active'
    );
    
    return validContracts.map(contract => {
      const tenant = this.associatedTenants().find(t => t.id === contract.tenantId);
      const isFutureOccupant = contract.status === 'Signed';
      const startDate = new Date(contract.startDate);
      const today = new Date();
      const daysUntilArrival = isFutureOccupant 
        ? Math.ceil((startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        : 0;
      
      return {
        tenant: tenant || { 
          id: contract.tenantId, 
          fullName: contract.tenantName || 'Inconnu', 
          code: '', 
          email: '',
          phone: '',
          status: contract.status === 'Signed' ? 'Reserved' : 'Active' 
        },
        contract,
        room: this.getRoomFromContract(contract),
        isFutureOccupant,
        statusLabel: isFutureOccupant ? 'Futur occupant' : 'Occupant actuel',
        statusColor: isFutureOccupant ? 'blue' : 'emerald',
        arrivalDate: isFutureOccupant ? this.formatDate(contract.startDate) : undefined,
        daysUntilArrival: isFutureOccupant ? daysUntilArrival : undefined
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
    // ✅ Passer les infos du bien pour afficher le badge d'association
    this.tabManager.openTenant(tenant.id, tenant.fullName || 'Locataire', {
      fromProperty: {
        id: this.property().id,
        code: this.property().code,
        name: this.property().name
      }
    });
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
  
  toggleViewMode() {
    this.viewMode.set(this.viewMode() === 'cards' ? 'list' : 'cards');
  }
  
  async dissociateTenant(tenant: TenantListItem, propertyId: string) {
    const confirmed = confirm(
      `Êtes-vous sûr de vouloir dissocier ${tenant.fullName} de ce bien ?\n\n` +
      `⚠️ Attention : Cette action ne supprime pas le contrat, elle retire seulement l'association directe.\n` +
      `Le locataire restera lié via son contrat.`
    );
    
    if (!confirmed) return;
    
    this.isLoading.set(true);
    try {
      await this.propertiesService.dissociateTenant(propertyId, tenant.id);
      // Recharger les données
      window.location.reload(); // TODO: Améliorer avec un refresh propre
    } catch (error) {
      console.error('Error dissociating tenant:', error);
      alert('Erreur lors de la dissociation du locataire');
    } finally {
      this.isLoading.set(false);
    }
  }
  
  getTenantStatus(contract: Contract): { label: string; color: string } {
    if (contract.status === 'Signed') {
      return { label: 'Futur occupant', color: 'blue' };
    }
    
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
  
  private getRoomFromContract(contract: Contract): string | undefined {
    // Récupérer la chambre depuis le contrat (colocation individuelle)
    if (contract.roomId) {
      return `Chambre ${contract.roomId}`;
    }
    return undefined;
  }
  
  getDaysUntilExpiration(contract: Contract): number {
    const endDate = new Date(contract.endDate);
    const today = new Date();
    return Math.floor((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }
  
  needsInventoryEntry(contract: Contract): boolean {
    // TODO: Vérifier si EDL entrée existe via API
    return contract.status === 'Signed' || contract.status === 'Active';
  }
  
  needsInventoryExit(contract: Contract): boolean {
    // TODO: Vérifier si EDL sortie nécessaire
    const daysUntilEnd = this.getDaysUntilExpiration(contract);
    return contract.status === 'Active' && daysUntilEnd <= 30;
  }
}
