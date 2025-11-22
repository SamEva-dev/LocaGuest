import { Component, input, signal, inject, effect, viewChild } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { InternalTabManagerService } from '../../../../core/services/internal-tab-manager.service';
import { RevenueChart } from '../../../../components/charts/revenue-chart/revenue-chart';
import { PropertyDetail, Payment, Contract, FinancialSummary, CreateContractDto } from '../../../../core/api/properties.api';
import { TenantListItem } from '../../../../core/api/tenants.api';
import { PropertiesService } from '../../../../core/services/properties.service';
import { TenantSelectionModal, TenantSelectionResult } from '../../components/tenant-selection-modal/tenant-selection-modal';

@Component({
  selector: 'property-detail-tab',
  standalone: true,
  imports: [TranslatePipe, DatePipe, FormsModule, RevenueChart, TenantSelectionModal],
  templateUrl: './property-detail-tab.html'
})
export class PropertyDetailTab {
  data = input<any>();
  private tabManager = inject(InternalTabManagerService);
  private propertiesService = inject(PropertiesService);
  
  tenantModal = viewChild<TenantSelectionModal>('tenantModal');

  activeSubTab = signal('overview');
  isLoading = signal(false);
  
  property = signal<PropertyDetail | null>(null);
  payments = signal<Payment[]>([]);
  recentPayments = signal<Payment[]>([]);
  contracts = signal<Contract[]>([]);
  associatedTenants = signal<TenantListItem[]>([]);
  financialSummary = signal<FinancialSummary | null>(null);
  
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
    { id: 'overview', label: 'PROPERTY.SUB_TABS.OVERVIEW', icon: 'ph-house' },
    { id: 'tenants', label: 'PROPERTY.SUB_TABS.TENANTS', icon: 'ph-users-three' },
    { id: 'contracts', label: 'PROPERTY.SUB_TABS.CONTRACTS', icon: 'ph-file-text' },
    { id: 'documents', label: 'PROPERTY.SUB_TABS.DOCUMENTS', icon: 'ph-folder' },
    { id: 'payments', label: 'PROPERTY.SUB_TABS.PAYMENTS', icon: 'ph-currency-eur' },
    { id: 'projection', label: 'PROPERTY.SUB_TABS.PROJECTION', icon: 'ph-chart-line-up' },
  ];

  constructor() {
    effect(() => {
      const tabData = this.data();
      console.log('🔍 PropertyDetailTab data:', tabData);
      if (tabData?.propertyId) {
        console.log('✅ Loading property:', tabData.propertyId);
        this.loadProperty(tabData.propertyId);
      } else {
        console.warn('⚠️ No propertyId found in data');
      }
    });
  }

  private loadProperty(id: string) {
    this.isLoading.set(true);
    
    // Load property details
    this.propertiesService.getProperty(id).subscribe({
      next: (property) => {
        this.property.set(property);
        this.isLoading.set(false);
        console.log('✅ Property loaded:', property.name);
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
        console.log('✅ Payments loaded:', payments.length);
      },
      error: (err) => console.error('❌ Error loading payments:', err)
    });

    // Load contracts
    this.propertiesService.getPropertyContracts(id).subscribe({
      next: (contracts) => {
        this.contracts.set(contracts);
        console.log('✅ Contracts loaded:', contracts.length);
      },
      error: (err) => console.error('❌ Error loading contracts:', err)
    });

    // Load associated tenants
    this.propertiesService.getAssociatedTenants(id).subscribe({
      next: (tenants) => {
        this.associatedTenants.set(tenants);
        console.log('✅ Associated tenants loaded:', tenants.length, tenants);
      },
      error: (err) => console.error('❌ Error loading associated tenants:', err)
    });

    // Load financial summary
    this.propertiesService.getFinancialSummary(id).subscribe({
      next: (summary) => {
        this.financialSummary.set(summary);
        console.log('✅ Financial summary loaded', summary);
      },
      error: (err) => console.error('❌ Error loading financial summary:', err)
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

    console.log('🔍 Loading available tenants for property:', propertyId);
    this.propertiesService.getAvailableTenants(propertyId).subscribe({
      next: (tenants: any) => {
        console.log('✅ Available tenants loaded:', tenants.length);
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
        alert('Erreur lors du chargement des locataires disponibles');
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

    console.log('🔄 Assigning tenant to property:', contractDto);
    this.propertiesService.assignTenant(propertyId, contractDto).subscribe({
      next: (contract: any) => {
        console.log('✅ Tenant assigned successfully:', contract);
        this.showTenantModal.set(false);
        // Recharger les contrats
        this.loadProperty(propertyId);
        alert(`Locataire ${result.tenantName} associé avec succès !`);
      },
      error: (err: any) => {
        console.error('❌ Error assigning tenant:', err);
        const errorMsg = err?.error?.message || err?.message || 'Erreur inconnue';
        alert(`Erreur lors de l'association du locataire: ${errorMsg}`);
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
    const form = this.dissociationForm();
    const propertyId = this.data()?.propertyId;
    
    if (!form || !propertyId) {
      return;
    }

    // Validation: raison obligatoire
    if (!form.reason) {
      alert('Veuillez sélectionner un motif de dissociation');
      return;
    }

    // Si "Autre", le champ custom est obligatoire
    if (form.reason === 'Autre (préciser)' && !form.customReason.trim()) {
      alert('Veuillez préciser le motif');
      return;
    }

    const finalReason = form.reason === 'Autre (préciser)' 
      ? form.customReason 
      : form.reason;

    console.log('🔄 Dissociating tenant from property:', { 
      propertyId, 
      tenantId: form.tenantId,
      reason: finalReason
    });

    this.propertiesService.dissociateTenant(propertyId, form.tenantId).subscribe({
      next: () => {
        console.log('✅ Tenant dissociated successfully');
        alert(`Locataire "${form.tenantName}" retiré avec succès !\nMotif: ${finalReason}`);
        this.closeDissociationModal();
        // Recharger la propriété
        this.loadProperty(propertyId);
      },
      error: (err: any) => {
        console.error('❌ Error dissociating tenant:', err);
        const errorMsg = err?.error?.message || err?.message || 'Erreur inconnue';
        alert(`Erreur lors de la dissociation: ${errorMsg}`);
      }
    });
  }
}
