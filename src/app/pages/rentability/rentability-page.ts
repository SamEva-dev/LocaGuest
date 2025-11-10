import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { RentabilityCalculatorService } from '../../core/services/rentability-calculator.service';
import { RentabilityScenariosService } from '../../core/services/rentability-scenarios.service';
import { ExportService } from '../../core/services/export.service';
import { 
  RentabilityInput, 
  RentabilityResult, 
  StepStatus, 
  WizardState 
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
  private exportService = inject(ExportService);

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
    this.isDirty.set(true);
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
      
      this.scenariosService.saveScenario(input, name, false, result || undefined, scenarioId || undefined)
        .subscribe({
          next: (scenario) => {
            this.currentScenarioId.set(scenario.id);
            this.lastSaved.set(new Date());
            this.isDirty.set(false);
            this.isSaving.set(false);
          },
          error: (error) => {
            console.error('Save error:', error);
            this.isSaving.set(false);
          }
        });
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
