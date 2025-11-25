import { Component, input, signal, inject, effect } from '@angular/core';
import { DatePipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { InternalTabManagerService } from '../../../../core/services/internal-tab-manager.service';
import { OccupancyChart } from '../../../../components/charts/occupancy-chart/occupancy-chart';
import { TenantDetail, TenantPayment, TenantPaymentStats } from '../../../../core/api/tenants.api';
import { TenantsService } from '../../../../core/services/tenants.service';
import { Contract } from '../../../../core/api/properties.api';
import { DocumentsManagerComponent } from '../../components/documents-manager/documents-manager';
import { ContractDocumentsStatusComponent } from '../../components/contract-documents-status/contract-documents-status.component';
import { ContractWizardComponent } from '../../components/contract-wizard/contract-wizard.component';

@Component({
  selector: 'tenant-detail-tab',
  standalone: true,
  imports: [
    TranslatePipe, 
    DatePipe, 
    OccupancyChart, 
    DocumentsManagerComponent,
    ContractDocumentsStatusComponent,
    ContractWizardComponent
  ],
  templateUrl: './tenant-detail-tab.html'
})
export class TenantDetailTab {
  data = input<any>();
  private tabManager = inject(InternalTabManagerService);
  private tenantsService = inject(TenantsService);

  activeSubTab = signal('contracts');
  isLoading = signal(false);
  
  tenant = signal<TenantDetail | null>(null);
  payments = signal<TenantPayment[]>([]);
  contracts = signal<Contract[]>([]);
  paymentStats = signal<TenantPaymentStats | null>(null);
  
  // Pour gérer l'expansion des documents de contrat
  expandedContractId = signal<string | null>(null);
  
  // Pour gérer le wizard de création de contrat
  showContractWizard = signal(false);

  subTabs = [
    { id: 'contracts', label: 'TENANT.SUB_TABS.CONTRACTS', icon: 'ph-file-text' },
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
      } else {
        console.warn('⚠️ No tenantId found in data');
      }
    });
  }

  private loadTenant(id: string) {
    this.isLoading.set(true);
    
    // Load tenant details
    this.tenantsService.getTenant(id).subscribe({
      next: (tenant) => {
        this.tenant.set(tenant);
        this.isLoading.set(false);
        console.log('✅ Tenant loaded:', tenant.fullName);
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

  private loadContracts(id: string) {
    this.tenantsService.getTenantContracts(id).subscribe({
      next: (contracts) => {
        this.contracts.set(contracts);
        console.log('✅ Tenant contracts loaded:', contracts.length, contracts);
      },
      error: (err) => console.error('❌ Error loading tenant contracts:', err)
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
    // Extract property ID from contract if available
    // Assuming contract has propertyId field or we need to navigate based on contract data
    alert('Ouvrir property - À implémenter avec propertyId du contract');
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
  onContractCreated(contractId: string) {
    console.log('✅ Contract created:', contractId);
    this.showContractWizard.set(false);
    // Refresh contracts list
    const t = this.tenant();
    if (t?.id) {
      this.loadContracts(t.id);
    }
  }
}
