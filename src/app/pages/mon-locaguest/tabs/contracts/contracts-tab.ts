import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { ContractsApi, ContractDto, ContractStats, CreateContractRequest, TerminateContractRequest, RecordPaymentRequest, ContractTerminationEligibilityDto } from '../../../../core/api/contracts.api';
import { TenantsApi } from '../../../../core/api/tenants.api';
import { PropertiesApi } from '../../../../core/api/properties.api';
import { ToastService } from '../../../../core/ui/toast.service';
import { ConfirmService } from '../../../../core/ui/confirm.service';
import { InventoriesApiService } from '../../../../core/api/inventories.api';
import { DocumentsApi } from '../../../../core/api/documents.api';
import { AddendumsApi, AddendumDto } from '../../../../core/api/addendums.api';
import { DocumentsService } from '../../../../core/services/documents.service';
import { firstValueFrom } from 'rxjs';
import { InventoryExitWizardData, InventoryExitWizardSimpleComponent } from '../property-contracts/inventory-exit-wizard/inventory-exit-wizard-simple';
import { InventoryEntryWizardData, InventoryEntryWizardSimpleComponent } from '../property-contracts/inventory-entry-wizard/inventory-entry-wizard-simple';
import { ContractViewerModal } from '../../components/contract-viewer-modal/contract-viewer-modal';


@Component({
  selector: 'contracts-tab',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslatePipe, InventoryExitWizardSimpleComponent, InventoryEntryWizardSimpleComponent, ContractViewerModal],
  templateUrl:'contracts-tab.html'
})
export class ContractsTab implements OnInit {
  private contractsApi = inject(ContractsApi);
  private tenantsApi = inject(TenantsApi);
  private propertiesApi = inject(PropertiesApi);
  private inventoriesApi = inject(InventoriesApiService);
  private documentsApi = inject(DocumentsApi);
  private addendumsApi = inject(AddendumsApi);
  private documentsService = inject(DocumentsService);
  private fb = inject(FormBuilder);
  
  // ✅ Services UI
  private toasts = inject(ToastService);
  private confirmService = inject(ConfirmService);
  
  stats = signal<ContractStats | null>(null);
  contracts = signal<ContractDto[]>([]);
  addendumsByContract = signal<Map<string, AddendumDto[]>>(new Map());
  isLoadingAddendums = signal(false);

  showEditAddendumModal = signal(false);
  addendumToEdit = signal<AddendumDto | null>(null);

  showAddendumSignatureModal = signal(false);
  addendumToSign = signal<AddendumDto | null>(null);
  signAllOccupants = signal(false);
  isSendingAddendumForSignature = signal(false);

  editAddendumForm = this.fb.group({
    effectiveDate: [''],
    reason: [''],
    description: [''],
    notes: ['']
  });
  isLoading = signal(false);
  
  searchTerm = '';
  statusFilter = '';
  typeFilter = '';

  // Modals
  showCreateModal = signal(false);
  showPaymentModal = signal(false);
  showTerminateModal = signal(false);
  showViewModal = signal(false);
  selectedContract = signal<ContractDto | null>(null);

  showContractViewer = signal(false);
  viewerContractId = signal<string | null>(null);

  showInventoryExitWizard = signal(false);
  inventoryExitData = signal<InventoryExitWizardData | null>(null);

  showInventoryEntryWizard = signal(false);
  inventoryEntryData = signal<InventoryEntryWizardData | null>(null);
  terminationEligibility = signal<ContractTerminationEligibilityDto | null>(null);

  // Forms
  createForm = this.fb.group({
    propertyId: ['', Validators.required],
    tenantId: ['', Validators.required],
    type: ['Furnished', Validators.required],
    startDate: ['', Validators.required],
    endDate: ['', Validators.required],
    rent: [0, [Validators.required, Validators.min(0)]],
    deposit: [0, Validators.min(0)]
  });

  paymentForm = this.fb.group({
    amount: [0, [Validators.required, Validators.min(0)]],
    paymentDate: [new Date().toISOString().split('T')[0], Validators.required],
    method: ['BankTransfer', Validators.required]
  });

  terminateForm = this.fb.group({
    terminationDate: [new Date().toISOString().split('T')[0], Validators.required],
    reason: ['', Validators.required]
  });

  ngOnInit() {
    this.loadStats();
    this.loadContracts();
  }

  openAddendumSignatureModal(addendum: AddendumDto, event?: Event) {
    event?.stopPropagation();
    this.addendumToSign.set(addendum);
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
    try {
      const t = await firstValueFrom(this.tenantsApi.getTenant(tenantId));
      if (!t?.email) return null;
      return { email: t.email, name: t.fullName };
    } catch {
      return null;
    }
  }

  async confirmSendAddendumForSignature() {
    const addendum = this.addendumToSign();
    if (!addendum) return;
    if (this.isSendingAddendumForSignature()) return;

    const docId = addendum.attachedDocumentIds?.[0];
    if (!docId) {
      this.toasts.warningDirect('Aucun PDF d\'avenant trouvé');
      return;
    }

    try {
      this.isSendingAddendumForSignature.set(true);

      let recipientTenantIds: string[];
      if (!this.signAllOccupants()) {
        // fallback: principal tenant from contract list by contractId
        const contract = this.contracts().find(c => c.id === addendum.contractId);
        if (!contract) {
          this.toasts.errorDirect('Contrat introuvable pour cet avenant');
          return;
        }
        recipientTenantIds = [contract.tenantId];
      } else {
        const full = await firstValueFrom(this.addendumsApi.getAddendum(addendum.id));
        recipientTenantIds = this.parseOccupantTenantIdsFromAddendum(full);
        if (recipientTenantIds.length === 0) {
          const contract = this.contracts().find(c => c.id === addendum.contractId);
          recipientTenantIds = contract ? [contract.tenantId] : [];
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
          message: `Signature de l'avenant (${addendum.type})`,
          expirationDays: 14
        })
      );

      void response;
      this.toasts.successDirect('Demande de signature envoyée');
      this.closeAddendumSignatureModal();
    } catch (err: any) {
      console.error('❌ Error sending addendum for signature:', err);
      this.toasts.errorDirect(err?.error?.message || 'Erreur lors de l\'envoi pour signature');
    } finally {
      this.isSendingAddendumForSignature.set(false);
    }
  }

  getAddendumsForContract(contractId: string): AddendumDto[] {
    return this.addendumsByContract().get(contractId) ?? [];
  }

  getDraftAddendumsForContract(contractId: string): AddendumDto[] {
    return this.getAddendumsForContract(contractId).filter(a => (a.signatureStatus || '').toLowerCase() === 'draft');
  }

  async loadAddendumsForVisibleContracts() {
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

  async downloadAddendumPdf(addendum: AddendumDto, event?: Event) {
    event?.stopPropagation();
    const docId = addendum.attachedDocumentIds?.[0];
    if (!docId) {
      this.toasts.warningDirect('Aucun PDF d\'avenant trouvé');
      return;
    }

    try {
      const blob = await firstValueFrom(this.documentsApi.downloadDocument(docId));
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Avenant_${addendum.id}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('❌ Error downloading addendum pdf:', err);
      this.toasts.errorDirect('Erreur lors du téléchargement du PDF');
    }
  }

  async markAddendumAsSigned(addendum: AddendumDto, event?: Event) {
    event?.stopPropagation();
    const confirmed = await this.confirmService.info(
      'Signaler l\'avenant comme signé',
      `Confirmer la signature de l'avenant ?\n\nDate d'effet: ${addendum.effectiveDate}`
    );
    if (!confirmed) return;

    try {
      await firstValueFrom(this.addendumsApi.markAddendumAsSigned(addendum.id, { signedDateUtc: new Date().toISOString() }));
      this.toasts.successDirect('Avenant marqué comme signé');
      await this.loadAddendumsForVisibleContracts();
      this.loadStats();
    } catch (err: any) {
      console.error('❌ Error marking addendum signed:', err);
      this.toasts.errorDirect(err?.error?.message || 'Erreur lors de la signature de l\'avenant');
    }
  }

  openEditAddendum(addendum: AddendumDto, event?: Event) {
    event?.stopPropagation();
    this.addendumToEdit.set(addendum);
    this.editAddendumForm.reset({
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
  }

  async saveAddendumEdits() {
    const addendum = this.addendumToEdit();
    if (!addendum) return;

    const v = this.editAddendumForm.value;
    try {
      await firstValueFrom(
        this.addendumsApi.updateAddendum(addendum.id, {
          effectiveDate: v.effectiveDate || undefined,
          reason: v.reason || undefined,
          description: v.description || undefined,
          notes: v.notes || ''
        })
      );
      this.toasts.successDirect('Avenant mis à jour');
      this.closeEditAddendum();
      await this.loadAddendumsForVisibleContracts();
    } catch (err: any) {
      console.error('❌ Error updating addendum:', err);
      this.toasts.errorDirect(err?.error?.message || 'Erreur lors de la mise à jour de l\'avenant');
    }
  }

  async deleteAddendum(addendum: AddendumDto, event?: Event) {
    event?.stopPropagation();
    const confirmed = await this.confirmService.danger(
      'Supprimer l\'avenant',
      'Êtes-vous sûr de vouloir supprimer cet avenant ? Cette action est irréversible.',
      'Supprimer'
    );
    if (!confirmed) return;

    try {
      await firstValueFrom(this.addendumsApi.deleteAddendum(addendum.id));
      this.toasts.successDirect('Avenant supprimé');
      await this.loadAddendumsForVisibleContracts();
      this.loadStats();
    } catch (err: any) {
      console.error('❌ Error deleting addendum:', err);
      this.toasts.errorDirect(err?.error?.message || 'Erreur lors de la suppression de l\'avenant');
    }
  }

  loadStats() {
    this.contractsApi.getStats().subscribe({
      next: (data) => this.stats.set(data),
      error: (err) => console.error('❌ Error loading contract stats:', err)
    });
  }

  loadContracts() {
    this.isLoading.set(true);
    this.contractsApi.getAllContracts(this.searchTerm, this.statusFilter, this.typeFilter).subscribe({
      next: (data) => {
        this.contracts.set(data);
        this.isLoading.set(false);

        void data;

        void this.loadAddendumsForVisibleContracts();
      },
      error: (err) => {
        console.error('❌ Error loading contracts:', err);
        this.isLoading.set(false);
      }
    });
  }

  onSearchChange() {
    this.loadContracts();
  }

  onFilterChange() {
    this.loadContracts();
  }

  // View contract details
  viewContract(contract: ContractDto) {
    this.selectedContract.set(contract);
    this.showViewModal.set(true);
  }

  async viewContractDocument(contract: ContractDto, event?: Event) {
    event?.stopPropagation();

    if (!contract?.id) {
      this.toasts.errorDirect('Contrat introuvable');
      return;
    }

    this.viewerContractId.set(contract.id);
    this.showContractViewer.set(true);
  }

  async downloadContractPDF(contract: ContractDto, event?: Event) {
    event?.stopPropagation();

    if (!contract?.id) {
      this.toasts.errorDirect('Contrat introuvable');
      return;
    }

    try {
      const dto = {
        contractId: contract.id,
        tenantId: contract.tenantId,
        propertyId: contract.propertyId,
        contractType: 'Bail',
        startDate: contract.startDate,
        endDate: contract.endDate,
        rent: contract.rent,
        deposit: contract.deposit ?? null,
        charges: contract.charges ?? null,
        additionalClauses: null,
        isThirdPartyLandlord: false,
        landlordInfo: null
      };

      const blob = await firstValueFrom(this.documentsApi.generateContract(dto));
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Contrat_${contract.id}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('❌ Error generating contract PDF:', err);
      this.toasts.errorDirect('Erreur lors de la génération du PDF');
    }
  }

  // Create contract
  openCreateModal() {
    this.createForm.reset({
      type: 'Furnished',
      rent: 0,
      deposit: 0
    });
    this.showCreateModal.set(true);
  }

  submitCreate() {
    if (this.createForm.invalid) return;

    const formValue = this.createForm.value;
    const request: CreateContractRequest = {
      propertyId: formValue.propertyId!,
      tenantId: formValue.tenantId!,
      type: formValue.type as 'Furnished' | 'Unfurnished',
      startDate: formValue.startDate!,
      endDate: formValue.endDate!,
      rent: formValue.rent!,
      deposit: formValue.deposit || 0
    };

    this.contractsApi.createContract(request).subscribe({
      next: () => {
        this.showCreateModal.set(false);
        this.loadContracts();
        this.loadStats();
        this.toasts.successDirect('Contrat créé avec succès !');
      },
      error: (err) => {
        console.error('❌ Error creating contract:', err);
        this.toasts.errorDirect('Erreur lors de la création du contrat');
      }
    });
  }

  // Record payment
  openPaymentModal(contract: ContractDto) {
    this.selectedContract.set(contract);
    this.paymentForm.reset({
      amount: contract.rent,
      paymentDate: new Date().toISOString().split('T')[0],
      method: 'BankTransfer'
    });
    this.showPaymentModal.set(true);
  }

  submitPayment() {
    if (this.paymentForm.invalid) return;

    const contract = this.selectedContract();
    if (!contract) return;

    const formValue = this.paymentForm.value;
    const request: RecordPaymentRequest = {
      amount: formValue.amount!,
      paymentDate: formValue.paymentDate!,
      method: formValue.method as any
    };

    this.contractsApi.recordPayment(contract.id, request).subscribe({
      next: () => {
        this.showPaymentModal.set(false);
        this.loadContracts();
        this.toasts.successDirect('Paiement enregistré avec succès !');
      },
      error: (err) => {
        console.error('❌ Error recording payment:', err);
        this.toasts.errorDirect('Erreur lors de l\'enregistrement du paiement');
      }
    });
  }

  // Terminate contract
  openTerminateModal(contract: ContractDto) {
    this.selectedContract.set(contract);
    this.terminationEligibility.set(null);
    this.terminateForm.reset({
      terminationDate: new Date().toISOString().split('T')[0],
      reason: ''
    });
    this.showTerminateModal.set(true);
    this.loadTerminationEligibility(contract.id);
  }

  private loadTerminationEligibility(contractId: string) {
    this.contractsApi.getTerminationEligibility(contractId).subscribe({
      next: (dto) => this.terminationEligibility.set(dto),
      error: () => this.terminationEligibility.set(null)
    });
  }

  openInventoryExitWizard() {
    const contract = this.selectedContract();
    if (!contract) return;

    this.inventoriesApi.getByContract(contract.id).subscribe({
      next: (inv) => {
        const entryId = inv?.entry?.id;
        if (!entryId) {
          this.toasts.errorDirect('EDL entrée manquant pour ce contrat');
          return;
        }

        const data: InventoryExitWizardData = {
          contractId: contract.id,
          propertyId: contract.propertyId,
          propertyName: contract.propertyName || 'Bien',
          roomId: contract.roomId,
          tenantName: contract.tenantName || 'Locataire',
          inventoryEntryId: entryId
        };

        this.inventoryExitData.set(data);
        this.showInventoryExitWizard.set(true);
      },
      error: () => this.toasts.errorDirect('Erreur lors de la vérification des EDL')
    });
  }

  openInventoryEntryWizard() {
    const contract = this.selectedContract();
    if (!contract) return;

    const data: InventoryEntryWizardData = {
      contractId: contract.id,
      propertyId: contract.propertyId,
      propertyName: contract.propertyName || 'Bien',
      roomId: contract.roomId,
      tenantName: contract.tenantName || 'Locataire'
    };

    this.inventoryEntryData.set(data);
    this.showInventoryEntryWizard.set(true);
  }

  handleInventoryExitClose(_: any) {
    this.showInventoryExitWizard.set(false);
    this.inventoryExitData.set(null);

    const contract = this.selectedContract();
    if (contract) {
      this.loadTerminationEligibility(contract.id);
    }
  }

  handleInventoryEntryClose(_: any) {
    this.showInventoryEntryWizard.set(false);
    this.inventoryEntryData.set(null);

    const contract = this.selectedContract();
    if (contract) {
      this.loadTerminationEligibility(contract.id);
    }
  }

  async cancelContract(contract: ContractDto) {
    const confirmed = await this.confirmService.danger(
      'Annuler le contrat',
      'Êtes-vous sûr de vouloir annuler ce contrat ?',
      'Annuler'
    );
    if (!confirmed) return;

    this.contractsApi.cancelContract(contract.id).subscribe({
      next: () => {
        this.loadContracts();
        this.loadStats();
        this.toasts.successDirect('Contrat annulé avec succès');
      },
      error: () => this.toasts.errorDirect('Erreur lors de l\'annulation du contrat')
    });
  }

  async deleteContract(contract: ContractDto) {
    const confirmed = await this.confirmService.danger(
      'Supprimer le contrat',
      'Êtes-vous sûr de vouloir supprimer ce contrat ? Cette action est irréversible.',
      'Supprimer'
    );
    if (!confirmed) return;

    this.contractsApi.deleteContract(contract.id).subscribe({
      next: () => {
        this.loadContracts();
        this.loadStats();
        this.toasts.successDirect('Contrat supprimé avec succès');
      },
      error: () => this.toasts.errorDirect('Erreur lors de la suppression du contrat')
    });
  }

  async submitTerminate() {
    if (this.terminateForm.invalid) return;

    const eligibility = this.terminationEligibility();
    if (eligibility && !eligibility.canTerminate) {
      if (eligibility.blockReason === 'INVENTORY_EXIT_MISSING') {
        this.toasts.errorDirect('Veuillez réaliser l\'EDL de sortie avant de résilier ce contrat');
        return;
      }
      if (eligibility.blockReason === 'PAYMENTS_NOT_UP_TO_DATE') {
        const amount = typeof eligibility.outstandingAmount === 'number' ? eligibility.outstandingAmount : 0;
        const count = typeof eligibility.overduePaymentsCount === 'number' ? eligibility.overduePaymentsCount : 0;
        this.toasts.errorDirect(`Paiements en retard (${count}) - montant restant: ${amount}`);
        return;
      }
      this.toasts.errorDirect('Résiliation impossible: prérequis non satisfaits');
      return;
    }

    const confirmed = await this.confirmService.danger(
      'Résilier le contrat',
      'Êtes-vous sûr de vouloir résilier ce contrat ?',
      'Résilier'
    );
    if (!confirmed) return;

    const contract = this.selectedContract();
    if (!contract) return;

    const formValue = this.terminateForm.value;
    const request: TerminateContractRequest = {
      terminationDate: formValue.terminationDate!,
      contractId: contract.id,
      reason: (formValue.reason || '').trim()
    };

    this.contractsApi.terminateContract(contract.id, request).subscribe({
      next: () => {
        this.showTerminateModal.set(false);
        this.loadContracts();
        this.loadStats();
        this.toasts.successDirect('Contrat résilié avec succès');
      },
      error: (err) => {
        console.error('❌ Error terminating contract:', err);
        this.toasts.errorDirect('Erreur lors de la résiliation du contrat');
      }
    });
  }

  closeModals() {
    this.showCreateModal.set(false);
    this.showPaymentModal.set(false);
    this.showTerminateModal.set(false);
    this.showViewModal.set(false);
    this.selectedContract.set(null);
    this.showContractViewer.set(false);
    this.viewerContractId.set(null);
  }
}
