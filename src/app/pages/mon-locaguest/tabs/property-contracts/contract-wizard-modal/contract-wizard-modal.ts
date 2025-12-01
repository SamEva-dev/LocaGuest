import { Component, input, output, signal, computed, inject, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PropertyDetail } from '../../../../../core/api/properties.api';
import { TenantListItem, TenantsApi } from '../../../../../core/api/tenants.api';
import { ContractsApi, CreateContractRequest } from '../../../../../core/api/contracts.api';
import { PropertiesService } from '../../../../../core/services/properties.service';
import { ToastService } from '../../../../../core/ui/toast.service';
import { ConfirmService } from '../../../../../core/ui/confirm.service';

interface NewTenantForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthDate: string;
  address: string;
  guarantorName?: string;
  guarantorPhone?: string;
  guarantorEmail?: string;
}

interface ContractTemplate {
  id: string;
  name: string;
  description: string;
  type: 'Meublé' | 'Non meublé' | 'Colocation individuelle' | 'Colocation solidaire';
  duration: 6 | 12 | 36;
  autoRenewal: boolean;
  indexationIRL: boolean;
  clauses?: string[];
}

interface ContractForm {
  // Étape 1 - Locataire
  tenantId: string;
  tenantName?: string;
  room?: string; // Pour colocation (nom affiché)
  roomId?: string; // ✅ NOUVEAU: ID de la chambre pour colocation
  
  // Étape 2 - Bail
  startDate: string;
  endDate: string;
  isRenewable: boolean;
  templateId?: string; // PHASE 2: Template sélectionné
  
  // Financier
  rent: number;
  charges: number;
  deposit: number;
  
  // Type et options
  type: 'Meublé' | 'Non meublé' | 'Colocation individuelle' | 'Colocation solidaire';
  duration: 6 | 12 | 36; // mois
  autoRenewal: boolean;
  indexationIRL: boolean;
  paymentMethod: 'Virement' | 'Stripe' | 'Prélèvement';
  
  // Étape 3 - EDL
  inventoryOption: 'create_now' | 'schedule_later' | 'none';
  inventoryDate?: string;
  inventoryAgent?: string;
  
  // Autres
  isPaper: boolean;
  pdfFile?: File;
  isRenewal?: boolean; // PHASE 2: Mode renouvellement
  previousContractId?: string; // PHASE 2: Contrat précédent si renouvellement
}

@Component({
  selector: 'contract-wizard-modal',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './contract-wizard-modal.html'
})
export class ContractWizardModal {
  property = input.required<PropertyDetail>();
  mode = input<'new' | 'paper'>('new');
  existingContract = input<any>(null);
  
  close = output<void>();
  success = output<void>();
  
  private propertiesService = inject(PropertiesService);
  private tenantsApi = inject(TenantsApi);
  private contractsApi = inject(ContractsApi);
  private toasts = inject(ToastService);
  private confirmService = inject(ConfirmService);
  
  currentStep = signal(1);
  
  // totalSteps d\u00e9pend du mode
  totalSteps = computed(() => {
    return this.mode() === 'paper' ? 3 : 4;
  });
  
  // Form data - Initialiser avec valeurs par défaut du bien
  form = signal<Partial<ContractForm>>({
    type: 'Non meublé',
    isPaper: false,
    rent: 0,
    charges: 0,
    deposit: 0,
    duration: 12,
    autoRenewal: true,
    indexationIRL: true,
    paymentMethod: 'Virement',
    isRenewable: true,
    inventoryOption: 'schedule_later'
  });
  
  // Tenants
  availableTenants = signal<TenantListItem[]>([]);
  filteredTenants = signal<TenantListItem[]>([]);
  searchTerm = signal('');
  showCreateTenant = signal(false);
  newTenantForm = signal<NewTenantForm>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    birthDate: '',
    address: ''
  });
  
  // UI States
  isLoading = signal(false);
  isSaving = signal(false);
  uploadedFileName = signal<string>('');
  validationErrors = signal<string[]>([]);
  
  // Options - Filtrées selon le type de bien
  contractTypes = computed(() => {
    const usageType = this.property().propertyUsageType;
    if (usageType === 'colocation') {
      return ['Non meublé', 'Meublé', 'Colocation individuelle', 'Colocation solidaire'];
    } else {
      return ['Non meublé', 'Meublé'];
    }
  });
  durations = [6, 12, 36];
  paymentMethods = ['Virement', 'Stripe', 'Prélèvement'];
  inventoryOptions = [
    { value: 'create_now', label: 'Créer un état des lieux maintenant' },
    { value: 'schedule_later', label: 'Planifier plus tard' },
    { value: 'none', label: 'Ce contrat n\'aura pas d\'EDL' }
  ];
  
  // PHASE 2: Templates de contrats
  contractTemplates = signal<ContractTemplate[]>([
    {
      id: 'standard-unfurnished',
      name: 'Bail Standard Non Meublé',
      description: 'Contrat type pour location vide, durée 3 ans',
      type: 'Non meublé',
      duration: 36,
      autoRenewal: true,
      indexationIRL: true
    },
    {
      id: 'standard-furnished',
      name: 'Bail Standard Meublé',
      description: 'Contrat type pour location meublée, durée 1 an',
      type: 'Meublé',
      duration: 12,
      autoRenewal: true,
      indexationIRL: true
    },
    {
      id: 'colocation-individual',
      name: 'Colocation - Bail Individuel',
      description: 'Bail individuel pour chambre en colocation',
      type: 'Colocation individuelle',
      duration: 12,
      autoRenewal: false,
      indexationIRL: true
    },
    {
      id: 'colocation-solidaire',
      name: 'Colocation - Bail Solidaire',
      description: 'Bail solidaire entre colocataires',
      type: 'Colocation solidaire',
      duration: 12,
      autoRenewal: true,
      indexationIRL: true
    }
  ]);
  
  showTemplates = signal(false);
  
  // Selected room for colocation
  selectedRoom = computed(() => {
    const roomId = this.form().roomId;
    if (!roomId) return null;
    return this.property().rooms?.find(r => r.id === roomId);
  });
  
  constructor() {
    // PHASE 2: Auto-complétion intelligente
    effect(() => {
      const prop = this.property();
      if (prop) {
        // Pré-remplir avec données du bien
        if (prop.propertyUsageType === 'colocation') {
          // Pour colocation, ne pas pré-remplir - attendre sélection chambre
          this.form.update(f => ({
            ...f,
            type: 'Colocation individuelle'
          }));
        } else {
          // ✅ CORRECTION: Ne mettre le dépôt = loyer que si deposit est à 0 (valeur par défaut)
          const currentForm = this.form();
          this.form.update(f => ({
            ...f,
            rent: prop.rent || 0,
            charges: prop.charges || 0,
            deposit: currentForm.deposit === 0 ? (prop.rent || 0) : currentForm.deposit,
            type: prop.isFurnished ? 'Meublé' : 'Non meublé'
          }));
        }
      }
    });
    
    // Auto-update financial info when room selected (colocation)
    effect(() => {
      const room = this.selectedRoom();
      if (room) {
        // ✅ CORRECTION: Ne mettre le dépôt = loyer que si deposit est à 0 (valeur par défaut)
        const currentForm = this.form();
        this.form.update(f => ({
          ...f,
          rent: room.rent || 0,
          charges: room.charges || 0,
          deposit: currentForm.deposit === 0 ? (room.rent || 0) : currentForm.deposit,
          room: room.name
        }));
      }
    });
    
    effect(() => {
      const search = this.searchTerm().toLowerCase();
      const tenants = this.availableTenants();
      
      if (!search) {
        this.filteredTenants.set(tenants);
      } else {
        this.filteredTenants.set(
          tenants.filter(t => 
            t.fullName?.toLowerCase().includes(search) ||
            t.email?.toLowerCase().includes(search) ||
            t.phone?.includes(search)
          )
        );
      }
    });
    
    this.loadTenants();
  }
  
  private loadTenants() {
    this.isLoading.set(true);
    this.tenantsApi.getTenants().subscribe({
      next: (result) => {
        // ✅ FILTRAGE: Exclure les locataires avec contrat actif ou signé
        const allTenants = result.items || [];
        const availableTenants = allTenants.filter(tenant => {
          // Un locataire est disponible si son statut n'est pas "Occupant" ou "Reserved"
          return tenant.status !== 'Occupant' && tenant.status !== 'Reserved';
        });
        
        console.log(`📋 ${allTenants.length} locataires total, ${availableTenants.length} disponibles`);
        this.availableTenants.set(availableTenants);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading tenants:', err);
        this.isLoading.set(false);
      }
    });
  }
  
  // ✅ Computed: Détection colocation
  isColocation = computed(() => {
    const prop = this.property();
    const usageType = prop?.propertyUsageType?.toLowerCase();
    console.log('🏠 isColocation check:', { usageType, propertyId: prop?.id, hasRooms: !!prop?.rooms });
    return usageType === 'colocation';
  });
  
  // ✅ Computed: Chambres disponibles (utilise prop.rooms si disponible)
  availableRooms = computed(() => {
    const prop = this.property();
    console.log('prop', prop);
    if (!prop) {
      console.log('🚪 No property');
      return [];
    }
    
    if (!this.isColocation()) {
      console.log('🚪 Not a colocation');
      return [];
    }
    
    // ✅ CORRECTION #1: Utiliser uniquement les vraies chambres avec GUID
    if (prop.rooms && Array.isArray(prop.rooms)) {
      const available = prop.rooms.filter(r => r.status === 'Available');
      console.log('🚪 Real rooms available:', available.length, 'out of', prop.rooms.length, available);
      return available;
    }
    
    // ⚠️ IMPORTANT: Pas de chambres réelles disponibles
    console.error('❌ No rooms array for colocation property! PropertyId:', prop.id);
    console.error('💡 Please ensure PropertyRooms are loaded with the property.');
    return [];
  });
  
  canGoNext = computed(() => {
    const step = this.currentStep();
    const f = this.form();
    const errors = this.validateCurrentStep();
    
    const canGo = errors.length === 0;
    console.log('🚀 canGoNext computed:', { step, errorsCount: errors.length, canGo, errors });
    
    return canGo;
  });
  
  selectedTenantName = computed(() => {
    const tenantId = this.form().tenantId;
    if (!tenantId) return '';
    
    const tenant = this.availableTenants().find(t => t.id === tenantId);
    return tenant?.fullName || '';
  });
  
  // Actions
  nextStep() {
    if (this.canGoNext()) {
      this.currentStep.update(s => Math.min(s + 1, this.totalSteps()));
    }
  }
  
  previousStep() {
    this.currentStep.update(s => Math.max(s - 1, 1));
  }
  
  selectTenant(tenant: TenantListItem) {
    this.form.update(f => ({ 
      ...f, 
      tenantId: tenant.id,
      tenantName: tenant.fullName 
    }));
    this.showCreateTenant.set(false);
  }
  
  toggleCreateTenant() {
    this.showCreateTenant.update(v => !v);
  }
  
  // ✅ CORRECTION 5: Créer le locataire et l'ajouter immédiatement à la liste
  createNewTenant() {
    const newTenant = this.newTenantForm();
    if (!newTenant.firstName || !newTenant.lastName) {
      this.toasts.warningDirect('Prénom et nom requis');
      return;
    }
    
    if (!newTenant.email) {
      this.toasts.warningDirect('Email requis');
      return;
    }
    
    this.isLoading.set(true);
    
    // Préparer la requête API
    const createRequest = {
      firstName: newTenant.firstName,
      lastName: newTenant.lastName,
      email: newTenant.email,
      phone: newTenant.phone || '',
      birthDate: newTenant.birthDate || null,
      address: newTenant.address || '',
      guarantorName: newTenant.guarantorName,
      guarantorPhone: newTenant.guarantorPhone,
      guarantorEmail: newTenant.guarantorEmail
    };
    
    // Appel API pour créer le locataire
    this.tenantsApi.createTenant(createRequest).subscribe({
      next: (createdTenant) => {
        console.log('✅ Locataire créé avec succès:', createdTenant);
        
        // 1️⃣ Ajouter immédiatement le nouveau locataire à la liste disponible
        this.availableTenants.update(tenants => [...tenants, createdTenant]);
        this.filteredTenants.update(tenants => [...tenants, createdTenant]);
        
        // 2️⃣ Sélectionner automatiquement ce locataire dans le formulaire
        this.form.update(f => ({
          ...f,
          tenantId: createdTenant.id,
          tenantName: createdTenant.fullName
        }));
        
        // 3️⃣ Réinitialiser le formulaire de création et fermer le panneau
        this.newTenantForm.set({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          birthDate: '',
          address: ''
        });
        this.showCreateTenant.set(false);
        this.isLoading.set(false);
        
        console.log('✅ Locataire ajouté à la liste et automatiquement sélectionné');
      },
      error: (err) => {
        console.error('❌ Erreur création locataire:', err);
        this.isLoading.set(false);
        
        let errorMessage = 'Erreur lors de la création du locataire';
        if (err.error?.message) {
          errorMessage += ' : ' + err.error.message;
        } else if (err.error?.errors) {
          const errors = Object.values(err.error.errors).flat();
          errorMessage += ' :\n' + errors.join('\n');
        }
        
        this.toasts.errorDirect(errorMessage);
      }
    });
  }
  
  onFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.form.update(f => ({ ...f, pdfFile: file }));
      this.uploadedFileName.set(file.name);
    }
  }
  
  calculateDeposit() {
    const rent = this.form().rent || 0;
    this.form.update(f => ({ ...f, deposit: rent }));
  }
  
  submitContract() {
    const f = this.form();
    const prop = this.property();
    
    // Validation finale
    const allErrors = this.validateAllSteps();
    if (allErrors.length > 0) {
      this.validationErrors.set(allErrors);
      this.toasts.errorDirect('Des erreurs de validation existent :\n' + allErrors.join('\n'));
      return;
    }
    
    this.isSaving.set(true);
    this.validationErrors.set([]);
    
    // Préparer la requête API
    const request: CreateContractRequest = {
      propertyId: prop.id,
      tenantId: f.tenantId!,
      type: this.mapContractType(f.type!),
      startDate: f.startDate!,
      endDate: f.endDate!,
      rent: f.rent || 0,
      charges: f.charges || 0,
      deposit: f.deposit,
      roomId: f.roomId, // ✅ FIX #4: Include roomId for colocation
      notes: this.buildContractNotes(f)
    };
    
    console.log('📤 Sending contract request:', request);
         console.log('🔍 Raw form f:', f);
    
    // Appel API
    this.contractsApi.createContract(request).subscribe({
      next: (response) => {
        console.log('✅ Contract created successfully:', response);
        this.isSaving.set(false);
        this.success.emit();
        // TODO Phase 3: Générer PDF si demandé
        // TODO Phase 3: Créer EDL si prévu
      },
      error: (err) => {
        console.error('❌ Error creating contract:', err);
        this.isSaving.set(false);
        
        let errorMessage = 'Erreur lors de la création du contrat';
        if (err.error?.message) {
          errorMessage += ' : ' + err.error.message;
        } else if (err.error?.errors) {
          const errors = Object.values(err.error.errors).flat();
          errorMessage += ' :\n' + errors.join('\n');
        }
        
        this.toasts.errorDirect(errorMessage);
      }
    });
  }
  
  closeModal() {
    this.close.emit();
  }
  
  getStepTitle(step: number): string {
    if (this.mode() === 'paper') {
      // Mode contrat papier - 3 étapes
      switch(step) {
        case 1: return 'Sélection du locataire';
        case 2: return 'Upload du contrat signé';
        case 3: return 'Récapitulatif';
        default: return '';
      }
    } else {
      // Mode création standard - 4 étapes
      switch(step) {
        case 1: return 'Sélection du locataire';
        case 2: return 'Paramétrage du bail';
        case 3: return 'État des lieux (optionnel)';
        case 4: return 'Récapitulatif & Confirmation';
        default: return '';
      }
    }
  }
  
  getStepDescription(step: number): string {
    if (this.mode() === 'paper') {
      switch(step) {
        case 1: return 'Sélectionnez un locataire non déjà assigné';
        case 2: return 'Téléversez le contrat papier signé (PDF)';
        case 3: return 'Vérifiez les informations avant de créer le contrat';
        default: return '';
      }
    } else {
      switch(step) {
        case 1: return 'Sélectionnez un locataire existant ou créez-en un nouveau';
        case 2: return 'Définissez les informations légales du bail';
        case 3: return 'Planifiez l\'état des lieux d\'entrée (optionnel)';
        case 4: return 'Vérifiez toutes les informations avant de créer le contrat';
        default: return '';
      }
    }
  }
  
  formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
  
  // Validation complète
  validateCurrentStep(): string[] {
    const errors: string[] = [];
    const step = this.currentStep();
    const f = this.form();
    
    // DEBUG
    console.log('🔍 Validation étape', step, 'Form:', f);
    
    switch(step) {
      case 1: // Locataire
        if (!f.tenantId) {
          errors.push('Veuillez sélectionner un locataire');
        }
        // ✅ Validation chambre pour colocation
        if (this.isColocation()) {
          console.log('🚪 Colocation validation - roomId:', f.roomId, 'Available rooms:', this.availableRooms().length);
          if (!f.roomId) {
            errors.push('Veuillez sélectionner une chambre');
          }
          if (this.availableRooms().length === 0) {
            errors.push('Aucune chambre disponible pour ce bien');
          }
        }
        break;
        
      case 2: // Bail
        console.log('📅 Validation dates:', { startDate: f.startDate, endDate: f.endDate });
        console.log('💰 Validation loyer:', { rent: f.rent, type: typeof f.rent });
        console.log('📋 Type bail:', f.type);
        
        if (!f.startDate) {
          errors.push('Date de début requise');
        }
        if (!f.endDate) {
          errors.push('Date de fin requise');
        }
        if (f.startDate && f.endDate) {
          const start = new Date(f.startDate);
          const end = new Date(f.endDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          if (start < today) {
            errors.push('La date de début ne peut pas être dans le passé');
          }
          if (end <= start) {
            errors.push('La date de fin doit être après la date de début');
          }
        }
        // Vérification loyer - accepter 0 si c'est un nombre
        const rentValue = Number(f.rent);
        if (f.rent === undefined || f.rent === null || isNaN(rentValue)) {
          errors.push('Le loyer est requis');
        } else if (rentValue < 0) {
          errors.push('Le loyer ne peut pas être négatif');
        }
        // Charges optionnelles mais si renseignées, >= 0
        if (f.charges !== undefined && f.charges !== null) {
          const chargesValue = Number(f.charges);
          if (!isNaN(chargesValue) && chargesValue < 0) {
            errors.push('Les charges ne peuvent pas être négatives');
          }
        }
        if (!f.type) {
          errors.push('Type de bail requis');
        }
        break;
        
      case 3: // EDL
        if (f.inventoryOption === 'create_now') {
          if (!f.inventoryDate) {
            errors.push('Date de l\'état des lieux requise');
          }
          if (!f.inventoryAgent) {
            errors.push('Nom de l\'agent requis');
          }
        }
        break;
        
      case 4: // Récapitulatif - validation finale
        // Toutes les validations précédentes
        break;
    }
    
    console.log('❌ Erreurs de validation:', errors.length, errors);
    return errors;
  }
  
  validateAllSteps(): string[] {
    const allErrors: string[] = [];
    
    for (let step = 1; step <= 4; step++) {
      const stepErrors = this.validateStep(step);
      allErrors.push(...stepErrors);
    }
    
    return allErrors;
  }
  
  validateStep(step: number): string[] {
    const currentStep = this.currentStep();
    this.currentStep.set(step);
    const errors = this.validateCurrentStep();
    this.currentStep.set(currentStep);
    return errors;
  }
  
  calculateEndDate() {
    const startDate = this.form().startDate;
    const duration = this.form().duration || 12;
    
    if (startDate) {
      const start = new Date(startDate);
      const end = new Date(start);
      end.setMonth(end.getMonth() + duration);
      
      this.form.update(f => ({
        ...f,
        endDate: end.toISOString().split('T')[0]
      }));
    }
  }
  
  onSearchChange(term: string) {
    this.searchTerm.set(term);
  }
  
  // Helpers pour mise à jour form depuis template
  updateFormField(field: keyof ContractForm, value: any) {
    this.form.update(f => ({ ...f, [field]: value }));
  }
  
  updateStartDate(value: string) {
    this.form.update(f => ({ ...f, startDate: value }));
  }
  
  updateEndDate(value: string) {
    this.form.update(f => ({ ...f, endDate: value }));
  }
  
  updateType(value: string) {
    this.form.update(f => ({ ...f, type: value as any }));
  }
  
  updateRent(value: any) {
    this.form.update(f => ({ ...f, rent: +value }));
  }
  
  updateCharges(value: any) {
    this.form.update(f => ({ ...f, charges: +value }));
  }
  
  updateDeposit(value: any) {
    this.form.update(f => ({ ...f, deposit: +value }));
  }
  
  hasActiveLease(tenantId: string): boolean {
    // Vérification via API - utiliser contracts du locataire
    // Pour l'instant retourne false, sera implémenté avec effet async
    // TODO: Implémenter vérification async avec TenantsApi.getTenantContracts()
    return false;
  }
  
  // Helper pour mapper le type de contrat vers l'API
  private mapContractType(type: string): 'Furnished' | 'Unfurnished' {
    switch(type) {
      case 'Meublé':
      case 'Colocation individuelle':
      case 'Colocation solidaire':
        return 'Furnished';
      case 'Non meublé':
      default:
        return 'Unfurnished';
    }
  }
  
  // Helper pour construire les notes du contrat
  private buildContractNotes(form: Partial<ContractForm>): string {
    const notes: string[] = [];
    
    // Type de bail
    notes.push(`Type: ${form.type}`);
    
    // Chambre si colocation
    if (form.room) {
      notes.push(`Chambre: ${form.room}`);
    }
    
    // Options
    notes.push(`Durée: ${form.duration} mois`);
    notes.push(`Renouvellement auto: ${form.autoRenewal ? 'Oui' : 'Non'}`);
    notes.push(`Indexation IRL: ${form.indexationIRL ? 'Oui' : 'Non'}`);
    notes.push(`Méthode paiement: ${form.paymentMethod}`);
    
    // Charges
    if (form.charges) {
      notes.push(`Charges: ${form.charges}€`);
    }
    
    // EDL
    if (form.inventoryOption === 'create_now' && form.inventoryDate) {
      notes.push(`EDL prévu le ${this.formatDate(form.inventoryDate)}`);
      if (form.inventoryAgent) {
        notes.push(`Agent EDL: ${form.inventoryAgent}`);
      }
    } else if (form.inventoryOption === 'schedule_later') {
      notes.push('EDL à planifier');
    }
    
    // Template utilisé
    if (form.templateId) {
      const template = this.contractTemplates().find(t => t.id === form.templateId);
      if (template) {
        notes.push(`Template: ${template.name}`);
      }
    }
    
    return notes.join(' | ');
  }
  
  // PHASE 2: Templates de contrats
  applyTemplate(template: ContractTemplate) {
    this.form.update(f => ({
      ...f,
      templateId: template.id,
      type: template.type,
      duration: template.duration,
      autoRenewal: template.autoRenewal,
      indexationIRL: template.indexationIRL
    }));
    
    // Recalculer la date de fin
    this.calculateEndDate();
    this.showTemplates.set(false);
  }
  
  // PHASE 2: Suggestions intelligentes
  getSuggestedRent(): number {
    const prop = this.property();
    // TODO: Calculer moyenne marché ou historique
    return prop?.rent || 0;
  }
  
  getSuggestedCharges(): number {
    const prop = this.property();
    const rent = this.form().rent || prop?.rent || 0;
    // Suggestion: 10% du loyer en moyenne
    return Math.round(rent * 0.1);
  }
  
  // PHASE 2: Validation temps réel avec messages
  getRentValidationMessage(): string {
    const rent = this.form().rent;
    const suggested = this.getSuggestedRent();
    
    if (!rent || rent === 0) {
      return '⚠️ Loyer requis';
    }
    
    const diff = Math.abs(rent - suggested);
    const percentDiff = (diff / suggested) * 100;
    
    if (percentDiff > 20) {
      return `💡 Loyer du bien: ${suggested}€ (différence de ${percentDiff.toFixed(0)}%)`;
    }
    
    return '✅ Loyer correct';
  }
  
  getDateValidationMessage(): string {
    const start = this.form().startDate;
    const end = this.form().endDate;
    
    if (!start) return '⚠️ Date de début requise';
    if (!end) return '⚠️ Date de fin requise';
    
    const startDate = new Date(start);
    const endDate = new Date(end);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (startDate < today) {
      return '❌ Date de début ne peut pas être dans le passé';
    }
    
    if (endDate <= startDate) {
      return '❌ Date de fin doit être après la date de début';
    }
    
    const months = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
    return `✅ Durée: ${months} mois`;
  }
  
  // PHASE 2: Helpers pour affichage temps réel
  getTotalMonthly(): number {
    const rent = this.form().rent || 0;
    const charges = this.form().charges || 0;
    return rent + charges;
  }
  
  getContractDuration(): string {
    const start = this.form().startDate;
    const end = this.form().endDate;
    
    if (!start || !end) return '';
    
    const startDate = new Date(start);
    const endDate = new Date(end);
    const months = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
    
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
}
