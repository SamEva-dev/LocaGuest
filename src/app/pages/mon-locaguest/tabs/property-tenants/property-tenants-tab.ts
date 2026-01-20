import { Component, input, output, signal, computed, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { PropertyDetail, Contract } from '../../../../core/api/properties.api';
import { TenantListItem } from '../../../../core/api/tenants.api';
import { PropertiesService } from '../../../../core/services/properties.service';
import { InternalTabManagerService } from '../../../../core/services/internal-tab-manager.service';
import { TenantsService } from '../../../../core/services/tenants.service';
import { ToastService } from '../../../../core/ui/toast.service';
import { ConfirmService } from '../../../../core/ui/confirm.service';
import { TranslateService } from '@ngx-translate/core';
import { AvatarStorageService } from '../../../../core/services/avatar-storage.service';
import { 
  InventoryEntryWizardSimpleComponent, 
  InventoryEntryWizardData 
} from '../property-contracts/inventory-entry-wizard/inventory-entry-wizard-simple';
import { 
  InventoryExitWizardSimpleComponent, 
  InventoryExitWizardData 
} from '../property-contracts/inventory-exit-wizard/inventory-exit-wizard-simple';
import {
  ContractRenewalWizard,
  ContractRenewalData
} from '../property-contracts/contract-renewal-wizard/contract-renewal-wizard';
import {
  ContractAddendumWizard,
  ContractAddendumData
} from '../property-contracts/contract-addendum-wizard/contract-addendum-wizard';

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
    InventoryExitWizardSimpleComponent,
    ContractRenewalWizard,
    ContractAddendumWizard
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
  private translate = inject(TranslateService);
  private avatarStorage = inject(AvatarStorageService);
  
  isLoading = signal(false);
  showActions = signal(false);
  viewMode = signal<'cards' | 'list'>('cards'); // Par défaut: cards
  
  // Wizards EDL
  showInventoryEntryWizard = signal(false);
  showInventoryExitWizard = signal(false);
  inventoryEntryData = signal<InventoryEntryWizardData | null>(null);
  inventoryExitData = signal<InventoryExitWizardData | null>(null);
  
  // Wizard Renouvellement
  showRenewalWizard = signal(false);
  renewalWizardData = signal<any | null>(null);
  
  // Wizard Avenant
  showAddendumWizard = signal(false);
  addendumWizardData = signal<any | null>(null);
  
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
        fullName: contract.tenantName || this.translate.instant('COMMON.UNKNOWN'), 
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
        statusLabel: isFutureOccupant
          ? this.translate.instant('PROPERTY_TENANTS.STATUS.FUTURE_OCCUPANT')
          : this.translate.instant('PROPERTY_TENANTS.STATUS.CURRENT_OCCUPANT'),
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
        tenant: tenant || { id: contract.tenantId, fullName: contract.tenantName || this.translate.instant('COMMON.UNKNOWN'), code: '', status: 'Inactive' },
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
    this.tabManager.openTenant(tenant.id, tenant.fullName || this.translate.instant('COMMON.TENANT'), {
      fromProperty: {
        id: this.property().id,
        code: this.property().code,
        name: this.property().name
      }
    });
  }
  
  // ✅ NOUVEAU: Voir l'EDL entrée (naviguer vers onglet documents)
  viewInventoryEntry(tenant: TenantListItem) {
    if (!tenant.id) return;
    // Ouvrir l'onglet locataire avec focus sur l'onglet documents
    this.tabManager.openTenant(tenant.id, tenant.fullName || this.translate.instant('COMMON.TENANT'), {
      initialTab: 'documents',
      fromProperty: {
        id: this.property().id,
        code: this.property().code,
        name: this.property().name
      }
    });
  }
  
  // ✅ NOUVEAU: Voir l'EDL sortie (naviguer vers onglet documents)
  viewInventoryExit(tenant: TenantListItem) {
    if (!tenant.id) return;
    // Ouvrir l'onglet locataire avec focus sur l'onglet documents
    this.tabManager.openTenant(tenant.id, tenant.fullName || this.translate.instant('COMMON.TENANT'), {
      initialTab: 'documents',
      fromProperty: {
        id: this.property().id,
        code: this.property().code,
        name: this.property().name
      }
    });
  }
  
  openContractDetail(contract: Contract) {
    // TODO: Implement contract detail view
  }
  
  createContract() {
    // TODO: Open contract creation wizard with pre-selected property
  }
  
  addPaperContract() {
    // TODO: Open paper contract entry form
  }
  
  generateContract() {
    // TODO: Open contract generation wizard
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
      roomName: contract.roomId ? this.translate.instant('COMMON.ROOM', { number: contract.roomId }) : undefined,
      tenantName: tenant?.fullName || contract.tenantName || this.translate.instant('COMMON.UNKNOWN')
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
      this.toasts.error('PROPERTY_TENANTS.INVENTORY.EXIT.MISSING_ENTRY');
      return;
    }
    
    this.inventoryExitData.set({
      contractId: contract.id,
      propertyId: property.id,
      propertyName: property.name,
      roomId: contract.roomId,
      roomName: contract.roomId ? this.translate.instant('COMMON.ROOM', { number: contract.roomId }) : undefined,
      tenantName: tenant?.fullName || contract.tenantName || this.translate.instant('COMMON.UNKNOWN'),
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
    this.toasts.info('PROPERTY_TENANTS.ADDENDUM.IN_PROGRESS');
  }
  
  renewContract(contract: Contract) {
    // Trouver le locataire correspondant au contrat
    const tenantItem = this.currentTenants().find(t => t.contract.id === contract.id);
    
    if (!tenantItem) {
      this.toasts.error('PROPERTY_TENANTS.ERRORS.TENANT_NOT_FOUND');
      return;
    }
    
    // Préparer les données pour le wizard
    const renewalData = {
      contract: contract,
      propertyName: this.property().name,
      tenantName: tenantItem.tenant.fullName || this.translate.instant('COMMON.TENANT'),
      roomName: tenantItem.room
    };
    
    // Stocker les données dans un signal temporaire pour le wizard
    this.renewalWizardData.set(renewalData);
    this.showRenewalWizard.set(true);
  }
  
  onRenewalCompleted(newContractId: string) {
    this.showRenewalWizard.set(false);
    this.renewalWizardData.set(null);
    this.toasts.success('PROPERTY_TENANTS.RENEWAL.SUCCESS');
    // Recharger les données
    this.onRefreshNeeded.emit();
  }
  
  onRenewalCancelled() {
    this.showRenewalWizard.set(false);
    this.renewalWizardData.set(null);
  }
  
  // ========== GESTION AVENANT ==========
  
  createAddendum(contract: Contract) {
    // Vérifier que le contrat peut avoir un avenant
    if (contract.status !== 'Active' && contract.status !== 'Signed') {
      this.toasts.warning('PROPERTY_TENANTS.ADDENDUM.ONLY_ACTIVE_OR_SIGNED');
      return;
    }
    
    // Trouver le locataire associé
    const tenantItem = this.currentTenants().find(t => t.contract.id === contract.id);
    
    if (!tenantItem) {
      this.toasts.error('PROPERTY_TENANTS.ERRORS.TENANT_NOT_FOUND');
      return;
    }
    
    // Préparer les données pour le wizard
    const addendumData: ContractAddendumData = {
      contract: contract,
      propertyName: this.property().name,
      tenantName: tenantItem.tenant.fullName || this.translate.instant('COMMON.TENANT'),
      roomName: tenantItem.room,
      availableRooms: (this.property().rooms || []).filter(r => r.status === 'Available')
    };
    
    this.addendumWizardData.set(addendumData);
    this.showAddendumWizard.set(true);
  }
  
  onAddendumCompleted(addendumId: string) {
    this.showAddendumWizard.set(false);
    this.addendumWizardData.set(null);
    this.toasts.success('PROPERTY_TENANTS.ADDENDUM.SUCCESS');
    // Recharger les données
    this.onRefreshNeeded.emit();
  }
  
  onAddendumCancelled() {
    this.showAddendumWizard.set(false);
    this.addendumWizardData.set(null);
  }
  
  toggleViewMode() {
    this.viewMode.set(this.viewMode() === 'cards' ? 'list' : 'cards');
  }
  
  async dissociateTenant(item: TenantWithContract, propertyId: string) {
    // ✅ Vérification: bloquer si contrat encore actif/signé
    if (!this.canDissociate(item.contract)) {
      this.toasts.warningDirect(
        this.translate.instant('PROPERTY_TENANTS.DISSOCIATE.BLOCKED', { tenantName: item.tenant.fullName })
      );
      return;
    }
    
    const confirmed = await this.confirmService.warning(
      this.translate.instant('PROPERTY_TENANTS.DISSOCIATE.TITLE'),
      this.translate.instant('PROPERTY_TENANTS.DISSOCIATE.MESSAGE', { tenantName: item.tenant.fullName })
    );
    if (!confirmed) return;
    
    this.isLoading.set(true);
    try {
      await this.propertiesService.dissociateTenant(propertyId, item.tenant.id);
      // ✅ Recharger les données via événement au lieu de window.location.reload()
      this.onRefreshNeeded.emit();
    } catch (error) {
      console.error('Error dissociating tenant:', error);
      this.toasts.error('PROPERTY_TENANTS.DISSOCIATE.ERROR');
    } finally {
      this.isLoading.set(false);
    }
  }
  
  getTenantStatus(contract: Contract): { label: string; color: string } {
    if (contract.status === 'Signed') {
      return { label: this.translate.instant('PROPERTY_TENANTS.STATUS.FUTURE_OCCUPANT'), color: 'blue' };
    }
    
    const endDate = new Date(contract.endDate);
    const today = new Date();
    const daysUntilEnd = Math.floor((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (contract.status === 'Terminated') {
      return { label: this.translate.instant('PROPERTY_TENANTS.STATUS.LEFT'), color: 'slate' };
    }
    
    if (daysUntilEnd <= 0) {
      return { label: this.translate.instant('PROPERTY_TENANTS.STATUS.LEFT'), color: 'slate' };
    }
    
    if (daysUntilEnd <= 60) {
      return { label: this.translate.instant('PROPERTY_TENANTS.STATUS.NOTICE'), color: 'orange' };
    }
    
    return { label: this.translate.instant('PROPERTY_TENANTS.STATUS.ACTIVE'), color: 'emerald' };
  }
  
  getInitials(name: string): string {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  getTenantAvatarDataUrl(tenant: TenantListItem): string | null {
    if (!tenant?.id) return null;
    return this.avatarStorage.getTenantAvatarDataUrl(tenant.id);
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
      return this.translate.instant('COMMON.ROOM', { number: contract.roomId });
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

    // 2b. Vérifier EDL sortie (si contrat terminé)
    const endDate = new Date(contract.endDate);
    const today = new Date();
    if (endDate < today && !contract.hasInventoryExit) {
      missing.push('EDL sortie');
    }
    
    // 3. Vérifier CNI
    if (!tenant.hasIdentityDocument) {
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
