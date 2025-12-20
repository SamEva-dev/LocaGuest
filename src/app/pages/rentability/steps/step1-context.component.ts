import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { PropertyContext } from '../../../core/models/rentability.models';

@Component({
  selector: 'app-step1-context',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe],
  template: `
    <div class="max-w-4xl">
      <h2 class="text-xl font-semibold text-slate-900 dark:text-white mb-2">
        {{ 'RENTABILITY.STEP1.TITLE' | translate }}
      </h2>
      <p class="text-slate-600 dark:text-slate-400 mb-6">
        {{ 'RENTABILITY.STEP1.SUBTITLE' | translate }}
      </p>

      <form [formGroup]="form" class="space-y-6">
        <!-- Type et Stratégie -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {{ 'RENTABILITY.STEP1.PROPERTY_TYPE' | translate }}
            </label>
            <select formControlName="type"
              class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white">
              <option value="apartment">{{ 'RENTABILITY.PROPERTY_TYPES.APARTMENT' | translate }}</option>
              <option value="house">{{ 'RENTABILITY.PROPERTY_TYPES.HOUSE' | translate }}</option>
              <option value="commercial">{{ 'RENTABILITY.PROPERTY_TYPES.COMMERCIAL' | translate }}</option>
              <option value="parking">{{ 'RENTABILITY.PROPERTY_TYPES.PARKING' | translate }}</option>
              <option value="land">{{ 'RENTABILITY.PROPERTY_TYPES.LAND' | translate }}</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {{ 'RENTABILITY.STEP1.STRATEGY' | translate }}
            </label>
            <select formControlName="strategy"
              class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white">
              <option value="bare">{{ 'RENTABILITY.STRATEGIES.BARE' | translate }}</option>
              <option value="furnished">{{ 'RENTABILITY.STRATEGIES.FURNISHED' | translate }}</option>
              <option value="seasonal">{{ 'RENTABILITY.STRATEGIES.SEASONAL' | translate }}</option>
              <option value="coliving">{{ 'RENTABILITY.STRATEGIES.COLIVING' | translate }}</option>
              <option value="commercial">{{ 'RENTABILITY.STRATEGIES.COMMERCIAL' | translate }}</option>
            </select>
          </div>
        </div>

        <!-- Localisation et Surface -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {{ 'RENTABILITY.STEP1.LOCATION' | translate }}
            </label>
            <input type="text" formControlName="location" placeholder="Paris 75001"
              class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white">
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {{ 'RENTABILITY.STEP1.SURFACE' | translate }} (m²)
            </label>
            <input type="number" formControlName="surface" min="1"
              class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white">
          </div>
        </div>

        <!-- État et Horizon -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {{ 'RENTABILITY.STEP1.STATE' | translate }}
            </label>
            <select formControlName="state"
              class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white">
              <option value="new">{{ 'RENTABILITY.STATES.NEW' | translate }}</option>
              <option value="good">{{ 'RENTABILITY.STATES.GOOD' | translate }}</option>
              <option value="toRenovate">{{ 'RENTABILITY.STATES.TO_RENOVATE' | translate }}</option>
              <option value="renovated">{{ 'RENTABILITY.STATES.RENOVATED' | translate }}</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {{ 'RENTABILITY.STEP1.HORIZON' | translate }} ({{ 'RENTABILITY.YEARS' | translate }})
            </label>
            <input type="number" formControlName="horizon" min="1" max="30"
              class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white">
          </div>
        </div>

        <!-- Objectif -->
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            {{ 'RENTABILITY.STEP1.OBJECTIVE' | translate }}
          </label>
          <div class="grid grid-cols-4 gap-3">
            <label class="relative flex items-center p-4 border-2 rounded-lg cursor-pointer"
              [class.border-blue-600]="form.get('objective')?.value === 'yield'"
              [class.bg-blue-50]="form.get('objective')?.value === 'yield'"
              [class.dark:bg-blue-900/20]="form.get('objective')?.value === 'yield'">
              <input type="radio" formControlName="objective" value="yield" class="sr-only">
              <div class="flex flex-col items-center w-full text-center">
                <i class="ph ph-percent text-2xl mb-2"></i>
                <span class="text-sm font-medium">{{ 'RENTABILITY.OBJECTIVES.YIELD' | translate }}</span>
              </div>
            </label>

            <label class="relative flex items-center p-4 border-2 rounded-lg cursor-pointer"
              [class.border-blue-600]="form.get('objective')?.value === 'cashflow'"
              [class.bg-blue-50]="form.get('objective')?.value === 'cashflow'"
              [class.dark:bg-blue-900/20]="form.get('objective')?.value === 'cashflow'">
              <input type="radio" formControlName="objective" value="cashflow" class="sr-only">
              <div class="flex flex-col items-center w-full text-center">
                <i class="ph ph-currency-dollar text-2xl mb-2"></i>
                <span class="text-sm font-medium">{{ 'RENTABILITY.OBJECTIVES.CASHFLOW' | translate }}</span>
              </div>
            </label>

            <label class="relative flex items-center p-4 border-2 rounded-lg cursor-pointer"
              [class.border-blue-600]="form.get('objective')?.value === 'appreciation'"
              [class.bg-blue-50]="form.get('objective')?.value === 'appreciation'"
              [class.dark:bg-blue-900/20]="form.get('objective')?.value === 'appreciation'">
              <input type="radio" formControlName="objective" value="appreciation" class="sr-only">
              <div class="flex flex-col items-center w-full text-center">
                <i class="ph ph-trend-up text-2xl mb-2"></i>
                <span class="text-sm font-medium">{{ 'RENTABILITY.OBJECTIVES.APPRECIATION' | translate }}</span>
              </div>
            </label>

            <label class="relative flex items-center p-4 border-2 rounded-lg cursor-pointer"
              [class.border-blue-600]="form.get('objective')?.value === 'taxReduction'"
              [class.bg-blue-50]="form.get('objective')?.value === 'taxReduction'"
              [class.dark:bg-blue-900/20]="form.get('objective')?.value === 'taxReduction'">
              <input type="radio" formControlName="objective" value="taxReduction" class="sr-only">
              <div class="flex flex-col items-center w-full text-center">
                <i class="ph ph-scales text-2xl mb-2"></i>
                <span class="text-sm font-medium">{{ 'RENTABILITY.OBJECTIVES.TAX_REDUCTION' | translate }}</span>
              </div>
            </label>
          </div>
        </div>

        <!-- Prix et Frais -->
        <div class="bg-slate-50 dark:bg-slate-700/30 p-6 rounded-lg space-y-4">
          <h3 class="font-medium text-slate-900 dark:text-white">
            {{ 'RENTABILITY.STEP1.FINANCIAL_DETAILS' | translate }}
          </h3>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {{ 'RENTABILITY.STEP1.PURCHASE_PRICE' | translate }} (€)
              </label>
              <input type="number" formControlName="purchasePrice" min="0" step="1000"
                class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white">
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {{ 'RENTABILITY.STEP1.NOTARY_FEES' | translate }} (€)
              </label>
              <input type="number" formControlName="notaryFees" min="0" step="100"
                class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white">
              <p class="text-xs text-slate-500 mt-1">{{ 'RENTABILITY.STEP1.NOTARY_FEES_HINT' | translate }}</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {{ 'RENTABILITY.STEP1.RENOVATION_COST' | translate }} (€)
              </label>
              <input type="number" formControlName="renovationCost" min="0" step="1000"
                class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white">
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {{ 'RENTABILITY.STEP1.LAND_VALUE' | translate }} (€)
              </label>
              <input type="number" formControlName="landValue" min="0" step="1000"
                class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white">
              <p class="text-xs text-slate-500 mt-1">{{ 'RENTABILITY.STEP1.LAND_VALUE_HINT' | translate }}</p>
            </div>
          </div>

          @if (form.get('strategy')?.value === 'furnished' || form.get('strategy')?.value === 'seasonal') {
            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {{ 'RENTABILITY.STEP1.FURNITURE_COST' | translate }} (€)
              </label>
              <input type="number" formControlName="furnitureCost" min="0" step="100"
                class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white">
            </div>
          }
        </div>

        <!-- Total Investment Display -->
        <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
          <div class="flex justify-between items-center">
            <span class="font-medium text-blue-900 dark:text-blue-300">
              {{ 'RENTABILITY.STEP1.TOTAL_INVESTMENT' | translate }}
            </span>
            <span class="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {{ totalInvestment() | number:'1.0-0' }} €
            </span>
          </div>
        </div>
      </form>
    </div>
  `
})
export class Step1ContextComponent implements OnInit, OnChanges {
  @Input() data?: Partial<PropertyContext> | undefined;
  @Output() dataChange = new EventEmitter<{data: PropertyContext, isValid: boolean}>();

  form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      type: ['apartment', Validators.required],
      location: ['', Validators.required],
      surface: [50, [Validators.required, Validators.min(1)]],
      state: ['good', Validators.required],
      strategy: ['bare', Validators.required],
      horizon: [10, [Validators.required, Validators.min(1), Validators.max(30)]],
      objective: ['cashflow', Validators.required],
      purchasePrice: [200000, [Validators.required, Validators.min(0)]],
      notaryFees: [16000, [Validators.required, Validators.min(0)]],
      renovationCost: [0, [Validators.required, Validators.min(0)]],
      landValue: [0, Validators.min(0)],
      furnitureCost: [0, Validators.min(0)]
    });

    // Emit changes
    effect(() => {
      this.form.valueChanges.subscribe(() => {
        this.emitChanges();
      });
    });
  }

  ngOnInit() {
    if (this.data) {
      this.form.patchValue(this.data, { emitEvent: false });
    }
    
    // Initial emit
    setTimeout(() => this.emitChanges(), 0);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['data'] && this.data) {
      this.form.patchValue(this.data, { emitEvent: false });
      setTimeout(() => this.emitChanges(), 0);
    }
  }

  totalInvestment(): number {
    const values = this.form.value;
    return (values.purchasePrice || 0) + 
           (values.notaryFees || 0) + 
           (values.renovationCost || 0) +
           (values.furnitureCost || 0);
  }

  private emitChanges() {
    this.dataChange.emit({
      data: this.form.value as PropertyContext,
      isValid: this.form.valid
    });
  }
}
