import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { RevenueAssumptions } from '../../../core/models/rentability.models';

@Component({
  selector: 'app-step2-revenues',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe],
  template: `
    <div class="max-w-4xl">
      <h2 class="text-xl font-semibold text-slate-900 dark:text-white mb-2">
        {{ 'RENTABILITY.STEP2.TITLE' | translate }}
      </h2>
      <p class="text-slate-600 dark:text-slate-400 mb-6">
        {{ 'RENTABILITY.STEP2.SUBTITLE' | translate }}
      </p>

      <form [formGroup]="form" class="space-y-6">
        <!-- Loyer de base -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {{ 'RENTABILITY.STEP2.MONTHLY_RENT' | translate }} (€)
            </label>
            <input type="number" formControlName="monthlyRent" min="0" step="10"
              class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white">
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {{ 'RENTABILITY.STEP2.VACANCY_RATE' | translate }} (%)
            </label>
            <input type="number" formControlName="vacancyRate" min="0" max="100" step="0.1"
              class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white">
            <p class="text-xs text-slate-500 mt-1">{{ 'RENTABILITY.STEP2.VACANCY_HINT' | translate }}</p>
          </div>
        </div>

        <!-- Indexation -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {{ 'RENTABILITY.STEP2.INDEXATION' | translate }}
            </label>
            <select formControlName="indexation"
              class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white">
              <option value="irl">IRL</option>
              <option value="icc">ICC</option>
              <option value="fixed">{{ 'RENTABILITY.STEP2.FIXED' | translate }}</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {{ 'RENTABILITY.STEP2.INDEXATION_RATE' | translate }} (%)
            </label>
            <input type="number" formControlName="indexationRate" min="0" max="10" step="0.1"
              class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white">
          </div>
        </div>

        <!-- Revenus additionnels -->
        <div class="bg-slate-50 dark:bg-slate-700/30 p-6 rounded-lg space-y-4">
          <h3 class="font-medium text-slate-900 dark:text-white">
            {{ 'RENTABILITY.STEP2.ADDITIONAL_REVENUES' | translate }}
          </h3>

          <div class="grid grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {{ 'RENTABILITY.STEP2.PARKING_RENT' | translate }} (€/mois)
              </label>
              <input type="number" formControlName="parkingRent" min="0" step="10"
                class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white">
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {{ 'RENTABILITY.STEP2.STORAGE_RENT' | translate }} (€/mois)
              </label>
              <input type="number" formControlName="storageRent" min="0" step="10"
                class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white">
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {{ 'RENTABILITY.STEP2.OTHER_REVENUES' | translate }} (€/an)
              </label>
              <input type="number" formControlName="otherRevenues" min="0" step="10"
                class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white">
            </div>
          </div>
        </div>

        <!-- Options -->
        <div class="space-y-3">
          <label class="flex items-center gap-3 p-4 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/30">
            <input type="checkbox" formControlName="guaranteedRent"
              class="w-5 h-5 text-blue-600 border-slate-300 rounded">
            <div class="flex-1">
              <div class="font-medium text-slate-900 dark:text-white">
                {{ 'RENTABILITY.STEP2.GUARANTEED_RENT' | translate }}
              </div>
              <p class="text-sm text-slate-500">{{ 'RENTABILITY.STEP2.GUARANTEED_RENT_DESC' | translate }}</p>
            </div>
          </label>

          <label class="flex items-center gap-3 p-4 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/30">
            <input type="checkbox" formControlName="seasonalityEnabled"
              class="w-5 h-5 text-blue-600 border-slate-300 rounded">
            <div class="flex-1">
              <div class="font-medium text-slate-900 dark:text-white">
                {{ 'RENTABILITY.STEP2.SEASONALITY' | translate }}
              </div>
              <p class="text-sm text-slate-500">{{ 'RENTABILITY.STEP2.SEASONALITY_DESC' | translate }}</p>
            </div>
          </label>
        </div>

        @if (form.get('seasonalityEnabled')?.value) {
          <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <label class="block text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
              {{ 'RENTABILITY.STEP2.HIGH_SEASON_MULTIPLIER' | translate }}
            </label>
            <input type="number" formControlName="highSeasonMultiplier" min="1" max="3" step="0.1"
              class="w-32 px-4 py-2 rounded-lg border border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-700">
            <p class="text-xs text-blue-700 dark:text-blue-400 mt-1">
              {{ 'RENTABILITY.STEP2.MULTIPLIER_HINT' | translate }}
            </p>
          </div>
        }

        <!-- Projection preview -->
        <div class="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-4 rounded-lg">
          <div class="flex justify-between items-center">
            <span class="font-medium text-emerald-900 dark:text-emerald-300">
              {{ 'RENTABILITY.STEP2.ANNUAL_REVENUE' | translate }}
            </span>
            <span class="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {{ annualRevenue() | number:'1.0-0' }} €
            </span>
          </div>
          <p class="text-sm text-emerald-700 dark:text-emerald-400 mt-2">
            {{ 'RENTABILITY.STEP2.NET_AFTER_VACANCY' | translate }}: {{ netRevenue() | number:'1.0-0' }} €
          </p>
        </div>
      </form>
    </div>
  `
})
export class Step2RevenuesComponent implements OnInit, OnChanges {
  @Input() data?: Partial<RevenueAssumptions> | undefined;
  @Output() dataChange = new EventEmitter<{data: RevenueAssumptions, isValid: boolean}>();

  form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      monthlyRent: [1000, [Validators.required, Validators.min(0)]],
      indexation: ['irl', Validators.required],
      indexationRate: [2, [Validators.required, Validators.min(0)]],
      vacancyRate: [5, [Validators.required, Validators.min(0), Validators.max(100)]],
      seasonalityEnabled: [false],
      highSeasonMultiplier: [1.5],
      parkingRent: [0, Validators.min(0)],
      storageRent: [0, Validators.min(0)],
      otherRevenues: [0, Validators.min(0)],
      guaranteedRent: [false],
      relocationIncrease: [0, Validators.min(0)]
    });

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
    setTimeout(() => this.emitChanges(), 0);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['data'] && this.data) {
      this.form.patchValue(this.data, { emitEvent: false });
      setTimeout(() => this.emitChanges(), 0);
    }
  }

  annualRevenue(): number {
    const rent = this.form.get('monthlyRent')?.value || 0;
    const parking = this.form.get('parkingRent')?.value || 0;
    const storage = this.form.get('storageRent')?.value || 0;
    const other = this.form.get('otherRevenues')?.value || 0;
    
    return (rent + parking + storage) * 12 + other;
  }

  netRevenue(): number {
    const gross = this.annualRevenue();
    const vacancy = this.form.get('vacancyRate')?.value || 0;
    return gross * (1 - vacancy / 100);
  }

  private emitChanges() {
    this.dataChange.emit({
      data: this.form.value as RevenueAssumptions,
      isValid: this.form.valid
    });
  }
}
