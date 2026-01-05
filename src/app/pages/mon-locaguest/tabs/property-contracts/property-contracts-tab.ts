import { Component, input, output, signal, computed, inject, effect } from '@angular/core';
import { DatePipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PropertyDetail, Contract } from '../../../../core/api/properties.api';
import { TenantListItem, TenantsApi } from '../../../../core/api/tenants.api';
import { PropertiesService } from '../../../../core/services/properties.service';
import { ContractWizardModal } from './contract-wizard-modal/contract-wizard-modal';
import { MarkSignedModal } from './mark-signed-modal/mark-signed-modal';
import { ContractEditForm } from './contract-edit-form/contract-edit-form';
import { ContractsApi } from '../../../../core/api/contracts.api';
import { DocumentsService } from '../../../../core/services/documents.service';
import { AddendumsApi, AddendumDto } from '../../../../core/api/addendums.api';
import { InventoriesApiService, InventoryEntryDto, ContractInventoriesDto } from '../../../../core/api/inventories.api';
import { FinalizeInventoryModal } from './finalize-inventory-modal/finalize-inventory-modal';
import { ToastService } from '../../../../core/ui/toast.service';
import { ConfirmService } from '../../../../core/ui/confirm.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'property-contracts-tab',
  standalone: true,
  imports: [NgClass, DatePipe, FormsModule, ContractWizardModal, MarkSignedModal, ContractEditForm, FinalizeInventoryModal],
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
  private addendumsApi = inject(AddendumsApi);
  private tenantsApi = inject(TenantsApi);
  private inventoriesApi = inject(InventoriesApiService);
  
  // ✅ Services UI
  private toasts = inject(ToastService);
  private confirmService = inject(ConfirmService);
  
  // Loading states
  isMarkingAsSigned = signal(false);
  isGeneratingPdf = signal(false);
  isSendingForSignature = signal(false);
  isDeletingContract = signal(false);

  // ✅ Addendums (Avenants)
  addendumsByContract = signal<Map<string, AddendumDto[]>>(new Map());
  isLoadingAddendums = signal(false);
  isMarkingAddendumAsSigned = signal(false);
  isDeletingAddendum = signal(false);
  showEditAddendumModal = signal(false);
  addendumToEdit = signal<AddendumDto | null>(null);
  editAddendumForm = signal<{ effectiveDate: string; reason: string; description: string; notes: string } | null>(null);

  showAddendumSignatureModal = signal(false);
  addendumToSign = signal<{ contract: Contract; addendum: AddendumDto } | null>(null);
  signAllOccupants = signal(false);
  isSendingAddendumForSignature = signal(false);
  
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

  draftAddendums = computed(() => {
    const map = this.addendumsByContract();
    const items: Array<{ contract: Contract; addendum: AddendumDto }> = [];

    for (const contract of this.contracts()) {
      const adds = map.get(contract.id) ?? [];
      for (const a of adds) {
        if ((a.signatureStatus || '').toLowerCase() === 'draft') {
          items.push({ contract, addendum: a });
        }
      }
    }

    return items.sort((a, b) => new Date(b.addendum.createdAt || b.addendum.effectiveDate).getTime() - new Date(a.addendum.createdAt || a.addendum.effectiveDate).getTime());
  });

  async generateAddendumPdf(addendum: AddendumDto) {
    await this.downloadAddendumPdf(addendum);
  }

  async sendAddendumForElectronicSignature(_: AddendumDto) {
    // This method is kept for template compatibility, but we now open a modal.
  }

  openAddendumSignatureModal(item: { contract: Contract; addendum: AddendumDto }) {
    this.addendumToSign.set(item);
    this.signAllOccupants.set(false);
    this.showAddendumSignatureModal.set(true);
  }

  closeAddendumSignatureModal() {
    if (this.isSendingAddendumForSignature()) return;
    this.showAddendumSignatureModal.set(false);
    this.addendumToSign.set(null);
    this.signAllOccupants.set(false);
  }

  onSignAllOccupantsToggle(event: Event) {
    const checked = (event.target as HTMLInputElement | null)?.checked === true;
    this.signAllOccupants.set(checked);
  }

  private parseOccupantTenantIdsFromAddendum(addendum: AddendumDto): string[] {
    const raw = (addendum as any)?.occupantChanges;
    if (!raw) return [];

    try {
      const obj = typeof raw === 'string' ? JSON.parse(raw) : raw;
      const participants = Array.isArray(obj?.participants) ? obj.participants : [];
      const ids = participants
        .map((p: any) => p?.tenantId)
        .filter((x: any) => typeof x === 'string' && x.length > 0);
      return Array.from(new Set(ids));
    } catch {
      return [];
    }
  }

  private async resolveRecipient(tenantId: string): Promise<{ email: string; name: string } | null> {
    const fromList = this.associatedTenants().find(t => t.id === tenantId);
    if (fromList?.email) return { email: fromList.email, name: fromList.fullName };

    try {
      const t = await firstValueFrom(this.tenantsApi.getTenant(tenantId));
      if (!t?.email) return null;
      return { email: t.email, name: t.fullName };
    } catch {
      return null;
    }
  }

  async confirmSendAddendumForSignature() {
    const item = this.addendumToSign();
    if (!item) return;
    if (this.isSendingAddendumForSignature()) return;

    const docId = item.addendum.attachedDocumentIds?.[0];
    if (!docId) {
      this.toasts.warningDirect('Aucun PDF d\'avenant trouvé');
      return;
    }

    try {
      this.isSendingAddendumForSignature.set(true);

      let recipientTenantIds: string[];
      if (!this.signAllOccupants()) {
        recipientTenantIds = [item.contract.tenantId];
      } else {
        const full = await firstValueFrom(this.addendumsApi.getAddendum(item.addendum.id));
        recipientTenantIds = this.parseOccupantTenantIdsFromAddendum(full);
        if (recipientTenantIds.length === 0) {
          // fallback: main tenant
          recipientTenantIds = [item.contract.tenantId];
        }
      }

      const recipients: Array<{ email: string; name: string; signingOrder?: number }> = [];
      for (const id of recipientTenantIds) {
        const r = await this.resolveRecipient(id);
        if (r) recipients.push(r);
      }

      if (recipients.length === 0) {
        this.toasts.errorDirect('Aucun destinataire valide (email manquant)');
        return;
      }

      const response = await firstValueFrom(
        this.documentsService.sendForElectronicSignature(docId, {
          recipients,
          message: `Signature de l'avenant (${item.addendum.type})`,
          expirationDays: 14
        })
      );
      this.toasts.successDirect('Demande de signature envoyée');
      this.closeAddendumSignatureModal();
    } catch (err: any) {
      console.error('❌ Error sending addendum for signature:', err);
      this.toasts.errorDirect(err?.error?.message || 'Erreur lors de l\'envoi pour signature');
    } finally {
      this.isSendingAddendumForSignature.set(false);
    }
  }

  openEditAddendum(addendum: AddendumDto) {
    this.addendumToEdit.set(addendum);
    this.editAddendumForm.set({
      effectiveDate: (addendum.effectiveDate || '').split('T')[0],
      reason: addendum.reason || '',
      description: addendum.description || '',
      notes: (addendum.notes as any) || ''
    });
    this.showEditAddendumModal.set(true);
  }

  closeEditAddendum() {
    this.showEditAddendumModal.set(false);
    this.addendumToEdit.set(null);
    this.editAddendumForm.set(null);
  }

  updateEditAddendumField(field: 'effectiveDate' | 'reason' | 'description' | 'notes', value: string) {
    const current = this.editAddendumForm();
    if (!current) return;
    this.editAddendumForm.set({
      effectiveDate: field === 'effectiveDate' ? value : current.effectiveDate,
      reason: field === 'reason' ? value : current.reason,
      description: field === 'description' ? value : current.description,
      notes: field === 'notes' ? value : current.notes
    });
  }

  async saveAddendumEdits() {
    const addendum = this.addendumToEdit();
    const form = this.editAddendumForm();
    if (!addendum || !form) return;

    try {
      await firstValueFrom(
        this.addendumsApi.updateAddendum(addendum.id, {
          effectiveDate: form.effectiveDate,
          reason: form.reason,
          description: form.description,
          notes: form.notes
        })
      );
      this.toasts.successDirect('Avenant mis à jour');
      this.closeEditAddendum();
      await this.loadAllAddendums();
    } catch (err: any) {
      console.error('❌ Erreur update avenant:', err);
      this.toasts.errorDirect(err?.error?.message || 'Erreur lors de la mise à jour de l\'avenant');
    }
  }

  async deleteAddendum(addendum: AddendumDto) {
    if (this.isDeletingAddendum()) return;

    const confirmed = await this.confirmService.danger(
      'Supprimer l\'avenant',
      'Êtes-vous sûr de vouloir supprimer cet avenant ? Cette action est irréversible.',
      'Supprimer'
    );
    if (!confirmed) return;

    try {
      this.isDeletingAddendum.set(true);
      await firstValueFrom(this.addendumsApi.deleteAddendum(addendum.id));
      this.toasts.successDirect('Avenant supprimé');
      await this.loadAllAddendums();
    } catch (err: any) {
      console.error('❌ Erreur suppression avenant:', err);
      this.toasts.errorDirect(err?.error?.message || 'Erreur lors de la suppression de l\'avenant');
    } finally {
      this.isDeletingAddendum.set(false);
    }
  }

  effectLoadAddendums = effect(() => {
    const cs = this.contracts();
    if (!cs || cs.length === 0) return;
    void this.loadAllAddendums();
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

  async loadAllAddendums() {
    if (this.isLoadingAddendums()) return;
    try {
      this.isLoadingAddendums.set(true);

      const map = new Map<string, AddendumDto[]>();
      for (const contract of this.contracts()) {
        try {
          const res = await firstValueFrom(
            this.addendumsApi.getAddendums({ contractId: contract.id, page: 1, pageSize: 50 })
          );
          map.set(contract.id, res?.data ?? []);
        } catch {
          map.set(contract.id, []);
        }
      }

      this.addendumsByContract.set(map);
    } finally {
      this.isLoadingAddendums.set(false);
    }
  }

  async downloadAddendumPdf(addendum: AddendumDto) {
    const docId = addendum.attachedDocumentIds?.[0];
    if (!docId) {
      this.toasts.warningDirect('Aucun PDF d\'avenant trouvé');
      return;
    }

    try {
      const blob = await firstValueFrom(this.documentsService.downloadDocument(docId));
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Avenant_${addendum.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('❌ Erreur téléchargement avenant:', error);
      this.toasts.errorDirect('Erreur lors du téléchargement du PDF');
    }
  }

  async markAddendumAsSigned(item: { contract: Contract; addendum: AddendumDto }) {
    if (this.isMarkingAddendumAsSigned()) return;

    const confirmed = await this.confirmService.info(
      'Signaler l\'avenant comme signé',
      `Confirmer la signature de l'avenant ?\n\nLocataire: ${this.getTenantName(item.contract.tenantId)}\nDate d'effet: ${this.formatDate(item.addendum.effectiveDate)}`
    );
    if (!confirmed) return;

    try {
      this.isMarkingAddendumAsSigned.set(true);
      await firstValueFrom(this.addendumsApi.markAddendumAsSigned(item.addendum.id, { signedDateUtc: new Date().toISOString() }));
      this.toasts.successDirect('Avenant marqué comme signé');
      await this.loadAllAddendums();
    } catch (error: any) {
      console.error('❌ Erreur signature avenant:', error);
      this.toasts.errorDirect(error?.error?.message || 'Erreur lors de la signature de l\'avenant');
    } finally {
      this.isMarkingAddendumAsSigned.set(false);
    }
  }
  
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
      this.toasts.successDirect('PDF généré avec succès !');
      
    } catch (error) {
      console.error('❌ Erreur génération PDF:', error);
      this.toasts.errorDirect('Erreur lors de la génération du PDF. Veuillez réessayer.');
    } finally {
      this.isGeneratingPdf.set(false);
    }
  }
  
  // Phase 2: Actions selon statut
  // ✅ NOUVEAU: Ouvrir la modal moderne pour signature
  async markAsSigned(contract: Contract) {
    // Charger le tenant (depuis associatedTenants ou API)
    let tenant = this.getTenant(contract.tenantId);
    
    if (!tenant) {
      try {
        tenant = await firstValueFrom(this.tenantsApi.getTenant(contract.tenantId));
      } catch (error) {
        console.error('❌ Erreur chargement tenant:', error);
        this.toasts.errorDirect('Impossible de charger les informations du locataire.');
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
      this.toasts.errorDirect('Email du locataire introuvable. Impossible d\'envoyer pour signature.');
      return;
    }
    
    const confirmed = await this.confirmService.info(
      'Envoyer pour signature',
      `Envoyer le contrat pour signature électronique ?

Destinataire : ${tenant.fullName} (${tenant.email})

Un email sera envoyé au locataire avec le lien de signature.`
    );
    
    if (!confirmed) return;
    
    try {
      this.isSendingForSignature.set(true);
      
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
      
      // 2. TODO: Upload et récupérer documentId
      // Pour l'instant, on simule avec un message
      this.toasts.infoDirect(
        `Fonctionnalité en cours d'implémentation\n\nLe PDF a été généré (${Math.round(pdfBlob.size / 1024)} KB).\nL'intégration avec DocuSign/HelloSign/Yousign sera ajoutée prochainement.\n\nEmail : ${tenant.email}`
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
      this.toasts.errorDirect(errorMsg);
    } finally {
      this.isSendingForSignature.set(false);
    }
  }
  
  uploadSignedVersion(contract: Contract) {
    // Créer un input file invisible
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf';
    
    input.onchange = async (e: any) => {
      const file = e.target?.files?.[0];
      if (!file) return;
      
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        this.toasts.warningDirect('Veuillez sélectionner un fichier PDF.');
        return;
      }
      
      try {
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
        this.toasts.successDirect(`Document uploadé avec succès !\nCode: ${response.code}`);
        
        // Demander si on veut marquer comme signé maintenant
        const markSigned = await this.confirmService.success(
          'Document uploadé',
          'Document uploadé avec succès.\n\nVoulez-vous maintenant marquer le contrat comme signé ?'
        );
        
        if (markSigned) {
          await this.markAsSigned(contract);
        }
        
      } catch (error: any) {
        console.error('❌ Erreur upload:', error);
        const errorMsg = error?.error?.message || 'Erreur lors de l\'upload';
        this.toasts.errorDirect(errorMsg);
      }
    };
    
    input.click();
  }
  
  viewInventoryEntry(contract: Contract) {
    // TODO: Open inventory view
  }
  
  viewInventoryExit(contract: Contract) {
    // TODO: Open inventory view
  }
  
  createInventoryEntry(contract: Contract) {
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
      
      await firstValueFrom(this.inventoriesApi.finalizeEntry(data.inventory.id));
      
      // Fermer le modal
      this.closeFinalizeInventoryModal();
      
      // Recharger les données (force=true pour rafraîchir)
      await this.loadAllInventories(true);
      this.contractCreated.emit();
      
      // Message de succès
      this.toasts.successDirect('État des lieux finalisé avec succès !\n\nLe document est maintenant verrouillé et juridiquement opposable.');
    } catch (error: any) {
      console.error('❌ Erreur finalisation EDL:', error);
      const errorMessage = error?.error?.message || 'Erreur lors de la finalisation';
      this.toasts.errorDirect(errorMessage);
    } finally {
      this.isFinalizingInventory.set(false);
    }
  }
  
  // ✅ Supprimer un EDL (avec règles métier)
  async deleteInventory(inventory: InventoryEntryDto, contract: Contract) {
    if (this.isDeletingInventory()) return;
    
    // Vérifications côté client
    if (inventory.isFinalized) {
      this.toasts.errorDirect('Impossible de supprimer un EDL finalisé.\n\nC\'est un document légal permanent.');
      return;
    }
    
    if (contract.status === 'Active') {
      this.toasts.errorDirect('Impossible de supprimer l\'EDL d\'un contrat actif.');
      return;
    }
    
    const confirmed = await this.confirmService.danger(
      'Supprimer l\'EDL',
      `Supprimer cet état des lieux d'entrée ?

Locataire : ${this.getTenantName(contract.tenantId)}
Date inspection : ${this.formatDate(inventory.inspectionDate)}

Cette action est irréversible.`,
      'Supprimer'
    );
    
    if (!confirmed) return;
    
    try {
      this.isDeletingInventory.set(true);
      
      await firstValueFrom(this.inventoriesApi.deleteEntry(inventory.id));
      this.toasts.successDirect('État des lieux supprimé avec succès !');
      
      // Recharger les données (force=true pour rafraîchir)
      await this.loadAllInventories(true);
      this.contractCreated.emit();
    } catch (error: any) {
      console.error('❌ Erreur suppression EDL:', error);
      const errorMessage = error?.error?.message || 'Erreur lors de la suppression';
      this.toasts.errorDirect(errorMessage);
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
    // TODO: Open inventory creation
  }
  
  async deleteContract(contract: Contract) {
    if (this.isDeletingContract()) return;
    
    // Vérifier que le contrat est Draft ou Cancelled
    if (contract.status !== 'Draft' && contract.status !== 'Cancelled') {
      this.toasts.warningDirect(`Impossible de supprimer un contrat avec le statut "${contract.status}". Seuls les contrats Draft ou Cancelled peuvent être supprimés.`);
      return;
    }
    
    const confirmed = await this.confirmService.danger(
      'Supprimer le contrat',
      `Êtes-vous sûr de vouloir supprimer ce contrat ?

Locataire : ${this.getTenantName(contract.tenantId)}
Période : ${this.formatDate(contract.startDate)} - ${this.formatDate(contract.endDate)}

Cette action est irréversible et supprimera également tous les paiements et documents associés.`,
      'Supprimer'
    );
    
    if (!confirmed) return;
    
    try {
      this.isDeletingContract.set(true);
      
      const response = await firstValueFrom(
        this.contractsApi.deleteContract(contract.id)
      );
      this.toasts.successDirect(
        `Contrat supprimé avec succès !\n\nDocuments supprimés : ${response.deletedDocuments}\nPaiements supprimés : ${response.deletedPayments}`
      );
      
      // Recharger les données
      this.contractCreated.emit();
    } catch (error: any) {
      console.error('❌ Erreur suppression contrat:', error);
      const errorMessage = error?.error?.message || 'Erreur lors de la suppression du contrat';
      this.toasts.errorDirect(errorMessage);
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
    this.contractCreated.emit();
  }
}
