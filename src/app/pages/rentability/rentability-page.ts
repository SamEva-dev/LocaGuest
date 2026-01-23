import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { RentabilityCalculatorService } from '../../core/services/rentability-calculator.service';
import { RentabilityScenariosService } from '../../core/services/rentability-scenarios.service';
import { ConnectivityService } from '../../core/services/connectivity.service';
import { RentabilityHybridService } from '../../core/services/rentability-hybrid.service';
import { ExportService } from '../../core/services/export.service';
import { PropertiesService } from '../../core/services/properties.service';
import { PropertyDetail } from '../../core/api/properties.api';
import { 
  RentabilityInput, 
  RentabilityResult, 
  StepStatus, 
  WizardState,
  PropertyContext
} from '../../core/models/rentability.models';

// Import des composants enfants
import { Step1ContextComponent } from './steps/step1-context.component.js';
import { Step2RevenuesComponent } from './steps/step2-revenues.component.js';
import { Step3ChargesComponent } from './steps/step3-charges.component.js';
import { Step4FinancingComponent } from './steps/step4-financing.component.js';
import { Step5TaxComponent } from './steps/step5-tax.component.js';
import { Step6ResultsComponent } from './steps/step6-results.component.js';
import { Step7AnalysisComponent } from './steps/step7-analysis.component.js';
import { ScenariosManagerComponent } from './components/scenarios-manager.component.js';

@Component({
  selector: 'app-rentability-page',
  standalone: true,
  imports: [
    CommonModule,
    TranslatePipe,
    Step1ContextComponent,
    Step2RevenuesComponent,
    Step3ChargesComponent,
    Step4FinancingComponent,
    Step5TaxComponent,
    Step6ResultsComponent,
    Step7AnalysisComponent,
    ScenariosManagerComponent
  ],
  templateUrl: './rentability-page.html',
  styleUrls: ['./rentability-page.scss']
})
export class RentabilityPage {
  private calculator = inject(RentabilityCalculatorService);
  scenariosService = inject(RentabilityScenariosService); // Public for template
  private hybridService = inject(RentabilityHybridService);
  private connectivity = inject(ConnectivityService);
  private exportService = inject(ExportService);
  private propertiesService = inject(PropertiesService);

  // State management avec signals
  currentStep = signal<number>(1);
  inputData = signal<Partial<RentabilityInput>>({});
  result = signal<RentabilityResult | null>(null);
  isDirty = signal<boolean>(false);
  lastSaved = signal<Date | null>(null);
  isSaving = signal<boolean>(false);
  currentScenarioId = signal<string | null>(null);
  scenarioName = signal<string>('Nouveau scénario');
  showScenarios = signal<boolean>(false);

  // Property selection
  properties = this.propertiesService.properties; // signal
  propertiesLoading = this.propertiesService.loading; // signal
  selectedPropertyId = signal<string | null>(null);
  selectedProperty = signal<PropertyDetail | null>(null);
  
  // État de chaque étape
  stepsStatus = signal<Record<number, StepStatus>>({
    1: 'idle',
    2: 'locked',
    3: 'locked',
    4: 'locked',
    5: 'locked',
    6: 'locked',
    7: 'locked'
  });

  // Tabs configuration
  tabs = [
    { id: 1, label: 'RENTABILITY.STEPS.CONTEXT', icon: 'ph-house' },
    { id: 2, label: 'RENTABILITY.STEPS.REVENUES', icon: 'ph-currency-dollar' },
    { id: 3, label: 'RENTABILITY.STEPS.CHARGES', icon: 'ph-receipt' },
    { id: 4, label: 'RENTABILITY.STEPS.FINANCING', icon: 'ph-bank' },
    { id: 5, label: 'RENTABILITY.STEPS.TAX', icon: 'ph-scales' },
    { id: 6, label: 'RENTABILITY.STEPS.RESULTS', icon: 'ph-chart-line' },
    { id: 7, label: 'RENTABILITY.STEPS.ANALYSIS', icon: 'ph-brain' }
  ];

  // Computed: étapes disponibles
  availableSteps = computed(() => {
    const steps: number[] = [1];
    const status = this.stepsStatus();
    
    for (let i = 2; i <= 7; i++) {
      if (status[i] !== 'locked') {
        steps.push(i);
      }
    }
    
    return steps;
  });

  // Computed: peut calculer
  canCalculate = computed(() => {
    const status = this.stepsStatus();
    return status[1] === 'valid' &&
           status[2] === 'valid' &&
           status[3] === 'valid' &&
           status[4] === 'valid' &&
           status[5] === 'valid';
  });

  // Computed: a des résultats
  hasResults = computed(() => this.result() !== null);

  // Auto-save effect
  constructor() {
    effect(() => {
      if (this.isDirty()) {
        this.autoSave();
      }
    });
    
    // Charger les scénarios au démarrage
    this.scenariosService.loadUserScenarios();

    // Charger la liste des biens (pour pré-remplissage)
    this.propertiesService.getProperties({ page: 1, pageSize: 200 }).subscribe();

    // Sync drafts when coming back online
    this.connectivity.onlineChanges().subscribe((online) => {
      if (online) {
        this.hybridService.syncPending().catch((e) => console.error('Sync pending drafts failed', e));
      }
    });
  }

  onSelectProperty(propertyId: string) {
    const id = propertyId || null;
    this.selectedPropertyId.set(id);

    if (!id) {
      this.selectedProperty.set(null);
      return;
    }

    this.propertiesService.getProperty(id).subscribe({
      next: (detail: PropertyDetail) => {
        this.selectedProperty.set(detail);
        const prefill = this.mapPropertyToRentabilityInput(detail);
        this.applyPrefill(prefill);
      },
      error: (err: unknown) => {
        console.error('Error loading property detail for rentability prefill:', err);
      }
    });
  }

  private applyPrefill(prefill: Partial<RentabilityInput>) {
    // Merge prefill into existing user data (do not wipe other steps)
    const before = this.inputData();
    this.inputData.update(current => ({
      ...current,
      ...prefill,
      context: { ...(current.context || {}), ...(prefill.context || {}) } as any,
      revenues: { ...(current.revenues || {}), ...(prefill.revenues || {}) } as any,
      charges: { ...(current.charges || {}), ...(prefill.charges || {}) } as any
    }));

    // Update step status (unlock sequentially for steps we prefilled)
    const hasContext = !!prefill.context;
    const hasRevenues = !!prefill.revenues;
    const hasCharges = !!prefill.charges;

    this.stepsStatus.update(status => {
      const next = { ...status };

      if (hasContext) {
        next[1] = 'valid';
        if (next[2] === 'locked') next[2] = 'idle';
      }
      if (hasRevenues) {
        next[2] = 'valid';
        if (next[3] === 'locked') next[3] = 'idle';
      }
      if (hasCharges) {
        next[3] = 'valid';
        if (next[4] === 'locked') next[4] = 'idle';
      }

      return next;
    });

    // Mark dirty only if prefill actually changed something
    const after = this.inputData();
    if (JSON.stringify(before) !== JSON.stringify(after)) {
      this.isDirty.set(true);
    }
  }

  private mapPropertyToRentabilityInput(property: PropertyDetail): Partial<RentabilityInput> {
    const locationParts = [property.address, property.postalCode, property.city].filter(Boolean);
    const location = locationParts.join(' ').trim();

    // Map property type to rentability type (fallback: apartment)
    const type = this.mapPropertyType(property.type);
    const strategy = this.mapUsageTypeToStrategy(property.propertyUsageType);

    const monthlyRent = this.deriveMonthlyRent(property);
    const vacancyRate = this.deriveVacancyRate(property);

    // Charges mapping (some fields exist on PropertyDetail)
    const propertyTax = Number(property.propertyTax || 0);
    const condoFeesMonthly = Number(property.condominiumCharges || 0) / 12;
    const insuranceMonthly = Number(property.insurance || 0);

    const managementFeesRate = Number(property.managementFeesRate ?? 7);
    const maintenanceRate = Number(property.maintenanceRate ?? 5);

    const hasPurchasePrice = property.purchasePrice !== null && property.purchasePrice !== undefined;
    if (!hasPurchasePrice) {
      console.warn(
        '[Rentability] Selected property detail does not include purchasePrice. Prefill will not override Step 1 purchase price.',
        { propertyId: property.id, propertyName: property.name, purchasePrice: property.purchasePrice }
      );
    }

    const contextPrefill: Partial<PropertyContext> = {
      type,
      location,
      surface: Number(property.surface || 0),
      state: 'good',
      strategy,
      horizon: 10,
      objective: 'cashflow',
      ...(hasPurchasePrice ? { purchasePrice: Number(property.purchasePrice) } : {}),
      notaryFees: 0,
      renovationCost: 0,
      landValue: 0,
      furnitureCost: 0
    };

    return {
      context: contextPrefill as any,
      revenues: {
        monthlyRent,
        indexation: 'irl',
        indexationRate: 2,
        vacancyRate,
        seasonalityEnabled: property.propertyUsageType === 'Airbnb',
        highSeasonMultiplier: property.propertyUsageType === 'Airbnb' ? 1.5 : undefined,
        parkingRent: 0,
        storageRent: 0,
        otherRevenues: 0,
        guaranteedRent: false,
        relocationIncrease: 0
      },
      charges: {
        condoFees: Number.isFinite(condoFeesMonthly) ? condoFeesMonthly : 0,
        insurance: Number.isFinite(insuranceMonthly) ? insuranceMonthly : 0,
        propertyTax,
        managementFees: Number.isFinite(managementFeesRate) ? managementFeesRate : 7,
        maintenanceRate: Number.isFinite(maintenanceRate) ? maintenanceRate : 5,
        recoverableCharges: Number(property.charges || 0),
        plannedCapex: [],
        chargesIncrease: 2
      }
    };
  }

  private mapPropertyType(type: string): any {
    const t = (type || '').toLowerCase();
    if (t.includes('house') || t.includes('maison')) return 'house';
    if (t.includes('commercial') || t.includes('commerce')) return 'commercial';
    if (t.includes('parking')) return 'parking';
    if (t.includes('land') || t.includes('terrain')) return 'land';
    return 'apartment';
  }

  private mapUsageTypeToStrategy(usage: string): any {
    if (usage === 'Colocation') return 'coliving';
    if (usage === 'Airbnb') return 'seasonal';
    return 'bare';
  }

  private deriveMonthlyRent(property: PropertyDetail): number {
    if (property.propertyUsageType === 'Colocation' && property.rooms?.length) {
      return property.rooms.reduce((sum, r) => sum + Number(r.rent || 0), 0);
    }
    if (property.propertyUsageType === 'Airbnb') {
      // Minimal heuristic until occupancy inputs exist
      const minStay = Number(property.minimumStay || 0);
      const pricePerNight = Number(property.pricePerNight || 0);
      const nightsBooked = Number(property.nightsBookedPerMonth ?? 0);
      const assumedBookedNights = Number.isFinite(nightsBooked) && nightsBooked > 0
        ? nightsBooked
        : (pricePerNight > 0 ? 20 : 0);
      return pricePerNight * assumedBookedNights;
    }
    return Number(property.rent || 0);
  }

  private deriveVacancyRate(property: PropertyDetail): number {
    const fromProperty = Number(property.vacancyRate ?? NaN);
    if (Number.isFinite(fromProperty) && fromProperty >= 0 && fromProperty <= 100) {
      return fromProperty;
    }
    return property.propertyUsageType === 'Airbnb' ? 20 : 5;
  }

  /**
   * Navigation vers une étape
   */
  goToStep(step: number) {
    const available = this.availableSteps();
    if (available.includes(step)) {
      this.currentStep.set(step);
    }
  }

  /**
   * Étape suivante
   */
  next() {
    const current = this.currentStep();
    if (current < 7) {
      this.goToStep(current + 1);
    }
  }

  /**
   * Étape précédente
   */
  previous() {
    const current = this.currentStep();
    if (current > 1) {
      this.goToStep(current - 1);
    }
  }

  /**
   * Vérifier si une étape est accessible
   */
  canActivateStep(step: number): boolean {
    return this.availableSteps().includes(step);
  }

  /**
   * Obtenir le statut d'une étape
   */
  getStepStatus(step: number): StepStatus {
    return this.stepsStatus()[step] || 'locked';
  }

  /**
   * Mettre à jour les données d'une étape
   */
  updateStepData(step: number, data: Partial<RentabilityInput>, isValid: boolean) {
    const beforeData = this.inputData();
    const beforeStatus = this.stepsStatus();

    // Fusionner les données
    this.inputData.update(current => ({
      ...current,
      ...data
    }));

    // Mettre à jour le statut de l'étape
    this.stepsStatus.update(status => ({
      ...status,
      [step]: isValid ? 'valid' : 'invalid',
      [step + 1]: isValid ? 'idle' : 'locked'
    }));

    // Marquer comme modifié
    const afterData = this.inputData();
    const afterStatus = this.stepsStatus();
    const dataChanged = JSON.stringify(beforeData) !== JSON.stringify(afterData);
    const statusChanged = JSON.stringify(beforeStatus) !== JSON.stringify(afterStatus);
    if (dataChanged || statusChanged) {
      this.isDirty.set(true);
    }
  }

  /**
   * Lancer le calcul
   */
  calculate() {
    if (!this.canCalculate()) {
      console.warn('Cannot calculate: missing required data');
      return;
    }

    try {
      // Ajouter les paramètres d'exit par défaut si manquants
      const inputWithDefaults = {
        ...this.inputData(),
        exit: this.inputData().exit || {
          method: 'appreciation' as const,
          annualAppreciation: 2,
          sellingCosts: 8,
          capitalGainsTax: 19,
          holdYears: this.inputData().context?.horizon || 10
        }
      };
      
      const input = inputWithDefaults as RentabilityInput;
      const result = this.calculator.calculate(input);
      
      this.result.set(result);
      
      // Déverrouiller les étapes résultats et analyse
      this.stepsStatus.update(status => ({
        ...status,
        6: 'idle',
        7: 'idle'
      }));

      // Rediriger vers les résultats
      this.goToStep(6);
      
    } catch (error) {
      console.error('Calculation error:', error);
    }
  }

  /**
   * Recalculer (depuis l'étape Analyse)
   */
  recalculate() {
    this.calculate();
  }

  /**
   * Auto-save (debounced)
   */
  // Auto-save timer
  private autoSaveTimeout?: number;

  private autoSave() {
    if (this.autoSaveTimeout) {
      clearTimeout(this.autoSaveTimeout);
    }

    this.autoSaveTimeout = window.setTimeout(() => {
      if (this.isDirty()) {
        this.save();
      }
    }, 2000); // 2 secondes
  }

  // Export methods
  exportPDF() {
    this.exportService.exportToPDF(
      this.scenarioName(),
      this.inputData(),
      this.result()
    );
  }

  exportExcel() {
    this.exportService.exportToExcel(
      this.scenarioName(),
      this.inputData(),
      this.result()
    );
  }

  exportJSON() {
    this.exportService.exportToJSON(
      this.scenarioName(),
      this.inputData(),
      this.result()
    );
  }

  /**
   * Sauvegarde
   */
  private async save() {
    this.isSaving.set(true);
    
    try {
      const input = this.inputData();
      const result = this.result();
      const scenarioId = this.currentScenarioId();
      const name = this.scenarioName();

      const out = await this.hybridService.saveHybrid({
        input,
        name,
        scenarioId: scenarioId || undefined,
        localResult: result,
      });

      if (out.scenarioId) {
        this.currentScenarioId.set(out.scenarioId);
      }

      this.lastSaved.set(new Date());
      this.isDirty.set(false);
      this.isSaving.set(false);
    } catch (error) {
      console.error('Save error:', error);
      this.isSaving.set(false);
    }
  }

  /**
   * Nouveau calcul
   */
  reset() {
    if (confirm('Voulez-vous vraiment recommencer ? Les données non sauvegardées seront perdues.')) {
      this.inputData.set({});
      this.result.set(null);
      this.currentStep.set(1);
      this.stepsStatus.set({
        1: 'idle',
        2: 'locked',
        3: 'locked',
        4: 'locked',
        5: 'locked',
        6: 'locked',
        7: 'locked'
      });
      this.isDirty.set(false);
    }
  }
}
