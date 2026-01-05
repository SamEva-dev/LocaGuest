import { Component, input, output, signal, computed, inject, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Contract, PropertyDetail } from '../../../../../core/api/properties.api';
import { TenantListItem, TenantsApi } from '../../../../../core/api/tenants.api';
import { ContractsApi } from '../../../../../core/api/contracts.api';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'contract-edit-form',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './contract-edit-form.html'
})
export class ContractEditForm {
  contract = input.required<Contract>();
  property = input.required<PropertyDetail>();
  associatedTenants = input<TenantListItem[]>([]);
  
  close = output<void>();
  success = output<void>();
  
  private contractsApi = inject(ContractsApi);
  private tenantsApi = inject(TenantsApi);
  
  isSubmitting = signal(false);
  availableTenants = signal<TenantListItem[]>([]);
  
  // Form data - pré-rempli avec les données du contrat
  form = signal<{
    tenantId: string;
    type: string;
    startDate: string;
    endDate: string;
    rent: number;
    charges: number;
    deposit: number;
    duration: number;
    autoRenewal: boolean;
    paymentMethod: string;
    roomId?: string;
  }>({
    tenantId: '',
    type: 'Non meublé',
    startDate: '',
    endDate: '',
    rent: 0,
    charges: 0,
    deposit: 0,
    duration: 12,
    autoRenewal: true,
    paymentMethod: 'Virement'
  });
  
  contractTypes = [
    'Non meublé',
    'Meublé',
    'Mobilité',
    'Commercial'
  ];
  
  paymentMethods = [
    'Virement',
    'Prélèvement',
    'Chèque',
    'Espèces'
  ];
  
  availableRooms = computed(() => {
    const prop = this.property();
    if (prop.propertyUsageType?.toLowerCase() === 'colocation') {
      return prop.rooms || [];
    }
    return [];
  });
  
  isColocation = computed(() => {
    return this.property().propertyUsageType?.toLowerCase() === 'colocation';
  });
  
  constructor() {
    // Charger les locataires disponibles
    effect(() => {
      this.loadTenants();
    }, { allowSignalWrites: true });
    
    // Pré-remplir le formulaire
    effect(() => {
      const contract = this.contract();
      if (contract) {
        const startDateStr = typeof contract.startDate === 'string' ? contract.startDate : new Date(contract.startDate).toISOString();
        const endDateStr = typeof contract.endDate === 'string' ? contract.endDate : new Date(contract.endDate).toISOString();
        
        this.form.set({
          tenantId: contract.tenantId,
          type: contract.type || 'Non meublé',
          startDate: startDateStr.split('T')[0],
          endDate: endDateStr.split('T')[0],
          rent: contract.rent,
          charges: contract.charges || 0,
          deposit: contract.deposit || 0,
          duration: 12,
          autoRenewal: true,
          paymentMethod: 'Virement',
          roomId: contract.roomId
        });
      }
    }, { allowSignalWrites: true });
  }
  
  async loadTenants() {
    try {
      const tenants = await firstValueFrom(this.tenantsApi.getTenants());
      this.availableTenants.set(tenants.items);
    } catch (error) {
      console.error('❌ Erreur chargement locataires:', error);
    }
  }
  
  getTenantName(tenantId: string): string {
    const tenant = this.availableTenants().find(t => t.id === tenantId) ||
                   this.associatedTenants().find(t => t.id === tenantId);
    return tenant?.fullName || 'Inconnu';
  }
  
  async saveContract() {
    if (this.isSubmitting()) return;
    
    const f = this.form();
    
    // Validation
    if (!f.tenantId || !f.startDate || !f.endDate || f.rent <= 0) {
      alert('❌ Veuillez remplir tous les champs obligatoires');
      return;
    }
    
    if (new Date(f.endDate) <= new Date(f.startDate)) {
      alert('❌ La date de fin doit être après la date de début');
      return;
    }
    
    this.isSubmitting.set(true);
    
    try {
      const request: Partial<{
        tenantId: string;
        propertyId: string;
        roomId: string | null;
        type: string;
        startDate: string;
        endDate: string;
        rent: number;
        charges: number;
        deposit: number;
      }> = {
        tenantId: f.tenantId,
        propertyId: this.property().id,
        roomId: f.roomId || null,
        type: f.type,
        startDate: f.startDate,
        endDate: f.endDate,
        rent: f.rent,
        charges: f.charges,
        deposit: f.deposit
      };
      
      await firstValueFrom(
        this.contractsApi.updateContract(this.contract().id, request as any)
      );
      alert('✅ Contrat mis à jour avec succès!');
      this.success.emit();
      
    } catch (error: any) {
      console.error('❌ Erreur mise à jour contrat:', error);
      alert(`❌ Erreur: ${error.error?.message || 'Erreur lors de la mise à jour'}`);
    } finally {
      this.isSubmitting.set(false);
    }
  }
  
  cancel() {
    this.close.emit();
  }
}
