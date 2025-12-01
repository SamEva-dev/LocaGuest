import { Component, input, output, signal, computed, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { PropertyDetail, Contract } from '../../../../core/api/properties.api';
import { TenantListItem } from '../../../../core/api/tenants.api';
import { PropertiesService } from '../../../../core/services/properties.service';
import { InternalTabManagerService } from '../../../../core/services/internal-tab-manager.service';
import { TenantsService } from '../../../../core/services/tenants.service';
import { ToastService } from '../../../../core/ui/toast.service';
import { ConfirmService } from '../../../../core/ui/confirm.service';
import { 
  InventoryEntryWizardSimpleComponent, 
  InventoryEntryWizardData 
} from '../property-contracts/inventory-entry-wizard/inventory-entry-wizard-simple';
import { 
  InventoryExitWizardSimpleComponent, 
  InventoryExitWizardData 
} from '../property-contracts/inventory-exit-wizard/inventory-exit-wizard-simple';

interface TenantWithContract {
  tenant: TenantListItem;
  contract: Contract;
  room?: string;
  isFutureOccupant: boolean;
  statusLabel: string;
  statusColor: string;
  arrivalDate?: string;
  daysUntilArrival?: number;
  
  // Infos enrichies
  isInNotice: boolean;           // En préavis
  noticeEndLabel?: string;       // "Quitte le JJ/MM/AAAA"
  fileStatusLabel: string;       // "Dossier complet" | "Pièces manquantes" | etc.
  fileStatusColor: string;       // emerald | orange | red
  hasPaymentIssues: boolean;     // A des impayés
  arrearsLabel?: string;         // "Retard : 250 €"
  lastPaymentLabel?: string;     // "Dernier paiement : 05/11 – 950 €"
  contractTypeLabel?: string;    // "Meublé" | "Vide" | etc.
  paymentStatus: { label: string; color: string; icon: string; daysInfo?: string };
}

@Component({
  selector: 'property-tenants-tab',
  standalone: true,
  imports: [
    DecimalPipe,
    InventoryEntryWizardSimpleComponent,
    InventoryExitWizardSimpleComponent
  ],
  templateUrl: './property-tenants-tab.html'
})
export class PropertyTenantsTab {
  property = input.required<PropertyDetail>();
  contracts = input<Contract[]>([]);
  associatedTenants = input<TenantListItem[]>([]);
  
  // ✅ Event pour demander au parent de recharger les données
  onRefreshNeeded = output<void>();
  
  private propertiesService = inject(PropertiesService);
  private tenantsService = inject(TenantsService);
  private tabManager = inject(InternalTabManagerService);
  
  private toasts = inject(ToastService);
  private confirmService = inject(ConfirmService);
  
  isLoading = signal(false);
  showActions = signal(false);
  viewMode = signal<'cards' | 'list'>('cards'); // Par défaut: cards
  
  // Wizards EDL
  showInventoryEntryWizard = signal(false);
  showInventoryExitWizard = signal(false);
  inventoryEntryData = signal<InventoryEntryWizardData | null>(null);
  inventoryExitData = signal<InventoryExitWizardData | null>(null);
  
  // Computed properties
  // ✅ CORRECTION: Filtrer uniquement Signed + Active (pas Draft, Expired, Cancelled)
  currentTenants = computed(() => {
    const validContracts = this.contracts().filter(c => 
      c.status === 'Signed' || c.status === 'Active'
    );
    
    return validContracts.map(contract => {
      const tenant = this.associatedTenants().find(t => t.id === contract.tenantId);
      const tenantData: TenantListItem = tenant || { 
        id: contract.tenantId, 
        fullName: contract.tenantName || 'Inconnu', 
        code: '', 
        email: '',
        phone: '',
        status: contract.status === 'Signed' ? 'Reserved' : 'Active',
        activeContracts: 1
      };
      
      const isFutureOccupant = contract.status === 'Signed';
      const startDate = new Date(contract.startDate);
      const today = new Date();
      const daysUntilArrival = isFutureOccupant 
        ? Math.ceil((startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        : 0;
      
      // Calculs enrichis
      const isInNotice = this.isInNotice(contract);
      const fileStatus = this.getFileStatus(tenantData, contract);
      const hasPaymentIssues = (contract.totalArrears || 0) > 0;
      const paymentStatus = this.getPaymentStatus(contract);
      
      return {
        tenant: tenantData,
        contract,
        room: this.getRoomFromContract(contract),
        isFutureOccupant,
        statusLabel: isFutureOccupant ? 'Futur occupant' : 'Occupant actuel',
        statusColor: isFutureOccupant ? 'blue' : 'emerald',
        arrivalDate: isFutureOccupant ? this.formatDate(contract.startDate) : undefined,
        daysUntilArrival: isFutureOccupant ? daysUntilArrival : undefined,
        
        // Infos enrichies
        isInNotice,
        noticeEndLabel: this.getNoticeLabel(contract),
        fileStatusLabel: fileStatus.label,
        fileStatusColor: fileStatus.color,
        hasPaymentIssues,
        arrearsLabel: this.getArrearsLabel(contract),
        lastPaymentLabel: this.getLastPaymentLabel(contract),
        contractTypeLabel: this.getContractTypeLabel(contract.contractType),
        paymentStatus
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
    return this.property()?.propertyUsageType.toLowerCase() === 'colocation';
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
  
  // ✅ Ouvrir wizard EDL d'entrée
  openInventoryEntry(contract: Contract) {
    const property = this.property();
    const tenant = this.associatedTenants().find(t => t.id === contract.tenantId);
    
    this.inventoryEntryData.set({
      contractId: contract.id,
      propertyId: property.id,
      propertyName: property.name,
      roomId: contract.roomId,
      roomName: contract.roomId ? `Chambre ${contract.roomId}` : undefined,
      tenantName: tenant?.fullName || contract.tenantName || 'Inconnu'
    });
    
    this.showInventoryEntryWizard.set(true);
  }
  
  // ✅ Ouvrir wizard EDL de sortie
  async openInventoryExit(contract: Contract) {
    const property = this.property();
    const tenant = this.associatedTenants().find(t => t.id === contract.tenantId);
    
    // Récupérer l'EDL d'entrée depuis le contrat
    // Supposons que contract.inventoryEntryId existe
    const inventoryEntryId = (contract as any).inventoryEntryId;
    
    if (!inventoryEntryId) {
      this.toasts.errorDirect('Erreur: Aucun EDL d\'entrée trouvé pour ce contrat.\n\nVous devez d\'abord créer un EDL d\'entrée.');
      return;
    }
    
    this.inventoryExitData.set({
      contractId: contract.id,
      propertyId: property.id,
      propertyName: property.name,
      roomId: contract.roomId,
      roomName: contract.roomId ? `Chambre ${contract.roomId}` : undefined,
      tenantName: tenant?.fullName || contract.tenantName || 'Inconnu',
      inventoryEntryId: inventoryEntryId
    });
    
    this.showInventoryExitWizard.set(true);
  }
  
  // ✅ Fermer les wizards
  closeInventoryWizards() {
    this.showInventoryEntryWizard.set(false);
    this.showInventoryExitWizard.set(false);
    this.inventoryEntryData.set(null);
    this.inventoryExitData.set(null);
    
    // ✅ Demander au parent de recharger les données (évite window.location.reload())
    this.onRefreshNeeded.emit();
  }
  
  createAmendment(contract: Contract) {
    // TODO: Open amendment creation modal
    console.log('Create amendment for contract:', contract.code);
    this.toasts.infoDirect(`Création d'avenant pour le contrat ${contract.code}\n\nFonctionnalité en développement.`);
  }
  
  renewContract(contract: Contract) {
    // TODO: Open contract renewal modal
    console.log('Renew contract:', contract.code);
    this.toasts.infoDirect(`Renouvellement du bail ${contract.code}\n\nFonctionnalité en développement.`);
  }
  
  toggleViewMode() {
    this.viewMode.set(this.viewMode() === 'cards' ? 'list' : 'cards');
  }
  
  async dissociateTenant(item: TenantWithContract, propertyId: string) {
    // ✅ Vérification: bloquer si contrat encore actif/signé
    if (!this.canDissociate(item.contract)) {
      this.toasts.warningDirect(
        `Dissociation impossible\n\nVous ne pouvez pas dissocier ${item.tenant.fullName} de ce bien tant que :\n• Le bail est encore Signé ou Actif\n• Des documents sont associés\n\nProcédure : Terminez/Annulez d'abord le contrat.`
      );
      return;
    }
    
    const confirmed = await this.confirmService.warning(
      'Dissocier le locataire',
      `Êtes-vous sûr de vouloir dissocier ${item.tenant.fullName} de ce bien ?\n\n⚠️ Attention : Cette action ne supprime pas le contrat, elle retire seulement l'association directe.\nLe locataire restera lié via son contrat.`
    );
    if (!confirmed) return;
    
    this.isLoading.set(true);
    try {
      await this.propertiesService.dissociateTenant(propertyId, item.tenant.id);
      // ✅ Recharger les données via événement au lieu de window.location.reload()
      this.onRefreshNeeded.emit();
    } catch (error) {
      console.error('Error dissociating tenant:', error);
      this.toasts.errorDirect('Erreur lors de la dissociation du locataire');
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
  
  // ✅ Validation EDL Entrée
  needsInventoryEntry(contract: Contract): boolean {
    // EDL entrée si contrat Signé et pas encore réalisé
    return contract.status === 'Signed' && !contract.hasInventoryEntry;
  }
  
  // ✅ Validation EDL Sortie
  needsInventoryExit(contract: Contract): boolean {
    // EDL sortie si contrat actif, proche de la fin ou en préavis, et pas encore réalisé
    if (contract.hasInventoryExit) return false;
    if (contract.status !== 'Active') return false;
    
    // Si en préavis
    if (contract.noticeEndDate) return true;
    
    // Si moins de 30 jours avant la fin
    const daysUntilEnd = this.getDaysUntilExpiration(contract);
    return daysUntilEnd <= 30 && daysUntilEnd > 0;
  }
  
  // ✅ Vérification si dissociation autorisée
  canDissociate(contract: Contract): boolean {
    // Interdit si contrat encore Signed ou Active
    return contract.status !== 'Signed' && contract.status !== 'Active';
  }
  
  // Helper pour obtenir le label du type de contrat
  getContractTypeLabel(type?: string): string {
    if (!type) return '';
    const labels: Record<string, string> = {
      'meuble': 'Meublé',
      'vide': 'Vide',
      'etudiant': 'Étudiant',
      'mobilite': 'Mobilité',
      'colocation_solidaire': 'Colocation solidaire',
      'colocation_individual': 'Colocation individuelle'
    };
    return labels[type.toLowerCase()] || type;
  }
  
  // Helper pour détecter si en préavis
  isInNotice(contract: Contract): boolean {
    return !!contract.noticeEndDate && new Date(contract.noticeEndDate) > new Date();
  }
  
  // Helper pour formater le label de préavis
  getNoticeLabel(contract: Contract): string | undefined {
    if (!contract.noticeEndDate) return undefined;
    return `Quitte le ${this.formatDate(contract.noticeEndDate)}`;
  }
  
  // ✅ Helper pour le statut du dossier (RÈGLE: 1 contrat signé + EDL entrée + CNI)
  getFileStatus(tenant: TenantListItem, contract: Contract): { label: string; color: string; details: string[] } {
    const missing: string[] = [];
    
    // 1. Vérifier contrat signé
    if (contract.status !== 'Signed' && contract.status !== 'Active') {
      missing.push('Contrat signé');
    }
    
    // 2. Vérifier EDL entrée
    if (!contract.hasInventoryEntry) {
      missing.push('EDL entrée');
    }
    
    // 3. Vérifier CNI
    if (!tenant.idNumber) {
      missing.push('CNI');
    }
    
    // 4. Vérifier assurance (optionnel mais important)
    if (tenant.hasInsurance === false) {
      missing.push('Assurance');
    }
    
    if (tenant.insuranceExpiryDate) {
      const expiry = new Date(tenant.insuranceExpiryDate);
      const today = new Date();
      const daysUntilExpiry = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilExpiry <= 0) {
        missing.push('Assurance expirée');
      } else if (daysUntilExpiry <= 30) {
        missing.push('Assurance expire bientôt');
      }
    }
    
    if (missing.length === 0) {
      return { label: 'Complet', color: 'emerald', details: [] };
    }
    
    return { 
      label: 'Incomplet', 
      color: 'red', 
      details: missing 
    };
  }
  
  // ✅ Helper pour le statut de paiement avec badge
  getPaymentStatus(contract: Contract): { label: string; color: string; icon: string; daysInfo?: string } {
    // Si pas de données de paiement
    if (!contract.lastPaymentDate) {
      return {
        label: 'En attente',
        color: 'orange',
        icon: 'ph-clock'
      };
    }
    
    // Si retard
    if (contract.totalArrears && contract.totalArrears > 0) {
      const today = new Date();
      const lastPayment = new Date(contract.lastPaymentDate);
      const daysSincePayment = Math.floor((today.getTime() - lastPayment.getTime()) / (1000 * 60 * 60 * 24));
      
      return {
        label: 'En retard',
        color: 'red',
        icon: 'ph-warning-circle',
        daysInfo: `${daysSincePayment}j`
      };
    }
    
    // Vérifier si le paiement du mois est fait
    const lastPayment = new Date(contract.lastPaymentDate);
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const paymentMonth = lastPayment.getMonth();
    const paymentYear = lastPayment.getFullYear();
    
    if (paymentYear === currentYear && paymentMonth === currentMonth) {
      return {
        label: 'Payé',
        color: 'emerald',
        icon: 'ph-check-circle'
      };
    }
    
    // Paiement pas encore fait ce mois
    const daysSincePayment = Math.floor((today.getTime() - lastPayment.getTime()) / (1000 * 60 * 60 * 24));
    return {
      label: 'En attente',
      color: 'orange',
      icon: 'ph-clock',
      daysInfo: `${daysSincePayment}j`
    };
  }
  
  // Helper pour les impayés
  getArrearsLabel(contract: Contract): string | undefined {
    if (!contract.totalArrears || contract.totalArrears <= 0) return undefined;
    return `Retard : ${contract.totalArrears.toFixed(2)} €`;
  }
  
  // Helper pour le dernier paiement
  getLastPaymentLabel(contract: Contract): string | undefined {
    if (!contract.lastPaymentDate || !contract.lastPaymentAmount) return undefined;
    const date = new Date(contract.lastPaymentDate).toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: '2-digit' 
    });
    return `Dernier paiement : ${date} – ${contract.lastPaymentAmount.toFixed(2)} €`;
  }
  
  // Helper pour l'icône du moyen de paiement
  getPaymentMethodIcon(method?: string): string {
    if (!method) return 'ph-currency-eur';
    const icons: Record<string, string> = {
      'virement': 'ph-bank',
      'prelevement': 'ph-repeat',
      'carte': 'ph-credit-card',
      'especes': 'ph-money'
    };
    return icons[method.toLowerCase()] || 'ph-currency-eur';
  }
}
