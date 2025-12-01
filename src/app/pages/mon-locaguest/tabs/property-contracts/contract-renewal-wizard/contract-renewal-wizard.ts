import { Component, computed, inject, signal, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Contract } from '../../../../../core/api/properties.api';
import { ContractsApi } from '../../../../../core/api/contracts.api';
import { ToastService } from '../../../../../core/ui/toast.service';
import { ConfirmService } from '../../../../../core/ui/confirm.service';

export interface ContractRenewalData {
  contract: Contract;
  propertyName: string;
  tenantName: string;
  roomName?: string;
}

/**
 * Wizard de renouvellement de contrat en 4 étapes
 * 1. Informations générales
 * 2. Révision de loyer
 * 3. Clauses & Documents
 * 4. Récapitulatif & Validation
 */
@Component({
  selector: 'contract-renewal-wizard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contract-renewal-wizard.html',
  styles: [`
    :host {
      display: block;
      height: 100%;
    }
  `]
})
export class ContractRenewalWizard {
  // Inputs
  data = input.required<ContractRenewalData>();
  
  // Outputs
  completed = output<string>(); // Émet le nouveau contract ID
  cancelled = output<void>();
  
  // Services
  private contractsApi = inject(ContractsApi);
  private toasts = inject(ToastService);
  private confirmService = inject(ConfirmService);
  
  // State
  currentStep = signal(1);
  isSubmitting = signal(false);
  
  // Form data pour chaque étape
  step1Form = signal({
    newStartDate: '',
    duration: 12, // En mois
    newEndDate: '',
    contractType: ''
  });
  
  step2Form = signal({
    currentRent: 0,
    previousIRL: null as number | null,
    currentIRL: null as number | null,
    revisedRent: 0,
    newRent: 0,
    newCharges: 0,
    deposit: 0,
    rentIncreasePercent: 0
  });
  
  step3Form = signal({
    tacitRenewal: true,
    customClauses: '',
    notes: '',
    attachedDocumentIds: [] as string[]
  });
  
  // Validation flags
  step1Valid = computed(() => {
    const form = this.step1Form();
    return form.newStartDate && form.duration > 0 && form.newEndDate && form.contractType;
  });
  
  step2Valid = computed(() => {
    const form = this.step2Form();
    return form.newRent > 0 && form.newCharges >= 0;
  });
  
  step3Valid = computed(() => true); // Toujours valide, clauses optionnelles
  
  constructor() {
    // ✅ Utiliser effect() pour initialiser après que data() soit disponible
    setTimeout(() => {
      const contract = this.data().contract;
      
      // ÉTAPE 1: Calculer nouvelle date de début (lendemain de fin)
      const oldEndDate = new Date(contract.endDate);
      const newStartDate = new Date(oldEndDate);
      newStartDate.setDate(newStartDate.getDate() + 1);
      
      // Calculer durée par défaut selon type
      const defaultDuration = contract.type === 'Furnished' ? 12 : 36; // 1 an ou 3 ans
      const newEndDate = new Date(newStartDate);
      newEndDate.setMonth(newEndDate.getMonth() + defaultDuration);
      newEndDate.setDate(newEndDate.getDate() - 1); // Dernier jour du mois avant
      
      this.step1Form.set({
        newStartDate: this.formatDate(newStartDate),
        duration: defaultDuration,
        newEndDate: this.formatDate(newEndDate),
        contractType: contract.type || 'Unfurnished'
      });
      
      // ÉTAPE 2: Préremplir avec les données actuelles
      this.step2Form.set({
        currentRent: contract.rent,
        previousIRL: null,
        currentIRL: null,
        revisedRent: contract.rent,
        newRent: contract.rent,
        newCharges: contract.charges || 0,
        deposit: contract.deposit || contract.rent,
        rentIncreasePercent: 0
      });
    }, 0);
  }
  
  // ========== NAVIGATION ==========
  
  nextStep() {
    if (this.currentStep() < 4) {
      this.currentStep.update(s => s + 1);
    }
  }
  
  previousStep() {
    if (this.currentStep() > 1) {
      this.currentStep.update(s => s - 1);
    }
  }
  
  goToStep(step: number) {
    if (step >= 1 && step <= 4) {
      this.currentStep.set(step);
    }
  }
  
  // ========== ÉTAPE 1: Calculs automatiques ==========
  
  onDurationChange() {
    const form = this.step1Form();
    if (form.newStartDate && form.duration) {
      const startDate = new Date(form.newStartDate);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + form.duration);
      endDate.setDate(endDate.getDate() - 1);
      
      this.step1Form.update(f => ({
        ...f,
        newEndDate: this.formatDate(endDate)
      }));
    }
  }
  
  onStartDateChange() {
    this.onDurationChange();
  }
  
  // ========== ÉTAPE 2: Calculs IRL et révision ==========
  
  calculateRevisedRent() {
    const form = this.step2Form();
    
    if (form.previousIRL && form.currentIRL && form.previousIRL > 0) {
      const revisedRent = form.currentRent * (form.currentIRL / form.previousIRL);
      const increase = ((revisedRent - form.currentRent) / form.currentRent) * 100;
      
      this.step2Form.update(f => ({
        ...f,
        revisedRent: Math.round(revisedRent * 100) / 100,
        newRent: Math.round(revisedRent * 100) / 100,
        rentIncreasePercent: Math.round(increase * 10) / 10
      }));
      
      // Warning si dépassement de 3.5%
      if (increase > 3.5) {
        this.toasts.warningDirect(`Attention: Augmentation de ${increase.toFixed(1)}% > 3.5% (loi ALUR zones tendues)`);
      }
    }
  }
  
  onNewRentChange() {
    const form = this.step2Form();
    const increase = ((form.newRent - form.currentRent) / form.currentRent) * 100;
    
    this.step2Form.update(f => ({
      ...f,
      rentIncreasePercent: Math.round(increase * 10) / 10
    }));
  }
  
  // ========== VALIDATION FINALE ==========
  
  async submitRenewal() {
    const confirmed = await this.confirmService.warning(
      'Renouveler le contrat',
      `Confirmez-vous le renouvellement de ce contrat ? L'ancien contrat passera en statut "Renouvelé" et un nouveau contrat sera créé.`
    );
    
    if (!confirmed) return;
    
    this.isSubmitting.set(true);
    
    try {
      const step1 = this.step1Form();
      const step2 = this.step2Form();
      const step3 = this.step3Form();
      const contract = this.data().contract;
      
      const request = {
        newStartDate: step1.newStartDate,
        newEndDate: step1.newEndDate,
        contractType: step1.contractType,
        newRent: step2.newRent,
        newCharges: step2.newCharges,
        previousIRL: step2.previousIRL,
        currentIRL: step2.currentIRL,
        deposit: step2.deposit,
        customClauses: step3.customClauses,
        notes: step3.notes,
        tacitRenewal: step3.tacitRenewal,
        attachedDocumentIds: step3.attachedDocumentIds
      };
      
      const response = await this.contractsApi.renewContract(contract.id, request);
      
      this.toasts.successDirect('Contrat renouvelé avec succès !');
      this.completed.emit(response.newContractId);
      
    } catch (error: any) {
      this.toasts.errorDirect(error.error.message || 'Erreur lors du renouvellement du contrat');
      console.error('Renewal error:', error);
    } finally {
      this.isSubmitting.set(false);
    }
  }
  
  async cancel() {
    const confirmed = await this.confirmService.info(
      'Annuler',
      'Voulez-vous vraiment annuler le renouvellement ?'
    );
    
    if (confirmed) {
      this.cancelled.emit();
    }
  }
  
  // ========== HELPERS ==========
  
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
  
  getDaysUntilExpiration(): number {
    const endDate = new Date(this.data().contract.endDate);
    const today = new Date();
    const diff = endDate.getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }
  
  canRenew(): { valid: boolean; reason?: string } {
    const contract = this.data().contract;
    const days = this.getDaysUntilExpiration();
    
    if (contract.status !== 'Active' && contract.status !== 'Expiring') {
      return { valid: false, reason: 'Le contrat doit être actif pour être renouvelé' };
    }
    
    if (days > 60) {
      return { valid: false, reason: `Le renouvellement n'est possible que dans les 60 derniers jours (${days} jours restants)` };
    }
    
    if (contract.hasInventoryExit) {
      return { valid: false, reason: 'Un état des lieux de sortie existe déjà' };
    }
    
    return { valid: true };
  }
}
