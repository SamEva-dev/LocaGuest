import { Component, inject, signal, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';

export interface TenantSelectionResult {
  tenantId: string;
  tenantName: string;
  startDate: Date;
  endDate: Date;
  rent: number;
  deposit?: number;
  type: string;
}

@Component({
  selector: 'tenant-selection-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  template: `
    <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden" (click)="$event.stopPropagation()">
        <!-- Header -->
        <div class="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 class="text-xl font-bold">{{ 'PROPERTY.ADD_TENANT' | translate }}</h2>
          <button (click)="close.emit()" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <i class="ph ph-x text-2xl"></i>
          </button>
        </div>

        <!-- Content -->
        <div class="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          @if (isLoading()) {
            <div class="flex items-center justify-center py-12">
              <i class="ph ph-spinner text-4xl animate-spin text-slate-400"></i>
            </div>
          } @else {
            <!-- Tenant List -->
            <div class="mb-6">
              <label class="block text-sm font-medium mb-2">{{ 'TENANT.SELECT' | translate }}</label>
              @if (availableTenants().length === 0) {
                <p class="text-slate-500 text-sm">{{ 'TENANT.NO_AVAILABLE' | translate }}</p>
              } @else {
                <div class="space-y-2 max-h-60 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-lg p-2">
                  @for (tenant of availableTenants(); track tenant.id) {
                    <label class="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition">
                      <input
                        type="radio"
                        name="selectedTenant"
                        [value]="tenant.id"
                        [(ngModel)]="selectedTenantId"
                        (change)="onTenantSelect(tenant)"
                        class="w-4 h-4 text-emerald-600"
                      />
                      <div class="flex-1">
                        <p class="font-medium">{{ tenant.fullName }}</p>
                        <p class="text-sm text-slate-500">{{ tenant.email }}</p>
                      </div>
                    </label>
                  }
                </div>
              }
            </div>

            <!-- Contract Details -->
            @if (selectedTenantId) {
              <div class="space-y-4 p-4 bg-slate-50 dark:bg-slate-700/30 rounded-lg">
                <h3 class="font-semibold">{{ 'CONTRACT.DETAILS' | translate }}</h3>
                
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium mb-1">{{ 'CONTRACT.START_DATE' | translate }}</label>
                    <input
                      type="date"
                      [(ngModel)]="contractForm.startDate"
                      class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                      required
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium mb-1">{{ 'CONTRACT.END_DATE' | translate }}</label>
                    <input
                      type="date"
                      [(ngModel)]="contractForm.endDate"
                      class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                      required
                    />
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium mb-1">{{ 'CONTRACT.RENT' | translate }}</label>
                    <input
                      type="number"
                      [(ngModel)]="contractForm.rent"
                      min="0"
                      step="0.01"
                      class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                      required
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium mb-1">{{ 'CONTRACT.DEPOSIT' | translate }}</label>
                    <input
                      type="number"
                      [(ngModel)]="contractForm.deposit"
                      min="0"
                      step="0.01"
                      class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label class="block text-sm font-medium mb-1">{{ 'CONTRACT.TYPE' | translate }}</label>
                  <select
                    [(ngModel)]="contractForm.type"
                    class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                  >
                    <option value="Unfurnished">{{ 'CONTRACT.TYPE_UNFURNISHED' | translate }}</option>
                    <option value="Furnished">{{ 'CONTRACT.TYPE_FURNISHED' | translate }}</option>
                  </select>
                </div>
              </div>
            }
          }
        </div>

        <!-- Footer -->
        <div class="flex items-center justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-700">
          <button
            (click)="close.emit()"
            class="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
          >
            {{ 'COMMON.CANCEL' | translate }}
          </button>
          <button
            (click)="onConfirm()"
            [disabled]="!isFormValid()"
            class="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {{ 'CONTRACT.CREATE' | translate }}
          </button>
        </div>
      </div>
    </div>
  `
})
export class TenantSelectionModal {
  availableTenants = signal<any[]>([]);
  isLoading = signal(false);
  selectedTenantId: string = '';
  selectedTenantName: string = '';

  contractForm = {
    startDate: '',
    endDate: '',
    rent: 0,
    deposit: 0,
    type: 'Unfurnished'
  };

  close = output<void>();
  confirm = output<TenantSelectionResult>();

  setTenants(tenants: any[]) {
    this.availableTenants.set(tenants);
  }

  setLoading(loading: boolean) {
    this.isLoading.set(loading);
  }

  onTenantSelect(tenant: any) {
    this.selectedTenantName = tenant.fullName;
  }

  onBackdropClick(event: MouseEvent) {
    this.close.emit();
  }

  isFormValid(): boolean {
    return !!(
      this.selectedTenantId &&
      this.contractForm.startDate &&
      this.contractForm.endDate &&
      this.contractForm.rent > 0
    );
  }

  onConfirm() {
    if (!this.isFormValid()) return;

    const result: TenantSelectionResult = {
      tenantId: this.selectedTenantId,
      tenantName: this.selectedTenantName,
      startDate: new Date(this.contractForm.startDate),
      endDate: new Date(this.contractForm.endDate),
      rent: this.contractForm.rent,
      deposit: this.contractForm.deposit || undefined,
      type: this.contractForm.type
    };

    this.confirm.emit(result);
  }
}
