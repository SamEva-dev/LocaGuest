import { Component, input, signal, inject, effect, computed } from '@angular/core';
import { DatePipe } from '@angular/common';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { InternalTabManagerService } from '../../../../core/services/internal-tab-manager.service';
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
import { InventoryEntryWizardData, InventoryEntryWizardSimpleComponent } from '../property-contracts/inventory-entry-wizard/inventory-entry-wizard-simple';
import { InventoryExitWizardData, InventoryExitWizardSimpleComponent } from '../property-contracts/inventory-exit-wizard/inventory-exit-wizard-simple';
import { ContractViewerModal } from '../../components/contract-viewer-modal/contract-viewer-modal';
import { ContractAddendumData, ContractAddendumWizard } from '../property-contracts/contract-addendum-wizard/contract-addendum-wizard';
import { ContractNoticeData, ContractNoticeWizard } from '../property-contracts/contract-notice-wizard/contract-notice-wizard';
import { AddendumsApi, AddendumDto } from '../../../../core/api/addendums.api';
import { InvoicesApi, RentInvoiceDto } from '../../../../core/api/invoices.api';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { Permissions } from '../../../../core/auth/permissions';
import { DepositsApi, DepositDto } from '../../../../core/api/deposits.api';
import { ContractRenewalData, ContractRenewalWizard } from '../property-contracts/contract-renewal-wizard/contract-renewal-wizard';
import { AvatarStorageService } from '../../../../core/services/avatar-storage.service';

@Component({
  selector: 'tenant-detail-tab',
  standalone: true,
  imports: [
    TranslatePipe, 
    DatePipe, 
    DocumentsManagerComponent,
    ContractDocumentsStatusComponent,
    ContractWizardModal,
    TenantPaymentsTab,
    InventoryEntryWizardSimpleComponent,
    InventoryExitWizardSimpleComponent,
    ContractViewerModal,
    ContractAddendumWizard,
    ContractRenewalWizard,
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
  private auth = inject(AuthService);
  private depositsApi = inject(DepositsApi);
  private avatarStorage = inject(AvatarStorageService);
  private translate = inject(TranslateService);

  activeSubTab = signal('contracts');
  isLoading = signal(false);
  
  tenant = signal<TenantDetail | null>(null);
  tenantAvatarDataUrl = signal<string | null>(null);
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

  triggerTenantAvatarUpload() {
    const t = this.tenant();
    if (!t?.id) return;

    const inputEl = document.createElement('input');
    inputEl.type = 'file';
    inputEl.accept = 'image/*';

    inputEl.onchange = (e: any) => {
      const file: File | undefined = e?.target?.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (ev: any) => {
        const dataUrl = ev?.target?.result as string | undefined;
        if (!dataUrl) return;
        this.avatarStorage.setTenantAvatarDataUrl(t.id, dataUrl);
        this.tenantAvatarDataUrl.set(dataUrl);
      };
      reader.readAsDataURL(file);
    };

    inputEl.click();
  }

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

  downloadingDepositReceipt = signal(false);

  async downloadDepositReceiptPdf() {
    const occ = this.currentOccupancy();
    if (!occ?.contractId) return;

    this.downloadingDepositReceipt.set(true);
    try {
      const blob = await firstValueFrom(this.depositsApi.getReceiptPdfByContract(occ.contractId));
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Recu_Caution_${occ.contractId}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('❌ Error downloading deposit receipt PDF:', err);
      this.toasts.error('TENANT.TOAST.DEPOSIT_RECEIPT_DOWNLOAD_ERROR');
    } finally {
      this.downloadingDepositReceipt.set(false);
    }
  }
  
  // Pour gérer l'expansion des documents de contrat
  expandedContractId = signal<string | null>(null);

  showContractViewer = signal(false);
  viewerContractId = signal<string | null>(null);

  showInventoryEntryWizard = signal(false);
  inventoryEntryData = signal<InventoryEntryWizardData | null>(null);

  showInventoryExitWizard = signal(false);
  inventoryExitData = signal<InventoryExitWizardData | null>(null);

  showRenewalWizard = signal(false);
  renewalWizardData = signal<ContractRenewalData | null>(null);

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

  depositInfo = signal<DepositDto | null>(null);

  depositBadge = computed<{ labelKey: string; labelParams?: any; color: string; icon: string } | null>(() => {
    const occ = this.currentOccupancy();
    
    if (!occ) return null;

  
    const startDate = occ.moveInDate;
    const today = new Date();

    const d = this.depositInfo();
    if (!d) return null;

    if ((d.amountExpected ?? 0) <= 0) return null;

    const status = (d.status || '').toLowerCase();

    const remaining = Math.max(0, d.outstanding ?? 0);
    if (remaining <= 0 || status === 'held' || status === 'closed') {
      return {
        labelKey: 'DEPOSITS.BADGE.PAID',
        color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
        icon: 'ph-check-circle'
      };
    }

    if (status === 'expected' || (d.totalReceived ?? 0) <= 0) {
      return {
        labelKey: 'DEPOSITS.BADGE.UNPAID',
        color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        icon: 'ph-warning-circle'
      };
    }

    return {
      labelKey: 'DEPOSITS.BADGE.REMAINING',
      labelParams: { amount: this.formatCurrency(remaining) },
      color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
      icon: 'ph-hourglass-medium'
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
    { id: 'payments', label: 'TENANT.SUB_TABS.PAYMENTS', icon: 'ph-wallet' },
    { id: 'payment-history', label: 'TENANT.SUB_TABS.PAYMENT_HISTORY', icon: 'ph-currency-eur' },
    { id: 'documents', label: 'TENANT.SUB_TABS.DOCUMENTS', icon: 'ph-folder' },
  ];

  get visibleSubTabs() {
    return this.subTabs.filter(t => this.canAccessSubTab(t.id));
  }

  constructor() {
    effect(() => {
      const t = this.tenant();
      if (!t?.id) {
        this.tenantAvatarDataUrl.set(null);
        return;
      }
      this.tenantAvatarDataUrl.set(this.avatarStorage.getTenantAvatarDataUrl(t.id));
    });

    effect(() => {
      if (!this.canAccessSubTab(this.activeSubTab())) {
        this.activeSubTab.set('contracts');
      }
    });

    effect(() => {
      const tabData = this.data();
      if (tabData?.tenantId) {
        this.loadTenant(tabData.tenantId);
        
        // ✅ NOUVEAU: Récupérer les infos du bien d'origine si présentes
        if (tabData.fromProperty) {
          this.fromProperty.set(tabData.fromProperty);
        } else {
          this.fromProperty.set(null);
        }
      }
    });
  }

  private canAccessSubTab(tabId: string): boolean {
    switch (tabId) {
      case 'contracts':
        return this.auth.hasPermission(Permissions.ContractsRead);
      case 'payments':
      case 'payment-history':
        return this.auth.hasPermission(Permissions.AnalyticsRead);
      case 'documents':
        return this.auth.hasPermission(Permissions.DocumentsRead);
      default:
        return true;
    }
  }

  selectSubTab(tabId: string) {
    if (!this.canAccessSubTab(tabId)) {
      return;
    }
    this.activeSubTab.set(tabId);
  }

  async printTenantSheet() {
    if (!this.auth.hasPermission(Permissions.DocumentsGenerate) && !this.auth.hasPermission(Permissions.DocumentsRead)) {
      this.toasts.error('COMMON.ACCESS_DENIED');
      return;
    }
    const t = this.tenant();
    if (!t?.id) {
      this.toasts.error('TENANT.TOAST.NOT_FOUND');
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
      this.toasts.error('TENANT.TOAST.SHEET_GENERATION_ERROR');
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
      this.toasts.error('TENANT.TOAST.INVOICE_DOWNLOAD_ERROR');
    } finally {
      this.downloadingInvoiceId.set(null);
    }
  }
  private loadContracts(id: string) {
    this.tenantsService.getTenantContracts(id).subscribe({
      next: (contracts) => {
        this.contracts.set(contracts);

        // ✅ Load addendums for tenant contracts
        void this.loadAllAddendumsForContracts();

        // ✅ Calculer occupation actuelle depuis contrat actif
        this.calculateCurrentOccupancy(contracts);

        // ✅ Charger la caution (module Deposit) du contrat actif
        void this.loadDepositForActiveContract(contracts);

        // ✅ Calculer statut financier depuis paiements
        this.calculateFinancialStatus(id);
      },
      error: (err) => console.error('❌ Error loading tenant contracts:', err)
    });
  }

  private async loadDepositForActiveContract(contracts: Contract[]) {
    const activeContract = contracts.find(c => {
      const status = c.status?.toLowerCase() || '';
      return status === 'active' || status === 'signed';
    });

    if (!activeContract?.id) {
      this.depositInfo.set(null);
      return;
    }

    try {
      const d = await firstValueFrom(this.depositsApi.getByContract(activeContract.id));
      this.depositInfo.set(d);
    } catch {
      this.depositInfo.set(null);
    }
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

  getNextSignedFutureAddendum(contractId: string): AddendumDto | null {
    const now = new Date();
    const signed = this.getSignedAddendums(contractId);

    const future = signed
      .filter(a => {
        const d = a.effectiveDate ? new Date(a.effectiveDate) : null;
        return !!d && d.getTime() > now.getTime();
      })
      .sort((a, b) => (a.effectiveDate || '').localeCompare(b.effectiveDate || ''));

    return future[0] ?? null;
  }

  getAddendumFutureSummary(addendum: AddendumDto): string {
    const parts: string[] = [];
    if (addendum.newRent != null) parts.push(`Loyer: ${this.formatCurrency(addendum.newRent)}`);
    if (addendum.newCharges != null) parts.push(`Charges: ${this.formatCurrency(addendum.newCharges)}`);
    if (addendum.newEndDate) parts.push(`Fin: ${new Date(addendum.newEndDate).toLocaleDateString('fr-FR')}`);
    return parts.join(' · ');
  }

  async downloadAddendumPdf(addendum: AddendumDto, event?: Event) {
    event?.stopPropagation();
    const docId = addendum.attachedDocumentIds?.[0];
    if (!docId) {
      this.toasts.warning('TENANT.TOAST.ADDENDUM_PDF_NOT_FOUND');
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
      this.toasts.error('TENANT.TOAST.PDF_DOWNLOAD_ERROR');
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
      const fromProperty = this.fromProperty();
      const propertyName =
        (activeContract as any)?.propertyName ||
        this.associatedProperty()?.name ||
        fromProperty?.name ||
        this.associatedProperty()?.code ||
        fromProperty?.code ||
        'Bien';

      const propertyCode =
        (activeContract as any)?.propertyCode ||
        this.associatedProperty()?.code ||
        fromProperty?.code ||
        activeContract.code ||
        '';

      this.currentOccupancy.set({
        propertyName,
        propertyCode,
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
      this.toasts.error('TENANT.TOAST.OPEN_PROPERTY_MISSING_ID');
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
      this.toasts.error('TENANT.TOAST.OPEN_CONTRACT_MISSING_ID');
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
    const t = this.tenant();
    if (!t) {
      this.toasts.error('TENANT.TOAST.NOT_FOUND');
      return;
    }

    const propertyId = (contract as any)?.propertyId || t.propertyId;
    if (!propertyId) {
      this.toasts.error('TENANT.TOAST.PROPERTY_NOT_FOUND_FOR_CONTRACT');
      return;
    }

    this.propertiesService.getProperty(propertyId).subscribe({
      next: (prop) => {
        const data: ContractRenewalData = {
          contract,
          propertyName: prop.name,
          tenantName: t.fullName,
          roomName: (contract as any)?.roomName
        };

        this.renewalWizardData.set(data);
        this.showRenewalWizard.set(true);
      },
      error: () => this.toasts.error('TENANT.TOAST.PROPERTY_LOAD_ERROR')
    });
  }

  onRenewalCompleted(_: string) {
    this.showRenewalWizard.set(false);
    this.renewalWizardData.set(null);
    const t = this.tenant();
    if (t?.id) this.loadContracts(t.id);
  }

  onRenewalCancelled() {
    this.showRenewalWizard.set(false);
    this.renewalWizardData.set(null);
  }
  
  /**
   * Créer un avenant
   */
  createAddendum(contract: Contract) {
    const t = this.tenant();
    if (!t) {
      this.toasts.error('TENANT.TOAST.NOT_FOUND');
      return;
    }

    const propertyId = (contract as any)?.propertyId || t.propertyId;
    if (!propertyId) {
      this.toasts.error('TENANT.TOAST.PROPERTY_NOT_FOUND_FOR_CONTRACT');
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
      error: () => this.toasts.error('TENANT.TOAST.PROPERTY_LOAD_ERROR')
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
        start ? this.translate.instant('TENANT.NOTICE.EXISTING.DETAILS.NOTIFIED_ON', { date: start.toLocaleDateString() }) : null,
        this.translate.instant('TENANT.NOTICE.EXISTING.DETAILS.ENDS_ON', { date: end.toLocaleDateString() }),
        noticeReason ? this.translate.instant('TENANT.NOTICE.EXISTING.DETAILS.REASON', { reason: noticeReason }) : null
      ].filter(Boolean).join('\n');

      this.confirmService.ask({
        title: this.translate.instant('TENANT.NOTICE.EXISTING.TITLE'),
        message: this.translate.instant('TENANT.NOTICE.EXISTING.MESSAGE', { details }),
        type: 'warning',
        confirmText: this.translate.instant('TENANT.NOTICE.EXISTING.CONFIRM'),
        cancelText: this.translate.instant('COMMON.CLOSE'),
        showCancel: true
      }).then(async (confirmed) => {
        if (!confirmed) return;
        try {
          await firstValueFrom(this.contractsApi.cancelNotice(contract.id));
          this.toasts.success('TENANT.TOAST.NOTICE_CANCELLED');
          const t = this.tenant();
          if (t?.id) this.loadContracts(t.id);
        } catch (err: any) {
          this.toasts.errorDirect(err?.error?.message || this.translate.instant('TENANT.TOAST.NOTICE_CANCEL_ERROR'));
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
    const t = this.tenant();
    if (!t) {
      this.toasts.error('TENANT.TOAST.NOT_FOUND');
      return;
    }

    const propertyId = (contract as any)?.propertyId || t.propertyId;
    if (!propertyId) {
      this.toasts.error('TENANT.TOAST.PROPERTY_NOT_FOUND_FOR_CONTRACT');
      return;
    }

    this.propertiesService.getProperty(propertyId).subscribe({
      next: (prop) => {
        const data: InventoryEntryWizardData = {
          contractId: contract.id,
          propertyId,
          propertyName: prop.name,
          roomId: contract.roomId || undefined,
          roomName: (contract as any)?.roomName,
          tenantName: t.fullName
        };

        this.inventoryEntryData.set(data);
        this.showInventoryEntryWizard.set(true);
      },
      error: () => this.toasts.error('TENANT.TOAST.PROPERTY_LOAD_ERROR')
    });
  }

  closeInventoryEntryWizard() {
    this.showInventoryEntryWizard.set(false);
    this.inventoryEntryData.set(null);
    const t = this.tenant();
    if (t?.id) this.loadContracts(t.id);
  }
  
  /**
   * Créer EDL sortie
   */
  createExitInventory(contract: Contract) {
    this.inventoriesApi.getByContract(contract.id).subscribe({
      next: (inv) => {
        const entryId = inv?.entry?.id;
        if (!entryId) {
          this.toasts.error('TENANT.TOAST.INVENTORY_ENTRY_MISSING');
          return;
        }

        const propertyId = (contract as any)?.propertyId || this.tenant()?.propertyId;
        if (!propertyId) {
          this.toasts.error('TENANT.TOAST.PROPERTY_NOT_FOUND_FOR_CONTRACT');
          return;
        }

        const data: InventoryExitWizardData = {
          contractId: contract.id,
          propertyId,
          propertyName: (contract as any)?.propertyName || this.tenant()?.propertyCode || this.translate.instant('COMMON.PROPERTY'),
          roomId: contract.roomId,
          tenantName: this.tenant()?.fullName || this.translate.instant('COMMON.TENANT'),
          inventoryEntryId: entryId
        };

        this.inventoryExitData.set(data);
        this.showInventoryExitWizard.set(true);
      },
      error: () => this.toasts.error('TENANT.TOAST.INVENTORY_CHECK_ERROR')
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
        this.toasts.error('TENANT.TOAST.GENERATE_PDF_MISSING_DATA');
        return;
      }

      const dto = {
        contractId: contract.id,
        tenantId: tenant.id,
        propertyId,
        contractType: this.translate.instant('CONTRACT.TYPE_LEASE'),
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
      this.toasts.error('TENANT.TOAST.PDF_GENERATION_ERROR');
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
      this.toasts.error('TENANT.TOAST.NO_ASSOCIATED_PROPERTY');
      return;
    }
    
    // Vérification des contrats actifs
    if (!this.canDissociateTenant()) {
      this.toasts.error('TENANT.TOAST.DISSOCIATE_NOT_ALLOWED');
      return;
    }
    
    // Vérifier si EDL sortie validé (TODO: à implémenter)
    
    const confirmed = await this.confirmService.warning(
      this.translate.instant('TENANT.DISSOCIATE.CONFIRM.TITLE'),
      this.translate.instant('TENANT.DISSOCIATE.CONFIRM.MESSAGE', { name: tenant.fullName })
    );
    
    if (!confirmed) return;
    
    try {
      await firstValueFrom(this.propertiesService.dissociateTenant(assoc.id, tenant.id));
      
      this.toasts.successDirect(this.translate.instant('TENANT.TOAST.DISSOCIATE_SUCCESS', { name: tenant.fullName }));
      
      // Recharger les données
      this.loadTenant(tenant.id);
    } catch (error: any) {
      this.toasts.errorDirect(error.error?.message || this.translate.instant('TENANT.TOAST.DISSOCIATE_ERROR'));
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
    
    if (s === 'draft') return { label: this.translate.instant('CONTRACT.STATUS.DRAFT'), color: 'bg-slate-100 text-slate-700' };
    if (s === 'pending') return { label: this.translate.instant('CONTRACT.STATUS.PENDING'), color: 'bg-yellow-100 text-yellow-700' };
    if (s === 'signed') return { label: this.translate.instant('CONTRACT.STATUS.SIGNED'), color: 'bg-blue-100 text-blue-700' };
    if (s === 'active') return { label: this.translate.instant('CONTRACT.STATUS.ACTIVE'), color: 'bg-emerald-100 text-emerald-700' };
    if (s === 'terminated') return { label: this.translate.instant('CONTRACT.STATUS.TERMINATED'), color: 'bg-red-100 text-red-700' };
    if (s === 'expired') return { label: this.translate.instant('CONTRACT.STATUS.EXPIRED'), color: 'bg-gray-100 text-gray-700' };
    if (s === 'renewed') return { label: this.translate.instant('CONTRACT.STATUS.RENEWED'), color: 'bg-purple-100 text-purple-700' };
    
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
    const key = `TENANT.ID_CARD_TYPE.${type}`;
    const translated = this.translate.instant(key);
    return translated && translated !== key ? translated : type;
  }
  
  /**
   * Obtenir le badge du statut du dossier
   */
  getFileStatusBadge(status: string): { label: string; color: string; icon: string } {
    if (status === 'Complete') return { 
      label: this.translate.instant('TENANT.FILE_STATUS.COMPLETE'), 
      color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30', 
      icon: 'ph-check-circle' 
    };
    if (status === 'Validated') return { 
      label: this.translate.instant('TENANT.FILE_STATUS.VALIDATED'), 
      color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30', 
      icon: 'ph-seal-check' 
    };
    if (status === 'Pending') return { 
      label: this.translate.instant('TENANT.FILE_STATUS.PENDING'), 
      color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30', 
      icon: 'ph-clock' 
    };
    return { 
      label: this.translate.instant('TENANT.FILE_STATUS.INCOMPLETE'), 
      color: 'bg-red-100 text-red-700 dark:bg-red-900/30', 
      icon: 'ph-warning' 
    };
  }
}
