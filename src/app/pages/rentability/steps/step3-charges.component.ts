import { Component, Input, Output, EventEmitter, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { ChargesAssumptions } from '../../../core/models/rentability.models';

@Component({
  selector: 'app-step3-charges',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe],
  template: `
    <div class="max-w-4xl">
      <h2 class="text-xl font-semibold text-slate-900 dark:text-white mb-2">
        {{ 'RENTABILITY.STEP3.TITLE' | translate }}
      </h2>
      <p class="text-slate-600 dark:text-slate-400 mb-6">
        {{ 'RENTABILITY.STEP3.SUBTITLE' | translate }}
      </p>

      <form [formGroup]="form" class="space-y-6">
        <!-- Charges mensuelles -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {{ 'RENTABILITY.STEP3.CONDO_FEES' | translate }} (€/mois)
            </label>
            <input type="number" formControlName="condoFees" min="0" step="10"
              class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white">
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {{ 'RENTABILITY.STEP3.INSURANCE' | translate }} (€/mois)
            </label>
            <input type="number" formControlName="insurance" min="0" step="10"
              class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white">
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {{ 'RENTABILITY.STEP3.PROPERTY_TAX' | translate }} (€/an)
            </label>
            <input type="number" formControlName="propertyTax" min="0" step="10"
              class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white">
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {{ 'RENTABILITY.STEP3.MANAGEMENT_FEES' | translate }} (%)
            </label>
            <input type="number" formControlName="managementFees" min="0" max="100" step="0.5"
              class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white">
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {{ 'RENTABILITY.STEP3.MAINTENANCE_RATE' | translate }} (%)
            </label>
            <input type="number" formControlName="maintenanceRate" min="0" max="100" step="0.5"
              class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white">
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {{ 'RENTABILITY.STEP3.RECOVERABLE_CHARGES' | translate }} (€/mois)
            </label>
            <input type="number" formControlName="recoverableCharges" min="0" step="10"
              class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white">
          </div>
        </div>

        <!-- Augmentation annuelle -->
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            {{ 'RENTABILITY.STEP3.CHARGES_INCREASE' | translate }} (%/an)
          </label>
          <input type="number" formControlName="chargesIncrease" min="0" max="10" step="0.1"
            class="w-48 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white">
        </div>

        <!-- CAPEX planifiés -->
        <div class="bg-slate-50 dark:bg-slate-700/30 p-6 rounded-lg">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-medium text-slate-900 dark:text-white">
              {{ 'RENTABILITY.STEP3.PLANNED_CAPEX' | translate }}
            </h3>
            <button type="button" (click)="addCapex()"
              class="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
              + {{ 'RENTABILITY.STEP3.ADD_CAPEX' | translate }}
            </button>
          </div>

          <div formArrayName="plannedCapex" class="space-y-3">
            @for (capex of plannedCapex.controls; track $index) {
              <div [formGroupName]="$index" class="flex gap-3 items-end">
                <div class="flex-1">
                  <input type="text" formControlName="description" placeholder="{{ 'RENTABILITY.STEP3.DESCRIPTION' | translate }}"
                    class="w-full px-3 py-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm">
                </div>
                <div class="w-24">
                  <input type="number" formControlName="year" min="1" placeholder="{{ 'RENTABILITY.STEP3.YEAR' | translate }}"
                    class="w-full px-3 py-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm">
                </div>
                <div class="w-32">
                  <input type="number" formControlName="amount" min="0" step="100" placeholder="{{ 'RENTABILITY.STEP3.AMOUNT' | translate }}"
                    class="w-full px-3 py-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm">
                </div>
                <button type="button" (click)="removeCapex($index)"
                  class="px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded">
                  <i class="ph ph-trash"></i>
                </button>
              </div>
            }
          </div>

          @if (plannedCapex.length === 0) {
            <p class="text-sm text-slate-500 text-center py-4">
              {{ 'RENTABILITY.STEP3.NO_CAPEX' | translate }}
            </p>
          }
        </div>

        <!-- Total charges annuelles -->
        <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-lg">
          <div class="flex justify-between items-center">
            <span class="font-medium text-red-900 dark:text-red-300">
              {{ 'RENTABILITY.STEP3.ANNUAL_CHARGES' | translate }} ({{ 'RENTABILITY.STEP3.YEAR_ONE' | translate }})
            </span>
            <span class="text-2xl font-bold text-red-600 dark:text-red-400">
              {{ annualCharges() | number:'1.0-0' }} €
            </span>
          </div>
        </div>
      </form>
    </div>
  `
})
export class Step3ChargesComponent implements OnInit {
  @Input() data?: Partial<ChargesAssumptions> | undefined;
  @Output() dataChange = new EventEmitter<{data: ChargesAssumptions, isValid: boolean}>();

  form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      condoFees: [100, [Validators.required, Validators.min(0)]],
      insurance: [30, [Validators.required, Validators.min(0)]],
      propertyTax: [800, [Validators.required, Validators.min(0)]],
      managementFees: [7, [Validators.required, Validators.min(0)]],
      maintenanceRate: [5, [Validators.required, Validators.min(0)]],
      recoverableCharges: [0, Validators.min(0)],
      chargesIncrease: [2, [Validators.required, Validators.min(0)]],
      plannedCapex: this.fb.array([])
    });

    effect(() => {
      this.form.valueChanges.subscribe(() => {
        this.emitChanges();
      });
    });
  }

  get plannedCapex(): FormArray {
    return this.form.get('plannedCapex') as FormArray;
  }

  ngOnInit() {
    if (this.data?.plannedCapex) {
      this.data.plannedCapex.forEach(capex => this.addCapexItem(capex));
    }
    if (this.data) {
      this.form.patchValue(this.data, { emitEvent: false });
    }
    setTimeout(() => this.emitChanges(), 0);
  }

  addCapex() {
    this.addCapexItem({ year: 1, amount: 0, description: '' });
  }

  private addCapexItem(capex: any) {
    this.plannedCapex.push(this.fb.group({
      year: [capex.year, [Validators.required, Validators.min(1)]],
      amount: [capex.amount, [Validators.required, Validators.min(0)]],
      description: [capex.description, Validators.required]
    }));
  }

  removeCapex(index: number) {
    this.plannedCapex.removeAt(index);
  }

  annualCharges(): number {
    const values = this.form.value;
    const monthly = (values.condoFees || 0) + (values.insurance || 0);
    const annual = values.propertyTax || 0;
    return monthly * 12 + annual;
  }

  private emitChanges() {
    this.dataChange.emit({
      data: this.form.value as ChargesAssumptions,
      isValid: this.form.valid
    });
  }
}
