import { Component, Input, Output, EventEmitter, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { TaxAssumptions, PropertyContext } from '../../../core/models/rentability.models';

@Component({
  selector: 'app-step5-tax',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe],
  template: `
    <div class="max-w-4xl">
      <h2 class="text-xl font-semibold text-slate-900 dark:text-white mb-2">
        {{ 'RENTABILITY.STEP5.TITLE' | translate }}
      </h2>
      <p class="text-slate-600 dark:text-slate-400 mb-6">
        {{ 'RENTABILITY.STEP5.SUBTITLE' | translate }}
      </p>

      <form [formGroup]="form" class="space-y-6">
        <!-- Régime fiscal -->
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            {{ 'RENTABILITY.STEP5.TAX_REGIME' | translate }}
          </label>
          <div class="grid grid-cols-3 gap-3">
            @for (regime of taxRegimes; track regime.value) {
              <label class="relative flex items-center p-4 border-2 rounded-lg cursor-pointer"
                [class.border-blue-600]="form.get('regime')?.value === regime.value"
                [class.bg-blue-50]="form.get('regime')?.value === regime.value"
                [class.dark:bg-blue-900/20]="form.get('regime')?.value === regime.value">
                <input type="radio" formControlName="regime" [value]="regime.value" class="sr-only">
                <div class="flex flex-col w-full">
                  <span class="font-medium text-sm">{{ regime.label | translate }}</span>
                  <span class="text-xs text-slate-500 mt-1">{{ regime.desc | translate }}</span>
                </div>
              </label>
            }
          </div>
        </div>

        <!-- Taux marginaux -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {{ 'RENTABILITY.STEP5.MARGINAL_TAX_RATE' | translate }} (%)
            </label>
            <select formControlName="marginalTaxRate"
              class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white">
              <option [value]="0">0% (Non imposable)</option>
              <option [value]="11">11%</option>
              <option [value]="30">30%</option>
              <option [value]="41">41%</option>
              <option [value]="45">45%</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {{ 'RENTABILITY.STEP5.SOCIAL_CONTRIBUTIONS' | translate }} (%)
            </label>
            <input type="number" formControlName="socialContributions" min="0" max="20" step="0.1"
              class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white">
            <p class="text-xs text-slate-500 mt-1">17.2% par défaut</p>
          </div>
        </div>

        <!-- Paramètres LMNP -->
        @if (form.get('regime')?.value === 'lmnp' || form.get('regime')?.value === 'lmp') {
          <div class="bg-slate-50 dark:bg-slate-700/30 p-6 rounded-lg space-y-4">
            <h3 class="font-medium text-slate-900 dark:text-white">
              {{ 'RENTABILITY.STEP5.LMNP_PARAMS' | translate }}
            </h3>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  {{ 'RENTABILITY.STEP5.DEPRECIATION_YEARS' | translate }}
                </label>
                <input type="number" formControlName="depreciationYears" min="1" max="50"
                  class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white">
                <p class="text-xs text-slate-500 mt-1">25-30 ans typique</p>
              </div>

              <div>
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  {{ 'RENTABILITY.STEP5.FURNITURE_DEPRECIATION_YEARS' | translate }}
                </label>
                <input type="number" formControlName="furnitureDepreciationYears" min="1" max="15"
                  class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white">
                <p class="text-xs text-slate-500 mt-1">5-7 ans typique</p>
              </div>
            </div>
          </div>
        }

        <!-- Déficit foncier -->
        @if (form.get('regime')?.value === 'real') {
          <div>
            <label class="flex items-center gap-3 p-4 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer">
              <input type="checkbox" formControlName="deficitCarryForward"
                class="w-5 h-5 text-blue-600 border-slate-300 rounded">
              <div class="flex-1">
                <div class="font-medium text-slate-900 dark:text-white">
                  {{ 'RENTABILITY.STEP5.DEFICIT_CARRY_FORWARD' | translate }}
                </div>
                <p class="text-sm text-slate-500">{{ 'RENTABILITY.STEP5.DEFICIT_DESC' | translate }}</p>
              </div>
            </label>
          </div>
        }

        <!-- CRL -->
        <div>
          <label class="flex items-center gap-3 p-4 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer">
            <input type="checkbox" formControlName="crlApplicable"
              class="w-5 h-5 text-blue-600 border-slate-300 rounded">
            <div class="flex-1">
              <div class="font-medium text-slate-900 dark:text-white">
                {{ 'RENTABILITY.STEP5.CRL' | translate }}
              </div>
              <p class="text-sm text-slate-500">{{ 'RENTABILITY.STEP5.CRL_DESC' | translate }}</p>
            </div>
          </label>
        </div>

        <!-- Info fiscale estimée -->
        <div class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 rounded-lg">
          <div class="flex items-start gap-3">
            <i class="ph ph-info text-amber-600 dark:text-amber-400 text-xl"></i>
            <div>
              <h4 class="font-medium text-amber-900 dark:text-amber-300 mb-1">
                {{ 'RENTABILITY.STEP5.TAX_INFO' | translate }}
              </h4>
              <p class="text-sm text-amber-700 dark:text-amber-400">
                {{ getTaxInfo() }}
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  `
})
export class Step5TaxComponent implements OnInit {
  @Input() data?: Partial<TaxAssumptions> | undefined;
  @Input() context?: Partial<PropertyContext> | undefined;
  @Output() dataChange = new EventEmitter<{data: TaxAssumptions, isValid: boolean}>();

  form: FormGroup;

  taxRegimes = [
    { value: 'micro', label: 'RENTABILITY.TAX_REGIMES.MICRO', desc: 'RENTABILITY.TAX_REGIMES.MICRO_DESC' },
    { value: 'real', label: 'RENTABILITY.TAX_REGIMES.REAL', desc: 'RENTABILITY.TAX_REGIMES.REAL_DESC' },
    { value: 'lmnp', label: 'RENTABILITY.TAX_REGIMES.LMNP', desc: 'RENTABILITY.TAX_REGIMES.LMNP_DESC' },
    { value: 'lmp', label: 'RENTABILITY.TAX_REGIMES.LMP', desc: 'RENTABILITY.TAX_REGIMES.LMP_DESC' },
    { value: 'sci_ir', label: 'RENTABILITY.TAX_REGIMES.SCI_IR', desc: 'RENTABILITY.TAX_REGIMES.SCI_IR_DESC' },
    { value: 'sci_is', label: 'RENTABILITY.TAX_REGIMES.SCI_IS', desc: 'RENTABILITY.TAX_REGIMES.SCI_IS_DESC' }
  ];

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      regime: ['lmnp', Validators.required],
      marginalTaxRate: [30, [Validators.required, Validators.min(0)]],
      socialContributions: [17.2, [Validators.required, Validators.min(0)]],
      depreciationYears: [25, Validators.min(1)],
      furnitureDepreciationYears: [5, Validators.min(1)],
      deficitCarryForward: [false],
      crlApplicable: [false]
    });

    effect(() => {
      this.form.valueChanges.subscribe(() => {
        this.emitChanges();
      });
    });
  }

  ngOnInit() {
    if (this.data) {
      this.form.patchValue(this.data);
    }
    setTimeout(() => this.emitChanges(), 0);
  }

  getTaxInfo(): string {
    const regime = this.form.get('regime')?.value;
    switch (regime) {
      case 'micro':
        return 'Abattement forfaitaire de 50% (meublé) ou 30% (nu). Simplicité administrative.';
      case 'real':
        return 'Déduction des charges réelles. Adapté si charges > 50% des revenus.';
      case 'lmnp':
        return 'Amortissement du bien et du mobilier. Optimal pour réduire l\'imposition.';
      case 'lmp':
        return 'Statut professionnel avec cotisations sociales différentes.';
      case 'sci_ir':
        return 'Transparence fiscale, imposition au barème progressif.';
      case 'sci_is':
        return 'Imposition à l\'IS (15% puis 25%). Amortissements déductibles.';
      default:
        return '';
    }
  }

  private emitChanges() {
    this.dataChange.emit({
      data: this.form.value as TaxAssumptions,
      isValid: this.form.valid
    });
  }
}
