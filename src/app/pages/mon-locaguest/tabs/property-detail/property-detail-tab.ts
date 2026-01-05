import { Component, input, signal, inject, effect, viewChild } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { InternalTabManagerService } from '../../../../core/services/internal-tab-manager.service';
import { RevenueChart } from '../../../../components/charts/revenue-chart/revenue-chart';
import { PropertyDetail, Payment, Contract, FinancialSummary, CreateContractDto } from '../../../../core/api/properties.api';
import { TenantListItem } from '../../../../core/api/tenants.api';
import { DocumentsApi, DocumentCategory, DocumentDto } from '../../../../core/api/documents.api';
import { PropertiesService } from '../../../../core/services/properties.service';
import { TenantSelectionModal, TenantSelectionResult } from '../../components/tenant-selection-modal/tenant-selection-modal';
import { ToastService } from '../../../../core/ui/toast.service';
import { ConfirmService } from '../../../../core/ui/confirm.service';
import { PropertyInfoTab } from '../property-info/property-info-tab';
import { PropertyTenantsTab } from '../property-tenants/property-tenants-tab';
import { PropertyContractsTab } from '../property-contracts/property-contracts-tab';
import { PropertyPaymentsTab } from '../property-payments/property-payments-tab';

@Component({
  selector: 'property-detail-tab',
  standalone: true,
  imports: [TranslatePipe, DatePipe, FormsModule, RevenueChart, TenantSelectionModal, PropertyInfoTab, PropertyTenantsTab, PropertyContractsTab, PropertyPaymentsTab],
  templateUrl: './property-detail-tab.html'
})
export class PropertyDetailTab {
  data = input<any>();
  private tabManager = inject(InternalTabManagerService);
  private propertiesService = inject(PropertiesService);
  private documentsApi = inject(DocumentsApi);
  
  // ✅ Services UI
  private toasts = inject(ToastService);
  private confirmService = inject(ConfirmService);
  
  tenantModal = viewChild<TenantSelectionModal>('tenantModal');
  contractsTab = viewChild<PropertyContractsTab>('contractsTab');
  infoTab = viewChild<PropertyInfoTab>('infoTab');

  private autoEditDone = signal(false);

  activeSubTab = signal('informations');
  isLoading = signal(false);
  
  property = signal<PropertyDetail | null>(null);
  payments = signal<Payment[]>([]);
  recentPayments = signal<Payment[]>([]);
  contracts = signal<Contract[]>([]);
  associatedTenants = signal<TenantListItem[]>([]);
  financialSummary = signal<FinancialSummary | null>(null);
  documentCategories = signal<DocumentCategory[]>([]);
  
  showTenantModal = signal(false);
  availableTenants = signal<any[]>([]);
  
  showDissociationModal = signal(false);
  dissociationForm = signal<{
    tenantId: string;
    tenantName: string;
    reason: string;
    customReason: string;
  } | null>(null);
  
  dissociationReasons = [
    'Fin de bail',
    'Résiliation anticipée',
    'Non-paiement',
    'Vente du bien',
    'Travaux',
    'Autre (préciser)'
  ];

  subTabs = [
    { id: 'informations', label: 'PROPERTY.SUB_TABS.INFORMATIONS', icon: 'ph-info' },
    { id: 'tenants', label: 'PROPERTY.SUB_TABS.TENANTS', icon: 'ph-users-three' },
    { id: 'contracts', label: 'PROPERTY.SUB_TABS.CONTRACTS', icon: 'ph-file-text' },
    { id: 'documents', label: 'PROPERTY.SUB_TABS.DOCUMENTS', icon: 'ph-folder' },
    { id: 'payments', label: 'PROPERTY.SUB_TABS.PAYMENTS', icon: 'ph-currency-eur' },
    { id: 'projection', label: 'PROPERTY.SUB_TABS.PROJECTION', icon: 'ph-chart-line-up' },
  ];

  constructor() {
    effect(() => {
      const tabData = this.data();
      if (tabData?.propertyId) {
        this.autoEditDone.set(false);
        this.loadProperty(tabData.propertyId);
      }
    });

    effect(() => {
      const tabData = this.data();
      const prop = this.property();
      const info = this.infoTab();

      if (!tabData?.edit) return;
      if (!prop) return;
      if (!info) return;
      if (this.autoEditDone()) return;

      this.activeSubTab.set('informations');

      setTimeout(() => {
        this.infoTab()?.startEditing();
        this.autoEditDone.set(true);
      }, 0);
    });
    
    // ✅ Charger les EDL quand la tab "contracts" est activée
    effect(() => {
      const currentTab = this.activeSubTab();
      const contractsTabRef = this.contractsTab();
      
      if (currentTab === 'contracts' && contractsTabRef) {
        contractsTabRef.initializeInventories();
      }
    });
  }

  reloadProperty() {
    const tabData = this.data();
    if (tabData?.propertyId) {
      this.loadProperty(tabData.propertyId);
    }
  }

  private loadProperty(id: string) {
    this.isLoading.set(true);
    
    // Load property details
    this.propertiesService.getProperty(id).subscribe({
      next: (property) => {
        this.property.set(property);
        this.isLoading.set(false);
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
      },
      error: (err) => console.error('❌ Error loading payments:', err)
    });

    // Load contracts
    this.propertiesService.getPropertyContracts(id).subscribe({
      next: (contracts) => {
        this.contracts.set(contracts);
      },
      error: (err) => console.error('❌ Error loading contracts:', err)
    });

    // Load associated tenants
    this.propertiesService.getAssociatedTenants(id).subscribe({
      next: (tenants) => {
        this.associatedTenants.set(tenants);
      },
      error: (err) => console.error('❌ Error loading associated tenants:', err)
    });

    // Load financial summary
    this.propertiesService.getFinancialSummary(id).subscribe({
      next: (summary) => {
        this.financialSummary.set(summary);
      },
      error: (err) => console.error('❌ Error loading financial summary:', err)
    });

    // Load documents
    this.documentsApi.getPropertyDocuments(id).subscribe({
      next: (categories) => {
        this.documentCategories.set(categories);
      },
      error: (err) => console.error('❌ Error loading documents:', err)
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
    this.propertiesService.getAvailableTenants(propertyId).subscribe({
      next: (tenants: any) => {
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
        this.toasts.errorDirect('Erreur lors du chargement des locataires disponibles');
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
      startDate: result.startDate.toISOString(),  // Convertir en ISO string
      endDate: result.endDate.toISOString(),      // Convertir en ISO string
      rent: result.rent,
      deposit: result.deposit
    };
    this.propertiesService.assignTenant(propertyId, contractDto).subscribe({
      next: (contract: any) => {
        this.showTenantModal.set(false);
        // Recharger les contrats
        this.loadProperty(propertyId);
        this.toasts.successDirect(`Locataire ${result.tenantName} associé avec succès !`);
      },
      error: (err: any) => {
        console.error('❌ Error assigning tenant:', err);
        const errorMsg = err?.error?.message || err?.message || 'Erreur inconnue';
        this.toasts.errorDirect(`Erreur lors de l'association du locataire: ${errorMsg}`);
      }
    });
  }

  openTenantTab(tenant: TenantListItem) {
    if (!tenant.id) return;
    this.tabManager.openTenant(tenant.id, tenant.fullName || 'Tenant');
  }

  dissociateTenant(tenant: TenantListItem) {
    const tenantName = tenant.fullName || 'ce locataire';
    const propertyId = this.data()?.propertyId;
    
    if (!propertyId || !tenant.id) {
      console.error('⚠️ Missing propertyId or tenantId');
      return;
    }

    // Ouvrir le modal de dissociation
    this.dissociationForm.set({
      tenantId: tenant.id,
      tenantName: tenantName,
      reason: '',
      customReason: ''
    });
    this.showDissociationModal.set(true);
  }

  closeDissociationModal() {
    this.showDissociationModal.set(false);
    this.dissociationForm.set(null);
  }

  confirmDissociation() {
    const propertyId = this.data()?.propertyId;
    const form = this.dissociationForm();
    if (!propertyId || !form?.tenantId) return;

    const reason = (form.reason || '').trim();
    if (!reason) {
      this.toasts.errorDirect('Veuillez sélectionner un motif de dissociation');
      return;
    }

    const customReason = (form.customReason || '').trim();
    if (reason === 'Autre (préciser)' && !customReason) {
      this.toasts.errorDirect('Veuillez préciser le motif de la dissociation');
      return;
    }

    const finalReason = reason === 'Autre (préciser)' ? customReason : reason;
    void finalReason;

    this.propertiesService.dissociateTenant(propertyId, form.tenantId).subscribe({
      next: () => {
        this.closeDissociationModal();
        this.loadProperty(propertyId);
        this.toasts.successDirect('Association retirée avec succès');
      },
      error: (err: any) => {
        console.error('❌ Error dissociating tenant:', err);
        this.toasts.errorDirect('Erreur lors de la dissociation du locataire');
      }
    });
  }

  getUsageTypeIcon(usageType?: string): string {
    switch(usageType) {
      case 'Complete': return 'ph-house';
      case 'Colocation': return 'ph-users-three';
      case 'Airbnb': return 'ph-airplane-in-flight';
      default: return 'ph-house';
    }
  }

  getUsageTypeLabel(usageType?: string): string {
    switch(usageType) {
      case 'Complete': return 'Location complète';
      case 'Colocation': return 'Colocation';
      case 'Airbnb': return 'Airbnb';
      default: return 'Non défini';
    }
  }

  getUsageTypeColor(usageType?: string): string {
    switch(usageType) {
      case 'Complete': return 'emerald';
      case 'Colocation': return 'blue';
      case 'Airbnb': return 'purple';
      default: return 'slate';
    }
  }

  getStatusClass(status: string): string {
    switch(status) {
      case 'Vacant': return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
      case 'Occupied': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'PartiallyOccupied': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
    }
  }

  getStatusLabel(status: string): string {
    switch(status) {
      case 'Vacant': return 'Vacant';
      case 'Occupied': return 'Occupé';
      case 'PartiallyOccupied': return 'Partiellement occupé';
      default: return status;
    }
  }

  downloadDocument(doc: DocumentDto) {
    this.documentsApi.downloadDocument(doc.id).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = doc.fileName;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err: any) => {
        console.error('❌ Error downloading document:', err);
        this.toasts.errorDirect('Erreur lors du téléchargement du document');
      }
    });
  }

  viewDocument(doc: DocumentDto) {
    this.documentsApi.downloadDocument(doc.id).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
      },
      error: (err: any) => {
        console.error('❌ Error viewing document:', err);
        this.toasts.errorDirect('Erreur lors de l\'ouverture du document');
      }
    });
  }

  async deleteDocument(doc: DocumentDto) {
    const propertyId = this.data()?.propertyId;
    if (!propertyId) return;

    const confirmed = await this.confirmService.warning(
      'Dissocier le document',
      `Êtes-vous sûr de vouloir dissocier le document "${doc.fileName}" ?`
    );
    if (!confirmed) return;
    this.documentsApi.dissociateDocument(doc.id).subscribe({
      next: () => {
        this.toasts.successDirect('Document dissocié avec succès');
        // Recharger les documents
        this.documentsApi.getPropertyDocuments(propertyId).subscribe({
          next: (categories) => {
            this.documentCategories.set(categories);
          },
          error: (err) => console.error('❌ Error reloading documents:', err)
        });
      },
      error: (err: any) => {
        console.error('❌ Error dissociating document:', err);
        this.toasts.errorDirect('Erreur lors de la dissociation du document');
      }
    });
  }

  getDocumentIcon(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch(ext) {
      case 'pdf': return 'ph-file-pdf';
      case 'doc':
      case 'docx': return 'ph-file-doc';
      case 'xls':
      case 'xlsx': return 'ph-file-xls';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif': return 'ph-file-image';
      case 'zip':
      case 'rar': return 'ph-file-zip';
      default: return 'ph-file';
    }
  }

  getDocumentIconColor(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch(ext) {
      case 'pdf': return 'text-rose-500';
      case 'doc':
      case 'docx': return 'text-blue-500';
      case 'xls':
      case 'xlsx': return 'text-emerald-500';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif': return 'text-purple-500';
      case 'zip':
      case 'rar': return 'text-amber-500';
      default: return 'text-slate-500';
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  getCategoryIcon(category: string): string {
    switch(category) {
      case 'Contrats': return 'ph-file-text';
      case 'EtatsLieux': return 'ph-clipboard-text';
      case 'Factures': return 'ph-receipt';
      case 'Quittances': return 'ph-currency-eur';
      case 'Diagnostics': return 'ph-first-aid-kit';
      case 'Photos': return 'ph-images';
      case 'Autres': return 'ph-folder';
      default: return 'ph-file';
    }
  }

  getCategoryLabel(category: string): string {
    switch(category) {
      case 'Contrats': return 'Contrats';
      case 'EtatsLieux': return 'États des lieux';
      case 'Factures': return 'Factures';
      case 'Quittances': return 'Quittances';
      case 'Diagnostics': return 'Diagnostics';
      case 'Photos': return 'Photos';
      case 'Autres': return 'Autres';
      default: return category;
    }
  }
}
