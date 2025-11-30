import { Component, input, output, signal, computed, inject, effect } from '@angular/core';
import { NgClass } from '@angular/common';
import { PropertyDetail, Contract } from '../../../../core/api/properties.api';
import { TenantListItem, TenantsApi } from '../../../../core/api/tenants.api';
import { PropertiesService } from '../../../../core/services/properties.service';
import { ContractWizardModal } from './contract-wizard-modal/contract-wizard-modal';
import { MarkSignedModal } from './mark-signed-modal/mark-signed-modal';
import { ContractEditForm } from './contract-edit-form/contract-edit-form';
import { ContractsApi } from '../../../../core/api/contracts.api';
import { DocumentsService } from '../../../../core/services/documents.service';
import { InventoriesApiService, InventoryEntryDto, ContractInventoriesDto } from '../../../../core/api/inventories.api';
import { FinalizeInventoryModal } from './finalize-inventory-modal/finalize-inventory-modal';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'property-contracts-tab',
  standalone: true,
  imports: [NgClass, ContractWizardModal, MarkSignedModal, ContractEditForm, FinalizeInventoryModal],
  templateUrl: './property-contracts-tab.html'
})
export class PropertyContractsTab {
  property = input.required<PropertyDetail>();
  contracts = input<Contract[]>([]);
  associatedTenants = input<TenantListItem[]>([]);
  
  // Output pour notifier le parent de recharger les données
  contractCreated = output<void>();
  
  private propertiesService = inject(PropertiesService);
  private contractsApi = inject(ContractsApi);
  private documentsService = inject(DocumentsService);
  private tenantsApi = inject(TenantsApi);
  private inventoriesApi = inject(InventoriesApiService);
  
  // Loading states
  isMarkingAsSigned = signal(false);
  isGeneratingPdf = signal(false);
  isSendingForSignature = signal(false);
  isDeletingContract = signal(false);
  
  showWizard = signal(false);
  showPaperContractForm = signal(false);
  wizardMode = signal<'new' | 'paper'>('new');
  selectedContract = signal<Contract | null>(null);
  
  // ✅ NOUVEAU: Modal moderne pour signature
  showMarkSignedModal = signal(false);
  contractToSign = signal<Contract | null>(null);
  tenantForSigning = signal<TenantListItem | null>(null);
  
  // ✅ NOUVEAU: Formulaire d'édition
  showEditForm = signal(false);
  contractToEdit = signal<Contract | null>(null);
  
  // ✅ EDL Management
  contractInventories = signal<Map<string, ContractInventoriesDto>>(new Map());
  isLoadingInventories = signal(false);
  isFinalizingInventory = signal(false);
  isDeletingInventory = signal(false);
  hasLoadedInventories = signal(false);
  
  // ✅ Modal finalisation EDL
  showFinalizeInventoryModal = signal(false);
  inventoryToFinalize = signal<{ inventory: InventoryEntryDto; contract: Contract } | null>(null);
  
  // Computed properties
  activeContract = computed(() => {
    return this.contracts().find(c => 
      c.status === 'Active' && new Date(c.endDate) > new Date()
    );
  });
  
  historicalContracts = computed(() => {
    return this.contracts().filter(c => 
      c.status === 'Terminated' || new Date(c.endDate) <= new Date()
    ).sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());
  });
  
  draftContracts = computed(() => {
    return this.contracts().filter(c => c.status === 'Draft');
  });
  
  // ✅ EDL brouillons (non finalisés)
  draftInventories = computed(() => {
    const inventories: Array<{ inventory: InventoryEntryDto; contract: Contract }> = [];
    const invMap = this.contractInventories();
    
    for (const contract of this.contracts()) {
      const inv = invMap.get(contract.id);
      if (inv?.hasEntry && inv.entry && !inv.entry.isFinalized) {
        inventories.push({ inventory: inv.entry, contract });
      }
    }
    
    return inventories;
  });
  
  // ✅ AMÉLIORATION: Logique de grisage des boutons
  canCreateContract = computed(() => {
    const prop = this.property();
    const isColocation = prop?.propertyUsageType?.toLowerCase() === 'colocation';
    
    // Vérifier s'il y a un contrat Signé ou Active
    const hasSignedOrActiveContract = this.contracts().some(c => 
      c.status === 'Signed' || c.status === 'Active'
    );
    
    // ✅ CORRECTION: Pour colocation, on peut créer si il reste des chambres disponibles
    if (isColocation) {
      console.log("isColocation",isColocation)
      const totalRooms = prop.totalRooms || 0;
      const occupiedRooms = prop.occupiedRooms || 0;
      return occupiedRooms < totalRooms; // ✅ FIX: < au lieu de >
    }
    
    // Pour location complète, on ne peut pas créer si un contrat Signé/Active existe
    return !hasSignedOrActiveContract;
  });
  
  // ✅ NOUVEAU: Afficher le bouton "Ajouter un état des lieux"
  shouldShowInventoryButton = computed(() => {
    // Afficher si au moins un contrat Signé existe
    return this.contracts().some(c => c.status === 'Signed');
  });
  
  // ✅ NOUVEAU: Raison du grisage
  disabledReason = computed(() => {
    if (this.canCreateContract()) return '';
    
    const prop = this.property();
    const isColocation = prop?.propertyUsageType?.toLowerCase() === 'colocation';
    
    if (isColocation) {
      return 'Toutes les chambres sont déjà louées';
    }
    
    return 'Bien déjà réservé ou occupé';
  });
  
  // Status helpers - Cycle métier: Draft → Pending → Signed → Active → Terminated/Expired/Cancelled
  getContractStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'Draft': 'Brouillon',
      'Pending': 'En attente de signature',
      'Signed': 'Signé (Réservé)',
      'Active': 'Actif',
      'Expiring': 'Expire bientôt',
      'Terminated': 'Résilié',
      'Expired': 'Expiré',
      'Cancelled': 'Annulé'
    };
    return labels[status] || status;
  }
  
  getContractStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'Draft': 'slate',
      'Pending': 'amber',
      'Signed': 'blue',
      'Active': 'emerald',
      'Expiring': 'orange',
      'Terminated': 'red',
      'Expired': 'gray',
      'Cancelled': 'rose'
    };
    return colors[status] || 'slate';
  }
  
  getContractStatusIcon(status: string): string {
    const icons: Record<string, string> = {
      'Draft': 'ph-pencil-simple',
      'Pending': 'ph-clock',
      'Signed': 'ph-signature',
      'Active': 'ph-check-circle',
      'Expiring': 'ph-warning',
      'Terminated': 'ph-x-circle',
      'Expired': 'ph-calendar-x',
      'Cancelled': 'ph-prohibit'
    };
    return icons[status] || 'ph-file-text';
  }
  
  // Helpers pour badges spéciaux
  isContractInConflict(contract: Contract): boolean {
    return contract.isConflict === true;
  }
  
  getConflictTooltip(): string {
    return 'Ce contrat a été annulé car un autre contrat a été signé pour ce locataire';
  }
  
  // Actions
  openCreateContractWizard() {
    this.wizardMode.set('new');
    this.showWizard.set(true);
  }
  
  openPaperContractWizard() {
    this.wizardMode.set('paper');
    this.showWizard.set(true);
  }
  
  viewContractDetail(contract: Contract) {
    console.log('View contract detail:', contract.id);
    // TODO: Open contract detail view
  }
  
  editContract(contract: Contract) {
    // ✅ NOUVEAU: Ouvrir le formulaire d'édition au lieu du wizard
    this.contractToEdit.set(contract);
    this.showEditForm.set(true);
  }
  
  onEditFormClose() {
    this.showEditForm.set(false);
    this.contractToEdit.set(null);
  }
  
  onEditFormSuccess() {
    this.showEditForm.set(false);
    this.contractToEdit.set(null);
    // Recharger les données
    this.contractCreated.emit();
  }
  
  async generateContractPDF(contract: Contract) {
    if (this.isGeneratingPdf()) return;
    
    try {
      this.isGeneratingPdf.set(true);
      console.log('🔄 Génération PDF pour contrat:', contract.id);
      
      // ✅ CORRECTION: Envoyer tous les champs obligatoires
      const request = {
        contractId: contract.id,
        tenantId: contract.tenantId,
        propertyId: this.property().id,
        contractType: 'Bail' as const,
        startDate: contract.startDate,
        endDate: contract.endDate,
        rent: contract.rent,
        deposit: contract.deposit || null,
        charges: contract.charges || null
      };
      
      console.log('📤 Requête PDF:', request);
      
      const pdfBlob = await firstValueFrom(
        this.documentsService.generateContractPdf(request)
      );
      
      // Télécharger le fichier
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Contrat_${this.getTenantName(contract.tenantId)}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log('✅ PDF généré et téléchargé avec succès');
      alert('PDF généré avec succès !');
      
    } catch (error) {
      console.error('❌ Erreur génération PDF:', error);
      alert('Erreur lors de la génération du PDF. Veuillez réessayer.');
    } finally {
      this.isGeneratingPdf.set(false);
    }
  }
  
  // Phase 2: Actions selon statut
  // ✅ NOUVEAU: Ouvrir la modal moderne pour signature
  async markAsSigned(contract: Contract) {
    console.log('🔄 Mark as signed:', contract.id);
    
    // Charger le tenant (depuis associatedTenants ou API)
    let tenant = this.getTenant(contract.tenantId);
    
    if (!tenant) {
      console.log('⚠️ Tenant non trouvé dans associatedTenants, chargement depuis API...');
      try {
        tenant = await firstValueFrom(this.tenantsApi.getTenant(contract.tenantId));
        console.log('✅ Tenant chargé:', tenant);
      } catch (error) {
        console.error('❌ Erreur chargement tenant:', error);
        alert('Impossible de charger les informations du locataire.');
        return;
      }
    }
    
    this.contractToSign.set(contract);
    this.tenantForSigning.set(tenant);
    this.showMarkSignedModal.set(true);
  }
  
  onMarkSignedSuccess() {
    this.showMarkSignedModal.set(false);
    this.contractToSign.set(null);
    
    // Recharger les données
    console.log('✅ Contrat signé avec succès - rechargement données');
    this.contractCreated.emit();
  }
  
  onMarkSignedClose() {
    this.showMarkSignedModal.set(false);
    this.contractToSign.set(null);
    this.tenantForSigning.set(null);
  }
  
  async sendForElectronicSignature(contract: Contract) {
    if (this.isSendingForSignature()) return;
    
    // Récupérer les infos du locataire
    const tenant = this.associatedTenants().find(t => t.id === contract.tenantId);
    if (!tenant || !tenant.email) {
      alert('Email du locataire introuvable. Impossible d\'envoyer pour signature.');
      return;
    }
    
    const confirmed = confirm(
      `Envoyer le contrat pour signature électronique ?\n\n` +
      `Destinataire : ${tenant.fullName} (${tenant.email})\n\n` +
      `Un email sera envoyé au locataire avec le lien de signature.`
    );
    
    if (!confirmed) return;
    
    try {
      this.isSendingForSignature.set(true);
      console.log('🔄 Envoi pour signature électronique:', contract.id);
      
      // 1. Générer le PDF si pas déjà fait
      const request = {
        contractId: contract.id,
        tenantId: contract.tenantId,
        propertyId: this.property().id,
        contractType: 'Bail' as const,
        startDate: contract.startDate,
        endDate: contract.endDate,
        rent: contract.rent,
        deposit: contract.deposit || null,
        charges: contract.charges || null
      };
      
      const pdfBlob = await firstValueFrom(
        this.documentsService.generateContractPdf(request)
      );
      
      console.log('✅ PDF généré, taille:', pdfBlob.size);
      
      // 2. TODO: Upload et récupérer documentId
      // Pour l'instant, on simule avec un message
      alert(
        `Fonctionnalité en cours d'implémentation\n\n` +
        `Le PDF a été généré (${Math.round(pdfBlob.size / 1024)} KB).\n` +
        `L'intégration avec DocuSign/HelloSign/Yousign sera ajoutée prochainement.\n\n` +
        `Email : ${tenant.email}`
      );
      
      // TODO: Implémenter l'envoi réel
      // const signatureRequest = {
      //   recipients: [
      //     {
      //       email: tenant.email,
      //       name: tenant.fullName,
      //       signingOrder: 1
      //     }
      //   ],
      //   message: 'Merci de signer ce bail de location.',
      //   expirationDays: 30
      // };
      // 
      // const response = await firstValueFrom(
      //   this.documentsService.sendForElectronicSignature(documentId, signatureRequest)
      // );
      
    } catch (error: any) {
      console.error('❌ Erreur envoi signature électronique:', error);
      const errorMsg = error?.error?.message || 'Erreur lors de l\'envoi pour signature';
      alert(`Erreur : ${errorMsg}`);
    } finally {
      this.isSendingForSignature.set(false);
    }
  }
  
  uploadSignedVersion(contract: Contract) {
    console.log('Upload signed version:', contract.id);
    
    // Créer un input file invisible
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf';
    
    input.onchange = async (e: any) => {
      const file = e.target?.files?.[0];
      if (!file) return;
      
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        alert('Veuillez sélectionner un fichier PDF.');
        return;
      }
      
      try {
        console.log('🔄 Upload du contrat signé:', file.name);
        
        const response = await firstValueFrom(
          this.documentsService.uploadDocument(
            file,
            'Bail',
            'Contrats',
            contract.id,
            contract.tenantId,
            this.property().id,
            'Contrat signé uploadé'
          )
        );
        
        console.log('✅ Document uploadé:', response);
        alert(`Document uploadé avec succès !\nCode: ${response.code}`);
        
        // Demander si on veut marquer comme signé maintenant
        const markSigned = confirm(
          'Document uploadé avec succès.\n\n' +
          'Voulez-vous maintenant marquer le contrat comme signé ?'
        );
        
        if (markSigned) {
          await this.markAsSigned(contract);
        }
        
      } catch (error: any) {
        console.error('❌ Erreur upload:', error);
        const errorMsg = error?.error?.message || 'Erreur lors de l\'upload';
        alert(`Erreur : ${errorMsg}`);
      }
    };
    
    input.click();
  }
  
  viewInventoryEntry(contract: Contract) {
    console.log('View entry inventory for contract:', contract.id);
    // TODO: Open inventory view
  }
  
  viewInventoryExit(contract: Contract) {
    console.log('View exit inventory for contract:', contract.id);
    // TODO: Open inventory view
  }
  
  createInventoryEntry(contract: Contract) {
    console.log('Create entry inventory for contract:', contract.id);
    // TODO: Open inventory creation
  }
  
  // ✅ Charger tous les EDL des contrats (appelé manuellement)
  async loadAllInventories(force = false) {
    // Éviter les appels multiples sauf si force=true
    if (this.isLoadingInventories() || (this.hasLoadedInventories() && !force)) return;
    
    try {
      this.isLoadingInventories.set(true);
      const contracts = this.contracts();
      
      // Si pas de contrats, ne rien faire
      if (contracts.length === 0) {
        this.hasLoadedInventories.set(true);
        return;
      }
      
      const invMap = new Map<string, ContractInventoriesDto>();
      
      for (const contract of contracts) {
        try {
          const inv = await firstValueFrom(this.inventoriesApi.getByContract(contract.id));
          invMap.set(contract.id, inv);
        } catch (error) {
          // Pas d'EDL pour ce contrat - normal
          console.log(`Pas d'EDL pour contrat ${contract.id}`);
        }
      }
      
      this.contractInventories.set(invMap);
      this.hasLoadedInventories.set(true);
    } catch (error) {
      console.error('❌ Erreur chargement EDL:', error);
    } finally {
      this.isLoadingInventories.set(false);
    }
  }
  
  // ✅ Méthode publique pour initialiser les données (appelée par le parent)
  initializeInventories() {
    if (!this.hasLoadedInventories()) {
      this.loadAllInventories();
    }
  }
  
  // ✅ Ouvrir modal de finalisation EDL
  openFinalizeInventoryModal(inventory: InventoryEntryDto, contract: Contract) {
    this.inventoryToFinalize.set({ inventory, contract });
    this.showFinalizeInventoryModal.set(true);
  }
  
  // ✅ Fermer modal de finalisation EDL
  closeFinalizeInventoryModal() {
    this.showFinalizeInventoryModal.set(false);
    this.inventoryToFinalize.set(null);
  }
  
  // ✅ Finaliser un EDL (action irréversible)
  async handleFinalizeInventory(signatureMethod: 'paper' | 'electronic') {
    const data = this.inventoryToFinalize();
    if (!data || this.isFinalizingInventory()) return;
    
    try {
      this.isFinalizingInventory.set(true);
      console.log('🔒 Finalisation EDL:', data.inventory.id, 'Méthode:', signatureMethod);
      
      await firstValueFrom(this.inventoriesApi.finalizeEntry(data.inventory.id));
      
      console.log('✅ EDL finalisé avec succès');
      
      // Fermer le modal
      this.closeFinalizeInventoryModal();
      
      // Recharger les données (force=true pour rafraîchir)
      await this.loadAllInventories(true);
      this.contractCreated.emit();
      
      // Message de succès
      alert('✅ État des lieux finalisé avec succès !\n\nLe document est maintenant verrouillé et juridiquement opposable.');
    } catch (error: any) {
      console.error('❌ Erreur finalisation EDL:', error);
      const errorMessage = error?.error?.message || 'Erreur lors de la finalisation';
      alert(`❌ Erreur : ${errorMessage}`);
    } finally {
      this.isFinalizingInventory.set(false);
    }
  }
  
  // ✅ Supprimer un EDL (avec règles métier)
  async deleteInventory(inventory: InventoryEntryDto, contract: Contract) {
    if (this.isDeletingInventory()) return;
    
    // Vérifications côté client
    if (inventory.isFinalized) {
      alert('❌ Impossible de supprimer un EDL finalisé.\n\nC\'est un document légal permanent.');
      return;
    }
    
    if (contract.status === 'Active') {
      alert('❌ Impossible de supprimer l\'EDL d\'un contrat actif.');
      return;
    }
    
    const confirmed = confirm(
      `Supprimer cet état des lieux d'entrée ?\n\n` +
      `Locataire : ${this.getTenantName(contract.tenantId)}\n` +
      `Date inspection : ${this.formatDate(inventory.inspectionDate)}\n\n` +
      `Cette action est irréversible.`
    );
    
    if (!confirmed) return;
    
    try {
      this.isDeletingInventory.set(true);
      console.log('🗑️ Suppression EDL:', inventory.id);
      
      await firstValueFrom(this.inventoriesApi.deleteEntry(inventory.id));
      
      console.log('✅ EDL supprimé avec succès');
      alert('✅ État des lieux supprimé avec succès !');
      
      // Recharger les données (force=true pour rafraîchir)
      await this.loadAllInventories(true);
      this.contractCreated.emit();
    } catch (error: any) {
      console.error('❌ Erreur suppression EDL:', error);
      const errorMessage = error?.error?.message || 'Erreur lors de la suppression';
      alert(`❌ ${errorMessage}`);
    } finally {
      this.isDeletingInventory.set(false);
    }
  }
  
  // ✅ Vérifier si un EDL peut être modifié
  canEditInventory(inventory: InventoryEntryDto): boolean {
    return !inventory.isFinalized;
  }
  
  // ✅ Vérifier si un EDL peut être supprimé
  canDeleteInventory(inventory: InventoryEntryDto, contract: Contract): boolean {
    if (inventory.isFinalized) return false;
    if (contract.status === 'Active') return false;
    return inventory.status === 'Draft';
  }
  
  createInventoryExit(contract: Contract) {
    console.log('Create exit inventory for contract:', contract.id);
    // TODO: Open inventory creation
  }
  
  async deleteContract(contract: Contract) {
    if (this.isDeletingContract()) return;
    
    // Vérifier que le contrat est Draft ou Cancelled
    if (contract.status !== 'Draft' && contract.status !== 'Cancelled') {
      alert(`Impossible de supprimer un contrat avec le statut "${contract.status}". Seuls les contrats Draft ou Cancelled peuvent être supprimés.`);
      return;
    }
    
    const confirmed = confirm(
      `Êtes-vous sûr de vouloir supprimer ce contrat ?\n\n` +
      `Locataire : ${this.getTenantName(contract.tenantId)}\n` +
      `Période : ${this.formatDate(contract.startDate)} - ${this.formatDate(contract.endDate)}\n\n` +
      `Cette action est irréversible et supprimera également tous les paiements et documents associés.`
    );
    
    if (!confirmed) return;
    
    try {
      this.isDeletingContract.set(true);
      console.log('🗑️ Suppression contrat:', contract.id);
      
      const response = await firstValueFrom(
        this.contractsApi.deleteContract(contract.id)
      );
      
      console.log('✅ Contrat supprimé:', response);
      alert(
        `Contrat supprimé avec succès !\n\n` +
        `Documents supprimés : ${response.deletedDocuments}\n` +
        `Paiements supprimés : ${response.deletedPayments}`
      );
      
      // Recharger les données
      this.contractCreated.emit();
    } catch (error: any) {
      console.error('❌ Erreur suppression contrat:', error);
      const errorMessage = error?.error?.message || 'Erreur lors de la suppression du contrat';
      alert(errorMessage);
    } finally {
      this.isDeletingContract.set(false);
    }
  }
  
  getTenantName(tenantId: string): string {
    const tenant = this.associatedTenants().find(t => t.id === tenantId);
    return tenant?.fullName || 'Locataire inconnu';
  }
  
  getTenant(tenantId: string): TenantListItem | undefined {
    return this.associatedTenants().find(t => t.id === tenantId);
  }
  
  formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
  
  getContractDuration(startDate: string | Date, endDate: string | Date): string {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const months = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30));
    
    if (months < 12) {
      return `${months} mois`;
    }
    
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    
    if (remainingMonths === 0) {
      return `${years} an${years > 1 ? 's' : ''}`;
    }
    
    return `${years} an${years > 1 ? 's' : ''} et ${remainingMonths} mois`;
  }
  
  onWizardClose() {
    this.showWizard.set(false);
    this.selectedContract.set(null);
  }
  
  onWizardSuccess() {
    this.showWizard.set(false);
    this.selectedContract.set(null);
    // Notifier le parent de recharger les contrats
    console.log('✅ Contrat créé avec succès - notification parent pour rechargement');
    this.contractCreated.emit();
  }
}
