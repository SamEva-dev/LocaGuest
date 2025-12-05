import { Component, Input, Output, EventEmitter, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContractsApi } from '../../../../../core/api/contracts.api';
import { ToastService } from '../../../../../core/ui/toast.service';
import { ConfirmService } from '../../../../../core/ui/confirm.service';

export interface ContractAddendumData {
  contract: any;
  propertyName: string;
  tenantName: string;
  roomName?: string;
  availableRooms?: any[];
}

type AddendumType = 'Financial' | 'Duration' | 'Occupants' | 'Clauses' | 'Free';

interface AddendumTypeOption {
  type: AddendumType;
  label: string;
  description: string;
  icon: string;
  color: string;
}

@Component({
  selector: 'contract-addendum-wizard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contract-addendum-wizard.html'
})
export class ContractAddendumWizard {
  @Input() data!: ContractAddendumData;
  @Output() completed = new EventEmitter<string>();
  @Output() cancelled = new EventEmitter<void>();

  private contractsApi = inject(ContractsApi);
  private toasts = inject(ToastService);
  private confirmService = inject(ConfirmService);

  // ========== STATE ==========
  currentStep = signal(1);
  isSubmitting = signal(false);

  // ========== ÉTAPE 1: TYPE D'AVENANT ==========
  selectedType = signal<AddendumType | null>(null);

  addendumTypes: AddendumTypeOption[] = [
    {
      type: 'Financial',
      label: 'Avenant Financier',
      description: 'Modification du loyer ou des charges',
      icon: 'ph-currency-euro',
      color: 'emerald'
    },
    {
      type: 'Duration',
      label: 'Avenant sur la Durée',
      description: 'Prolongation ou modification de la date de fin',
      icon: 'ph-calendar-plus',
      color: 'blue'
    },
    {
      type: 'Occupants',
      label: 'Avenant sur les Occupants',
      description: 'Ajout/retrait de colocataires ou changement de chambre',
      icon: 'ph-users',
      color: 'purple'
    },
    {
      type: 'Clauses',
      label: 'Avenant sur les Clauses',
      description: 'Modification des clauses contractuelles',
      icon: 'ph-file-text',
      color: 'orange'
    },
    {
      type: 'Free',
      label: 'Avenant Libre',
      description: 'Rédaction personnalisée d\'un avenant',
      icon: 'ph-pen',
      color: 'gray'
    }
  ];

  // ========== ÉTAPE 2: FORMULAIRES PAR TYPE ==========
  
  // Financial
  financialForm = signal({
    oldRent: 0,
    newRent: 0,
    oldCharges: 0,
    newCharges: 0,
    reason: '',
    effectiveDate: ''
  });

  rentIncreasePercent = computed(() => {
    const form = this.financialForm();
    if (form.oldRent > 0 && form.newRent > 0) {
      return Math.round(((form.newRent - form.oldRent) / form.oldRent) * 1000) / 10;
    }
    return 0;
  });

  // Duration
  durationForm = signal({
    currentEndDate: '',
    newEndDate: '',
    reason: '',
    effectiveDate: ''
  });

  extensionMonths = computed(() => {
    const form = this.durationForm();
    if (form.currentEndDate && form.newEndDate) {
      const current = new Date(form.currentEndDate);
      const newDate = new Date(form.newEndDate);
      const diff = newDate.getTime() - current.getTime();
      return Math.round(diff / (1000 * 60 * 60 * 24 * 30.44));
    }
    return 0;
  });

  // Occupants
  occupantsForm = signal({
    action: '' as 'add' | 'remove' | 'changeRoom' | '',
    // Add occupant
    occupantName: '',
    occupantEmail: '',
    occupantPhone: '',
    rentShare: null as number | null,
    // Remove occupant
    occupantToRemove: '',
    departureDate: '',
    depositAdjustment: null as number | null,
    // Change room
    currentRoom: '',
    newRoom: '',
    // Common
    reason: '',
    effectiveDate: ''
  });

  // Clauses
  clausesForm = signal({
    currentClauses: '',
    newClauses: '',
    reason: '',
    effectiveDate: ''
  });

  // Free
  freeForm = signal({
    description: '',
    reason: '',
    effectiveDate: ''
  });

  // ========== ÉTAPE 3: DOCUMENTS & SIGNATURE ==========
  documentsForm = signal({
    attachedDocuments: [] as File[],
    notes: '',
    sendEmail: true,
    requireSignature: true
  });

  // ========== VALIDATIONS ==========
  
  step1Valid = computed(() => this.selectedType() !== null);

  step2Valid = computed(() => {
    const type = this.selectedType();
    
    switch (type) {
      case 'Financial': {
        const form = this.financialForm();
        return form.newRent > 0 && 
               form.newCharges >= 0 && 
               form.reason.trim().length > 0 && 
               form.effectiveDate !== '';
      }
      case 'Duration': {
        const form = this.durationForm();
        return form.newEndDate !== '' && 
               form.reason.trim().length > 0 && 
               form.effectiveDate !== '' &&
               new Date(form.newEndDate) > new Date(form.currentEndDate);
      }
      case 'Occupants': {
        const form = this.occupantsForm();
        if (!form.action || !form.reason.trim() || !form.effectiveDate) return false;
        
        if (form.action === 'add') {
          return form.occupantName.trim().length > 0 && 
                 form.occupantEmail.trim().length > 0;
        }
        if (form.action === 'remove') {
          return form.occupantToRemove !== '' && 
                 form.departureDate !== '';
        }
        if (form.action === 'changeRoom') {
          return form.newRoom !== '';
        }
        return false;
      }
      case 'Clauses': {
        const form = this.clausesForm();
        return form.newClauses.trim().length > 0 && 
               form.newClauses.length <= 2000 &&
               form.reason.trim().length > 0 && 
               form.effectiveDate !== '';
      }
      case 'Free': {
        const form = this.freeForm();
        return form.description.trim().length > 0 && 
               form.description.length <= 2000 &&
               form.reason.trim().length > 0 && 
               form.effectiveDate !== '';
      }
      default:
        return false;
    }
  });

  step3Valid = computed(() => true); // Toujours valide (documents optionnels)

  canGoNext = computed(() => {
    const step = this.currentStep();
    if (step === 1) return this.step1Valid();
    if (step === 2) return this.step2Valid();
    if (step === 3) return this.step3Valid();
    return false;
  });

  // ========== LIFECYCLE ==========
  
  constructor() {
    setTimeout(() => {
      this.initializeForms();
    }, 0);
  }

  private initializeForms() {
    if (!this.data) return;

    const contract = this.data.contract;
    const today = new Date().toISOString().split('T')[0];

    // Financial
    this.financialForm.update(f => ({
      ...f,
      oldRent: contract.rent,
      newRent: contract.rent,
      oldCharges: contract.charges,
      newCharges: contract.charges,
      effectiveDate: today
    }));

    // Duration
    this.durationForm.update(f => ({
      ...f,
      currentEndDate: contract.endDate?.split('T')[0] || '',
      newEndDate: '',
      effectiveDate: today
    }));

    // Occupants
    if (this.data.roomName) {
      this.occupantsForm.update(f => ({
        ...f,
        currentRoom: this.data.roomName || '',
        effectiveDate: today
      }));
    } else {
      this.occupantsForm.update(f => ({
        ...f,
        effectiveDate: today
      }));
    }

    // Clauses
    this.clausesForm.update(f => ({
      ...f,
      currentClauses: contract.customClauses || '',
      effectiveDate: today
    }));

    // Free
    this.freeForm.update(f => ({
      ...f,
      effectiveDate: today
    }));
  }

  // ========== NAVIGATION ==========
  
  selectType(type: AddendumType) {
    this.selectedType.set(type);
  }

  nextStep() {
    if (this.canGoNext()) {
      this.currentStep.update(s => s + 1);
    }
  }

  previousStep() {
    this.currentStep.update(s => Math.max(1, s - 1));
  }

  // ========== FILE HANDLING ==========
  
  onFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      const files = Array.from(input.files);
      
      // Validation taille
      const invalidFiles = files.filter(f => f.size > 10 * 1024 * 1024);
      if (invalidFiles.length > 0) {
        this.toasts.warningDirect('Certains fichiers dépassent 10 MB et ont été ignorés');
        return;
      }

      this.documentsForm.update(f => ({
        ...f,
        attachedDocuments: [...f.attachedDocuments, ...files]
      }));
    }
  }

  removeFile(index: number) {
    this.documentsForm.update(f => ({
      ...f,
      attachedDocuments: f.attachedDocuments.filter((_, i) => i !== index)
    }));
  }
  
  updateDocumentsNotes(value: string) {
    this.documentsForm.update(f => ({ ...f, notes: value }));
  }
  
  updateSendEmail(value: boolean) {
    this.documentsForm.update(f => ({ ...f, sendEmail: value }));
  }
  
  updateRequireSignature(value: boolean) {
    this.documentsForm.update(f => ({ ...f, requireSignature: value }));
  }
  
  // Generic update methods for all forms
  updateFinancialField(field: string, value: any) {
    this.financialForm.update(f => ({ ...f, [field]: value }));
  }
  
  updateDurationField(field: string, value: any) {
    this.durationForm.update(f => ({ ...f, [field]: value }));
  }
  
  updateOccupantsField(field: string, value: any) {
    this.occupantsForm.update(f => ({ ...f, [field]: value }));
  }
  
  updateClausesField(field: string, value: any) {
    this.clausesForm.update(f => ({ ...f, [field]: value }));
  }
  
  updateFreeField(field: string, value: any) {
    this.freeForm.update(f => ({ ...f, [field]: value }));
  }

  // ========== SUBMISSION ==========
  
  async submitAddendum() {
    const confirmed = await this.confirmService.info(
      'Créer l\'avenant',
      'Êtes-vous sûr de vouloir créer cet avenant au contrat ?'
    );

    if (!confirmed) return;

    this.isSubmitting.set(true);

    try {
      const contract = this.data.contract;
      const type = this.selectedType()!;
      
      let request: any = {
        type: type,
        sendEmail: this.documentsForm().sendEmail,
        requireSignature: this.documentsForm().requireSignature,
        notes: this.documentsForm().notes || null,
        attachedDocumentIds: [] // TODO: Upload files first
      };

      // Construire la requête selon le type
      switch (type) {
        case 'Financial': {
          const form = this.financialForm();
          request = {
            ...request,
            effectiveDate: form.effectiveDate,
            reason: form.reason,
            description: `Modification financière: Loyer ${form.oldRent}€ → ${form.newRent}€, Charges ${form.oldCharges}€ → ${form.newCharges}€`,
            newRent: form.newRent,
            newCharges: form.newCharges
          };
          break;
        }
        case 'Duration': {
          const form = this.durationForm();
          request = {
            ...request,
            effectiveDate: form.effectiveDate,
            reason: form.reason,
            description: `Prolongation de ${this.extensionMonths()} mois: ${form.currentEndDate} → ${form.newEndDate}`,
            newEndDate: form.newEndDate
          };
          break;
        }
        case 'Occupants': {
          const form = this.occupantsForm();
          let description = '';
          let occupantChanges: any = { action: form.action };

          if (form.action === 'add') {
            description = `Ajout colocataire: ${form.occupantName}`;
            occupantChanges = {
              ...occupantChanges,
              name: form.occupantName,
              email: form.occupantEmail,
              phone: form.occupantPhone,
              rentShare: form.rentShare
            };
          } else if (form.action === 'remove') {
            description = `Retrait colocataire: ${form.occupantToRemove}`;
            occupantChanges = {
              ...occupantChanges,
              occupantId: form.occupantToRemove,
              departureDate: form.departureDate,
              depositAdjustment: form.depositAdjustment
            };
          } else if (form.action === 'changeRoom') {
            description = `Changement de chambre: ${form.currentRoom} → ${form.newRoom}`;
            occupantChanges = {
              ...occupantChanges,
              oldRoom: form.currentRoom,
              newRoomId: form.newRoom
            };
            request.newRoomId = form.newRoom;
          }

          request = {
            ...request,
            effectiveDate: form.effectiveDate,
            reason: form.reason,
            description: description,
            occupantChanges: JSON.stringify(occupantChanges)
          };
          break;
        }
        case 'Clauses': {
          const form = this.clausesForm();
          request = {
            ...request,
            effectiveDate: form.effectiveDate,
            reason: form.reason,
            description: 'Modification des clauses contractuelles',
            newClauses: form.newClauses
          };
          break;
        }
        case 'Free': {
          const form = this.freeForm();
          request = {
            ...request,
            effectiveDate: form.effectiveDate,
            reason: form.reason,
            description: form.description
          };
          break;
        }
      }

      const response = await this.contractsApi.createAddendum(contract.id, request);
      
      this.toasts.successDirect('Avenant créé avec succès !');
      this.completed.emit(response.addendumId);
      
    } catch (error: any) {
      this.toasts.errorDirect(error.error?.message || 'Erreur lors de la création de l\'avenant');
      console.error('Addendum error:', error);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  async cancel() {
    const confirmed = await this.confirmService.info(
      'Annuler',
      'Voulez-vous vraiment annuler la création de l\'avenant ?'
    );

    if (confirmed) {
      this.cancelled.emit();
    }
  }

  // ========== HELPERS ==========
  
  getColorClass(color: string): string {
    const colorMap: Record<string, string> = {
      emerald: 'bg-emerald-500',
      blue: 'bg-blue-500',
      purple: 'bg-purple-500',
      orange: 'bg-orange-500',
      gray: 'bg-gray-500'
    };
    return colorMap[color] || 'bg-gray-500';
  }

  getBorderColorClass(color: string): string {
    const colorMap: Record<string, string> = {
      emerald: 'border-emerald-500',
      blue: 'border-blue-500',
      purple: 'border-purple-500',
      orange: 'border-orange-500',
      gray: 'border-gray-500'
    };
    return colorMap[color] || 'border-gray-500';
  }

  getIconColorClass(color: string): string {
    const colorMap: Record<string, string> = {
      emerald: 'text-emerald-600',
      blue: 'text-blue-600',
      purple: 'text-purple-600',
      orange: 'text-orange-600',
      gray: 'text-gray-600'
    };
    return colorMap[color] || 'text-gray-600';
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(value);
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }
}
