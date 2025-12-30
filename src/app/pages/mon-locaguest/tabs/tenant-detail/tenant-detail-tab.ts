import { Component, input, signal, inject, effect, computed } from '@angular/core';
import { DatePipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { InternalTabManagerService } from '../../../../core/services/internal-tab-manager.service';
import { OccupancyChart } from '../../../../components/charts/occupancy-chart/occupancy-chart';
import { TenantDetail, TenantPayment, TenantPaymentStats } from '../../../../core/api/tenants.api';
import { TenantsService } from '../../../../core/services/tenants.service';
import { Contract } from '../../../../core/api/properties.api';
import { DocumentsManagerComponent } from '../../components/documents-manager/documents-manager';
import { ContractDocumentsStatusComponent } from '../../components/contract-documents-status/contract-documents-status.component';
import { DocumentsApi } from '../../../../core/api/documents.api';
import { ContractWizardModal } from '../property-contracts/contract-wizard-modal/contract-wizard-modal';
import { TenantPaymentsTab } from '../tenant-payments/tenant-payments-tab';
import { ToastService } from '../../../../core/ui/toast.service';
import { ConfirmService } from '../../../../core/ui/confirm.service';
import { PropertiesService } from '../../../../core/services/properties.service';
import { ContractsApi } from '../../../../core/api/contracts.api';
import { firstValueFrom } from 'rxjs';
import { InventoriesApiService } from '../../../../core/api/inventories.api';
import { InventoryExitWizardData, InventoryExitWizardSimpleComponent } from '../property-contracts/inventory-exit-wizard/inventory-exit-wizard-simple';
import { ContractViewerModal } from '../../components/contract-viewer-modal/contract-viewer-modal';
import { ContractAddendumData, ContractAddendumWizard } from '../property-contracts/contract-addendum-wizard/contract-addendum-wizard';
import { ContractNoticeData, ContractNoticeWizard } from '../property-contracts/contract-notice-wizard/contract-notice-wizard';
import { AddendumsApi, AddendumDto } from '../../../../core/api/addendums.api';
import { InvoicesApi, RentInvoiceDto } from '../../../../core/api/invoices.api';

@Component({
  selector: 'tenant-detail-tab',
  standalone: true,
  imports: [
    TranslatePipe, 
    DatePipe, 
    OccupancyChart, 
    DocumentsManagerComponent,
    ContractDocumentsStatusComponent,
    ContractWizardModal,
    TenantPaymentsTab,
    InventoryExitWizardSimpleComponent,
    ContractViewerModal,
    ContractAddendumWizard,
    ContractNoticeWizard
  ],
  templateUrl: './tenant-detail-tab.html'
})
export class TenantDetailTab {
  data = input<any>();
  private tabManager = inject(InternalTabManagerService);
  private tenantsService = inject(TenantsService);
  private propertiesService = inject(PropertiesService);
  private inventoriesApi = inject(InventoriesApiService);
  private toasts = inject(ToastService);
  private confirmService = inject(ConfirmService);
  private contractsApi = inject(ContractsApi);
  private documentsApi = inject(DocumentsApi);
  private addendumsApi = inject(AddendumsApi);
  private invoicesApi = inject(InvoicesApi);

  activeSubTab = signal('contracts');
  isLoading = signal(false);
  
  tenant = signal<TenantDetail | null>(null);
  payments = signal<TenantPayment[]>([]);
  contracts = signal<Contract[]>([]);
  paymentStats = signal<TenantPaymentStats | null>(null);

  rentInvoices = signal<RentInvoiceDto[]>([]);
  isLoadingInvoices = signal(false);
  downloadingInvoiceId = signal<string | null>(null);

  // ✅ Addendums
  addendumsByContract = signal<Map<string, AddendumDto[]>>(new Map());
  isLoadingAddendums = signal(false);
  
  // ✅ NOUVEAU: Stocker les infos du bien d'origine (si ouvert depuis une fiche bien)
  fromProperty = signal<{ id: string; code: string; name: string } | null>(null);

  associatedProperty = computed(() => {
    const explicit = this.fromProperty();
    if (explicit) return explicit;

    const t = this.tenant();
    if (!t?.propertyId) return null;

    return {
      id: t.propertyId,
      code: t.propertyCode || '',
      name: ''
    };
  });

  signedAddendumsCount = computed(() => {
    let count = 0;
    const map = this.addendumsByContract();
    for (const contract of this.contracts()) {
      const adds = map.get(contract.id) ?? [];
      count += adds.filter(a => (a.signatureStatus || '').toLowerCase() === 'signed').length;
    }
    return count;
  });

  hasSignedAddendums = computed(() => this.signedAddendumsCount() > 0);
  
  // Pour gérer l'expansion des documents de contrat
  expandedContractId = signal<string | null>(null);

  showContractViewer = signal(false);
  viewerContractId = signal<string | null>(null);

  showInventoryExitWizard = signal(false);
  inventoryExitData = signal<InventoryExitWizardData | null>(null);

  isPrintingSheet = signal(false);
  
  // Pour gérer le wizard de création de contrat
  showContractWizard = signal(false);
  
  // Pour gérer le wizard de préavis/rupture
  showNoticeWizard = signal(false);
  selectedContractForNotice = signal<Contract | null>(null);

  showAddendumWizard = signal(false);
  addendumWizardData = signal<ContractAddendumData | null>(null);

  noticeWizardData = computed<ContractNoticeData | null>(() => {
    const c = this.selectedContractForNotice();
    const t = this.tenant();
    if (!c || !t) return null;

    const propertyName = (c as any)?.propertyName || this.associatedProperty()?.code || 'Bien';
    return {
      contract: c,
      propertyName,
      tenantName: t.fullName,
      roomName: (c as any)?.roomName
    };
  });
  
  // Données enrichies du locataire
  currentOccupancy = signal<{
    propertyName: string;
    propertyCode: string;
    roomName?: string;
    contractId: string;
    moveInDate: Date;
    leaseEndDate: Date;
    monthlyRent: number;
    monthlyCharges: number;
    deposit: number;
  } | null>(null);

  depositBadge = computed<{ label: string; color: string } | null>(() => {
    const occ = this.currentOccupancy();
    if (!occ) return null;

    const startDate = occ.moveInDate;
    const today = new Date();
    if (startDate && today < startDate) return null;

    const deposit = occ.deposit || 0;
    if (deposit <= 0) return null;

    const payments = this.payments() ?? [];
    const paidDeposit = payments
      .filter(p => (p as any)?.paymentType === 'Deposit')
      .reduce((sum, p) => sum + ((p as any)?.amountPaid ?? (p as any)?.amount ?? 0), 0);

    const remaining = Math.max(0, deposit - paidDeposit);
    if (remaining <= 0) return null;

    if (paidDeposit <= 0) {
      return {
        label: 'Caution non payée',
        color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      };
    }

    return {
      label: `Reste caution: ${this.formatCurrency(remaining)}`,
      color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
    };
  });
  
  financialStatus = signal<{
    currentMonthBalance: number;
    totalArrears: number;
    lastPaymentDate: Date | null;
    lastPaymentAmount: number;
    nextDueDate: Date | null;
    nextDueAmount: number;
  } | null>(null);

  subTabs = [
    { id: 'contracts', label: 'TENANT.SUB_TABS.CONTRACTS', icon: 'ph-file-text' },
    { id: 'payments', label: 'Paiements', icon: 'ph-wallet' },
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
        
        // ✅ NOUVEAU: Récupérer les infos du bien d'origine si présentes
        if (tabData.fromProperty) {
          this.fromProperty.set(tabData.fromProperty);
          console.log('✅ Opened from property:', tabData.fromProperty.name);
        } else {
          this.fromProperty.set(null);
        }
      } else {
        console.warn('⚠️ No tenantId found in data');
      }
    });
  }

  async printTenantSheet() {
    const t = this.tenant();
    if (!t?.id) {
      this.toasts.errorDirect('Locataire introuvable');
      return;
    }

    this.isPrintingSheet.set(true);
    try {
      const blob = await firstValueFrom(this.documentsApi.downloadTenantSheet(t.id));
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Fiche_Locataire_${t.code || t.id}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('❌ Error printing tenant sheet:', err);
      this.toasts.errorDirect('Erreur lors de la génération de la fiche');
    } finally {
      this.isPrintingSheet.set(false);
    }
  }

  private loadTenant(id: string) {
    this.isLoading.set(true);
    
    // Load tenant details
    this.tenantsService.getTenant(id).subscribe({
      next: (tenant) => {
        this.tenant.set(tenant);
        this.isLoading.set(false);
        console.log('✅ Tenant :', tenant);
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

    // Load rent invoices (échéances)
    this.loadRentInvoices(id);

    // Load contracts
    this.loadContracts(id);

    // Load payment stats
    this.tenantsService.getPaymentStats(id).subscribe({
      next: (stats) => {
        this.paymentStats.set(stats);
        console.log('✅ Payment stats loaded');
      },
      error: (err) => console.error('❌ Error loading payment stats:', err)
    });
  }

  private loadRentInvoices(tenantId: string) {
    this.isLoadingInvoices.set(true);
    this.invoicesApi.getInvoicesByTenant(tenantId).subscribe({
      next: (invoices) => {
        const sorted = [...(invoices ?? [])].sort((a, b) => {
          if (a.year !== b.year) return b.year - a.year;
          return b.month - a.month;
        });
        this.rentInvoices.set(sorted);
        this.isLoadingInvoices.set(false);
      },
      error: (err) => {
        console.error('❌ Error loading tenant invoices:', err);
        this.rentInvoices.set([]);
        this.isLoadingInvoices.set(false);
      }
    });
  }

  async downloadInvoicePdf(invoice: RentInvoiceDto) {
    if (!invoice?.id) return;

    this.downloadingInvoiceId.set(invoice.id);
    try {
      const blob = await firstValueFrom(this.invoicesApi.getInvoicePdf(invoice.id));
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Facture_${invoice.year}${String(invoice.month).padStart(2, '0')}_${invoice.id}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('❌ Error downloading invoice PDF:', err);
      this.toasts.errorDirect('Erreur lors du téléchargement de la facture');
    } finally {
      this.downloadingInvoiceId.set(null);
    }
  }
  private loadContracts(id: string) {
    this.tenantsService.getTenantContracts(id).subscribe({
      next: (contracts) => {
        this.contracts.set(contracts);
        console.log('✅ Tenant contracts loaded:', contracts.length);

        // ✅ Load addendums for tenant contracts
        void this.loadAllAddendumsForContracts();

        // ✅ Calculer occupation actuelle depuis contrat actif
        this.calculateCurrentOccupancy(contracts);

        // ✅ Calculer statut financier depuis paiements
        this.calculateFinancialStatus(id);
      },
      error: (err) => console.error('❌ Error loading tenant contracts:', err)
    });
  }

  async loadAllAddendumsForContracts() {
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

  getSignedAddendums(contractId: string): AddendumDto[] {
    const adds = this.addendumsByContract().get(contractId) ?? [];
    return adds.filter(a => (a.signatureStatus || '').toLowerCase() === 'signed');
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
  
  /**
   * Calculer l'occupation actuelle depuis les contrats
   */
  private calculateCurrentOccupancy(contracts: Contract[]) {
    // Trouver le contrat actif ou signé
    const activeContract = contracts.find(c => {
      const status = c.status?.toLowerCase() || '';
      return status === 'active' || status === 'signed';
    });
    
    if (activeContract) {
      this.currentOccupancy.set({
        propertyName: activeContract.tenantName || 'Bien', // tenantName contient le nom du bien
        propertyCode: activeContract.code || '',
        roomName: activeContract.roomId ? `Chambre ${activeContract.roomId.substring(0, 8)}` : undefined,
        contractId: activeContract.id,
        moveInDate: new Date(activeContract.startDate),
        leaseEndDate: new Date(activeContract.endDate),
        monthlyRent: activeContract.rent || 0,
        monthlyCharges: activeContract.charges || 0,
        deposit: activeContract.deposit || 0
      });
    } else {
      this.currentOccupancy.set(null);
    }
  }
  
  /**
   * Calculer le statut financier depuis les paiements
   */
  private calculateFinancialStatus(tenantId: string) {
    const stats = this.paymentStats();
    const payments = this.payments();
    
    if (!stats) {
      this.financialStatus.set(null);
      return;
    }
    
    // Trouver le dernier paiement
    const sortedPayments = [...payments].sort((a, b) => 
      new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()
    );
    const lastPayment = sortedPayments[0];
    
    // Calculer prochaine échéance (premier jour du mois prochain)
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 5); // 5 du mois
    
    // Calculer montant dû (loyer + charges depuis currentOccupancy)
    const occupancy = this.currentOccupancy();
    const nextDueAmount = occupancy 
      ? occupancy.monthlyRent + occupancy.monthlyCharges 
      : 0;
    
    this.financialStatus.set({
      currentMonthBalance: 0, // TODO: Calculer depuis backend
      totalArrears: 0, // TODO: Calculer depuis backend
      lastPaymentDate: lastPayment ? new Date(lastPayment.paymentDate) : null,
      lastPaymentAmount: lastPayment?.amount || 0,
      nextDueDate: nextMonth,
      nextDueAmount: nextDueAmount
    });
  }

  refreshContracts() {
    const t = this.tenant();
    if (t?.id) {
      this.loadContracts(t.id);
    }
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  openPropertyTab(contract: Contract) {
    const tenant = this.tenant();
    const propertyId = (contract as any)?.propertyId || tenant?.propertyId;

    if (!propertyId) {
      this.toasts.errorDirect('Impossible d\'ouvrir le bien: identifiant manquant');
      return;
    }

    const fromProperty = this.fromProperty();
    const propertyName =
      (contract as any)?.propertyName ||
      fromProperty?.name ||
      tenant?.propertyCode ||
      'Bien';

    this.tabManager.openProperty(propertyId, propertyName, {
      fromTenant: {
        id: tenant?.id,
        name: tenant?.fullName
      }
    });
  }

  async viewContractDocument(contract: Contract, event?: Event) {
    event?.stopPropagation();

    if (!contract?.id) {
      this.toasts.errorDirect('Impossible d\'ouvrir le contrat: identifiant manquant');
      return;
    }

    this.viewerContractId.set(contract.id);
    this.showContractViewer.set(true);
  }

  getTenantInfo() {
    const t = this.tenant();
    if (!t) return null;
    
    // Convertir Contract[] en ContractInfo[]
    const contractInfos = this.contracts().map(c => ({
      id: c.id,
      tenantId: c.tenantId || t.id,
      propertyId: t.propertyId || '', // propertyId vient du tenant, pas du contrat
      propertyName: c.tenantName, // Utiliser tenantName comme fallback
      propertyCode: c.code,
      type: c.type,
      startDate: c.startDate,
      endDate: c.endDate,
      rent: c.rent,
      deposit: c.deposit,
      charges: 0, // charges n'existe pas dans Contract, valeur par défaut
      status: c.status as any, // Type casting pour compatibilité
      signedDate: undefined, // signedDate n'existe pas dans Contract
      createdAt: new Date() // createdAt n'existe pas dans Contract, valeur par défaut
    }));
    
    return {
      id: t.id,
      fullName: t.fullName,
      email: t.email,
      phone: t.phone,
      propertyId: t.propertyId,
      propertyCode: t.propertyCode,
      contracts: contractInfos
    };
  }

  /**
   * Toggle l'affichage des documents d'un contrat
   */
  toggleContractDocuments(contractId: string, event: Event) {
    event.stopPropagation(); // Empêcher l'ouverture de la propriété
    const currentId = this.expandedContractId();
    this.expandedContractId.set(currentId === contractId ? null : contractId);
  }

  /**
   * Vérifie si un contrat doit afficher le panneau de documents
   * Afficher pour: Draft, PartialSigned, FullySigned
   */
  shouldShowDocumentsPanel(contract: Contract): boolean {
    if (!contract.status || typeof contract.status !== 'string') return false;
    const status = contract.status.toLowerCase();
    return status === 'draft' || 
           status === 'partialsigned' || 
           status === 'fullysigned';
  }

  /**
   * Vérifie si un contrat est expanded
   */
  isContractExpanded(contractId: string): boolean {
    return this.expandedContractId() === contractId;
  }

  /**
   * Ouvre le wizard de création de contrat
   */
  openContractWizard() {
    const t = this.tenant();
    if (t?.status === 'Active') {
      return;
    }
    this.showContractWizard.set(true);
  }

  /**
   * Ferme le wizard de création de contrat
   */
  onWizardClosed() {
    this.showContractWizard.set(false);
  }

  /**
   * Callback quand un contrat est créé via le wizard
   */
  onContractCreated() {
    console.log('✅ Contract created');
    this.showContractWizard.set(false);
    // Refresh contracts list
    const t = this.tenant();
    if (t?.id) {
      this.loadContracts(t.id);
    }
  }
  
  // ========== ACTIONS CONTRACTUELLES ==========
  
  /**
   * Vérifier si un contrat peut être renouvelé
   */
  canRenewContract(contract: Contract): boolean {
    if (!contract.status) return false;
    const status = contract.status.toLowerCase();
    
    // Uniquement si Active ou Expiring
    if (status !== 'active' && status !== 'expiring') return false;
    
    // Vérifier si < 60 jours avant expiration
    if (!contract.endDate) return false;
    const endDate = new Date(contract.endDate);
    const today = new Date();
    const daysUntilEnd = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    return daysUntilEnd > 0 && daysUntilEnd <= 60;
  }
  
  /**
   * Vérifier si un contrat peut avoir un avenant
   */
  canCreateAddendum(contract: Contract): boolean {
    if (!contract.status) return false;
    const status = contract.status.toLowerCase();
    return status === 'active' || status === 'signed';
  }
  
  /**
   * Vérifier si un contrat peut avoir un préavis
   */
  canGiveNotice(contract: Contract): boolean {
    if (!contract.status) return false;
    const status = contract.status.toLowerCase();
    return status === 'active' || status === 'signed';
  }
  
  /**
   * Vérifier si EDL entrée peut être créé
   */
  canCreateEntryInventory(contract: Contract): boolean {
    if (!contract.status) return false;
    const status = contract.status.toLowerCase();
    // Si Signed et date début >= aujourd'hui
    return status === 'signed' && new Date(contract.startDate) >= new Date();
  }
  
  /**
   * Vérifier si EDL sortie peut être créé
   */
  canCreateExitInventory(contract: Contract): boolean {
    if (!contract.status) return false;
    const status = contract.status.toLowerCase();
    // Si Active ou Terminated et EDL entrée existe (à vérifier backend)
    return status === 'active' || status === 'terminated';
  }
  
  /**
   * Renouveler un contrat
   */
  renewContract(contract: Contract) {
    this.toasts.infoDirect('Ouverture du wizard de renouvellement...');
    // TODO: Ouvrir le wizard de renouvellement
    // Devrait passer contract comme paramètre
  }
  
  /**
   * Créer un avenant
   */
  createAddendum(contract: Contract) {
    const t = this.tenant();
    if (!t) {
      this.toasts.errorDirect('Locataire introuvable');
      return;
    }

    const propertyId = (contract as any)?.propertyId || t.propertyId;
    if (!propertyId) {
      this.toasts.errorDirect('Bien introuvable pour ce contrat');
      return;
    }

    this.propertiesService.getProperty(propertyId).subscribe({
      next: (prop) => {
        const rooms = (prop.rooms || []).filter(r => r.status === 'Available');
        const data: ContractAddendumData = {
          contract,
          propertyName: prop.name,
          tenantName: t.fullName,
          roomName: (contract as any)?.roomName,
          availableRooms: rooms
        };
        this.addendumWizardData.set(data);
        this.showAddendumWizard.set(true);
      },
      error: () => this.toasts.errorDirect('Erreur lors du chargement du bien')
    });
  }

  onAddendumCompleted() {
    this.showAddendumWizard.set(false);
    this.addendumWizardData.set(null);
    const t = this.tenant();
    if (t?.id) this.loadContracts(t.id);
  }

  onAddendumCancelled() {
    this.showAddendumWizard.set(false);
    this.addendumWizardData.set(null);
  }

  onNoticeCompleted() {
    this.showNoticeWizard.set(false);
    this.selectedContractForNotice.set(null);
    const t = this.tenant();
    if (t?.id) this.loadContracts(t.id);
  }

  onNoticeCancelled() {
    this.showNoticeWizard.set(false);
    this.selectedContractForNotice.set(null);
  }
  
  /**
   * Donner préavis / Rompre contrat
   */
  giveNotice(contract: Contract) {
    const noticeEndDate = (contract as any)?.noticeEndDate;
    const noticeReason = (contract as any)?.noticeReason;
    const noticeDate = (contract as any)?.noticeDate;

    if (noticeEndDate) {
      const end = new Date(noticeEndDate);
      const start = noticeDate ? new Date(noticeDate) : null;
      const details = [
        start ? `Date de notification : ${start.toLocaleDateString()}` : null,
        `Fin de préavis : ${end.toLocaleDateString()}`,
        noticeReason ? `Motif : ${noticeReason}` : null
      ].filter(Boolean).join('\n');

      this.confirmService.ask({
        title: 'Préavis existant',
        message: `${details}\n\nSouhaitez-vous annuler ce préavis ?`,
        type: 'warning',
        confirmText: 'Annuler le préavis',
        cancelText: 'Fermer',
        showCancel: true
      }).then(async (confirmed) => {
        if (!confirmed) return;
        try {
          await firstValueFrom(this.contractsApi.cancelNotice(contract.id));
          this.toasts.successDirect('Préavis annulé');
          const t = this.tenant();
          if (t?.id) this.loadContracts(t.id);
        } catch (err: any) {
          this.toasts.errorDirect(err?.error?.message || 'Erreur lors de l\'annulation du préavis');
        }
      });
      return;
    }

    this.selectedContractForNotice.set(contract);
    this.showNoticeWizard.set(true);
  }
  
  /**
   * Créer EDL entrée
   */
  createEntryInventory(contract: Contract) {
    this.toasts.infoDirect('Ouverture du wizard EDL entrée...');
    // TODO: Ouvrir le wizard EDL entrée
  }
  
  /**
   * Créer EDL sortie
   */
  createExitInventory(contract: Contract) {
    this.inventoriesApi.getByContract(contract.id).subscribe({
      next: (inv) => {
        const entryId = inv?.entry?.id;
        if (!entryId) {
          this.toasts.errorDirect('EDL entrée manquant pour ce contrat');
          return;
        }

        const propertyId = (contract as any)?.propertyId || this.tenant()?.propertyId;
        if (!propertyId) {
          this.toasts.errorDirect('Bien introuvable pour ce contrat');
          return;
        }

        const data: InventoryExitWizardData = {
          contractId: contract.id,
          propertyId,
          propertyName: (contract as any)?.propertyName || this.tenant()?.propertyCode || 'Bien',
          roomId: contract.roomId,
          tenantName: this.tenant()?.fullName || 'Locataire',
          inventoryEntryId: entryId
        };

        this.inventoryExitData.set(data);
        this.showInventoryExitWizard.set(true);
      },
      error: () => this.toasts.errorDirect('Erreur lors de la vérification des EDL')
    });
  }
  
  /**
   * Télécharger PDF du contrat
   */
  async downloadContractPDF(contract: Contract) {
    try {
      const tenant = this.tenant();
      const propertyId = (contract as any)?.propertyId || tenant?.propertyId;
      if (!tenant?.id || !propertyId) {
        this.toasts.errorDirect('Impossible de générer le PDF: données manquantes');
        return;
      }

      const dto = {
        contractId: contract.id,
        tenantId: tenant.id,
        propertyId,
        contractType: 'Bail',
        startDate: new Date(contract.startDate).toISOString().split('T')[0],
        endDate: new Date(contract.endDate).toISOString().split('T')[0],
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
    } catch (error) {
      console.error('❌ Error generating contract PDF:', error);
      this.toasts.errorDirect('Erreur lors de la génération du PDF');
    }
  }

  handleInventoryExitClose(_: any) {
    this.showInventoryExitWizard.set(false);
    this.inventoryExitData.set(null);
  }
  
  /**
   * Afficher historique du contrat
   */
  showContractHistory(contract: Contract) {
    this.toasts.infoDirect('Ouverture de l\'historique...');
    // TODO: Ouvrir modal historique avec avenants, paiements, etc.
  }
  
  // ========== ACTION DISSOCIER ==========
  
  /**
   * Vérifier si le locataire peut être dissocié du bien
   */
  canDissociateTenant(): boolean {
    const activeContracts = this.contracts().filter(c => {
      const status = c.status?.toLowerCase() || '';
      return status === 'active' || status === 'signed';
    });
    
    // Interdit si contrat actif
    return activeContracts.length === 0;
  }
  
  /**
   * Dissocier le locataire du bien
   */
  async dissociateTenant() {
    const tenant = this.tenant();
    if (!tenant) return;

    const assoc = this.associatedProperty();
    if (!assoc?.id) {
      this.toasts.errorDirect('Impossible: aucun bien associé à ce locataire.');
      return;
    }
    
    // Vérification des contrats actifs
    if (!this.canDissociateTenant()) {
      this.toasts.errorDirect(
        'Dissociation impossible: Le locataire a encore des contrats actifs ou signés. ' +
        'Vous devez d\'abord terminer ou annuler tous les contrats.'
      );
      return;
    }
    
    // Vérifier si EDL sortie validé (TODO: à implémenter)
    
    const confirmed = await this.confirmService.warning(
      'Dissocier le locataire',
      `Êtes-vous sûr de vouloir dissocier ${tenant.fullName} du bien ?\n\n` +
      'Cette action va:\n' +
      '• Mettre le statut du locataire à "Departed"\n' +
      '• Libérer le bien/chambre\n' +
      '• Historiser la dissociation\n\n' +
      'Cette action est irréversible.'
    );
    
    if (!confirmed) return;
    
    try {
      await firstValueFrom(this.propertiesService.dissociateTenant(assoc.id, tenant.id));
      
      this.toasts.successDirect(
        `Locataire dissocié: ${tenant.fullName} a été dissocié du bien avec succès.`
      );
      
      // Recharger les données
      this.loadTenant(tenant.id);
    } catch (error: any) {
      this.toasts.errorDirect(
        error.error?.message || 'Erreur: Impossible de dissocier le locataire'
      );
    }
  }
  
  // ========== HELPERS ==========
  
  /**
   * Obtenir la classe de couleur selon le statut de paiement
   */
  getPaymentStatusColor(arrears: number): string {
    if (arrears === 0) return 'text-emerald-600';
    if (arrears < 0) return 'text-orange-600';
    return 'text-red-600';
  }
  
  /**
   * Formater le montant en euros
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  }
  
  /**
   * Calculer les jours restants avant la fin du bail
   */
  getDaysUntilLeaseEnd(endDate: Date | string): number {
    const end = new Date(endDate);
    const today = new Date();
    return Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }
  
  /**
   * Obtenir le badge de statut du contrat
   */
  getContractStatusBadge(status: string): { label: string; color: string } {
    const s = status?.toLowerCase() || '';
    
    if (s === 'draft') return { label: 'Brouillon', color: 'bg-slate-100 text-slate-700' };
    if (s === 'pending') return { label: 'En attente', color: 'bg-yellow-100 text-yellow-700' };
    if (s === 'signed') return { label: 'Signé', color: 'bg-blue-100 text-blue-700' };
    if (s === 'active') return { label: 'Actif', color: 'bg-emerald-100 text-emerald-700' };
    if (s === 'terminated') return { label: 'Résilié', color: 'bg-red-100 text-red-700' };
    if (s === 'expired') return { label: 'Expiré', color: 'bg-gray-100 text-gray-700' };
    if (s === 'renewed') return { label: 'Renouvelé', color: 'bg-purple-100 text-purple-700' };
    
    return { label: status, color: 'bg-slate-100 text-slate-700' };
  }
  
  /**
   * Calculer l'âge depuis la date de naissance
   */
  calculateAge(birthDate: Date | string): number {
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  }
  
  /**
   * Obtenir le label du type de pièce d'identité
   */
  getIdCardTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'CNI': 'Carte Nationale d\'Identité',
      'Passport': 'Passeport',
      'TitreSejour': 'Titre de Séjour',
      'PermisConduire': 'Permis de Conduire'
    };
    return labels[type] || type;
  }
  
  /**
   * Obtenir le badge du statut du dossier
   */
  getFileStatusBadge(status: string): { label: string; color: string; icon: string } {
    if (status === 'Complete') return { 
      label: 'Complet', 
      color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30', 
      icon: 'ph-check-circle' 
    };
    if (status === 'Validated') return { 
      label: 'Validé', 
      color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30', 
      icon: 'ph-seal-check' 
    };
    if (status === 'Pending') return { 
      label: 'En attente', 
      color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30', 
      icon: 'ph-clock' 
    };
    return { 
      label: 'Incomplet', 
      color: 'bg-red-100 text-red-700 dark:bg-red-900/30', 
      icon: 'ph-warning' 
    };
  }
}
