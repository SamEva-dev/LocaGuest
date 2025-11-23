import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { ContractsApi, ContractDto, ContractStats, CreateContractRequest, TerminateContractRequest, RecordPaymentRequest } from '../../../../core/api/contracts.api';
import { TenantsApi } from '../../../../core/api/tenants.api';
import { PropertiesApi } from '../../../../core/api/properties.api';


@Component({
  selector: 'contracts-tab',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslatePipe],
  template: `
    <div class="p-6 space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold">{{ 'CONTRACTS.TITLE' | translate }}</h1>
          <p class="text-slate-500 text-sm">{{ 'CONTRACTS.SUBTITLE' | translate }}</p>
        </div>
        <button (click)="openCreateModal()" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
          <i class="ph ph-plus mr-2"></i>{{ 'CONTRACTS.NEW' | translate }}
        </button>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-slate-500">{{ 'CONTRACTS.STATS.ACTIVE' | translate }}</p>
              <p class="text-2xl font-bold mt-1">{{ stats()?.activeContracts || 0 }}</p>
            </div>
            <div class="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <i class="ph ph-file-text text-2xl text-blue-600"></i>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-slate-500">{{ 'CONTRACTS.STATS.EXPIRING' | translate }}</p>
              <p class="text-2xl font-bold mt-1 text-orange-600">{{ stats()?.expiringIn3Months || 0 }}</p>
            </div>
            <div class="w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <i class="ph ph-warning text-2xl text-orange-600"></i>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-slate-500">{{ 'CONTRACTS.STATS.REVENUE' | translate }}</p>
              <p class="text-2xl font-bold mt-1 text-emerald-600">{{ stats()?.monthlyRevenue?.toLocaleString() || 0 }}€</p>
              <p class="text-xs text-slate-400">{{ 'CONTRACTS.STATS.PER_MONTH' | translate }}</p>
            </div>
            <div class="w-12 h-12 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <i class="ph ph-currency-eur text-2xl text-emerald-600"></i>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-slate-500">{{ 'CONTRACTS.STATS.TENANTS' | translate }}</p>
              <p class="text-2xl font-bold mt-1">{{ stats()?.totalTenants || 0 }}</p>
            </div>
            <div class="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <i class="ph ph-users-three text-2xl text-purple-600"></i>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters & Search -->
      <div class="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
        <div class="flex flex-wrap gap-4">
          <div class="flex-1 min-w-[200px]">
            <div class="relative">
              <i class="ph ph-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
              <input
                type="text"
                [(ngModel)]="searchTerm"
                (ngModelChange)="onSearchChange()"
                placeholder="{{ 'CONTRACTS.SEARCH' | translate }}"
                class="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
              />
            </div>
          </div>
          <select
            [(ngModel)]="statusFilter"
            (ngModelChange)="onFilterChange()"
            class="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
          >
            <option value="">{{ 'CONTRACTS.ALL_STATUS' | translate }}</option>
            <option value="Active">{{ 'CONTRACTS.STATUS.ACTIVE' | translate }}</option>
            <option value="Expiring">{{ 'CONTRACTS.STATUS.EXPIRING' | translate }}</option>
            <option value="Terminated">{{ 'CONTRACTS.STATUS.TERMINATED' | translate }}</option>
          </select>
          <select
            [(ngModel)]="typeFilter"
            (ngModelChange)="onFilterChange()"
            class="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
          >
            <option value="">{{ 'CONTRACTS.ALL_TYPES' | translate }}</option>
            <option value="Furnished">{{ 'CONTRACT.TYPE_FURNISHED' | translate }}</option>
            <option value="Unfurnished">{{ 'CONTRACT.TYPE_UNFURNISHED' | translate }}</option>
          </select>
        </div>
      </div>

      <!-- Contracts List -->
      <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
        <div class="p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 class="text-lg font-semibold">{{ 'CONTRACTS.LIST' | translate }}</h2>
        </div>
        <div class="divide-y divide-slate-200 dark:divide-slate-700">
          @if (isLoading()) {
            <div class="p-12 text-center">
              <i class="ph ph-spinner text-4xl animate-spin text-slate-400"></i>
            </div>
          } @else if (contracts().length === 0) {
            <div class="p-12 text-center text-slate-500">
              <i class="ph ph-file-text text-4xl mb-2"></i>
              <p>{{ 'CONTRACTS.NO_RESULTS' | translate }}</p>
            </div>
          } @else {
            @for (contract of contracts(); track contract.id) {
              <div class="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition cursor-pointer">
                <div class="flex items-center gap-4">
                  <div class="flex-1">
                    <div class="flex items-center gap-2">
                      <h3 class="font-medium">{{ contract.propertyName || 'Property' }}</h3>
                      @if (contract.status === 'Active') {
                        <span class="px-2 py-0.5 text-xs rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30">
                          {{ contract.status }}
                        </span>
                      } @else if (contract.status === 'Expiring') {
                        <span class="px-2 py-0.5 text-xs rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/30">
                          {{ 'CONTRACTS.EXPIRES_SOON' | translate }}
                        </span>
                      } @else {
                        <span class="px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-700 dark:bg-slate-900/30">
                          {{ contract.status }}
                        </span>
                      }
                    </div>
                    <div class="flex items-center gap-4 mt-1 text-sm text-slate-500">
                      <span><i class="ph ph-users mr-1"></i>{{ contract.tenantName || 'Tenant' }}</span>
                      <span><i class="ph ph-calendar mr-1"></i>{{ contract.startDate | date:'dd/MM/yyyy' }} - {{ contract.endDate | date:'dd/MM/yyyy' }}</span>
                      <span class="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700">{{ contract.type === 'Furnished' ? ('CONTRACT.TYPE_FURNISHED' | translate) : ('CONTRACT.TYPE_UNFURNISHED' | translate) }}</span>
                    </div>
                  </div>
                  <div class="text-right">
                    <p class="text-xl font-semibold text-emerald-600">{{ contract.rent.toLocaleString() }}€</p>
                    <p class="text-xs text-slate-400">{{ 'CONTRACTS.PER_MONTH' | translate }}</p>
                  </div>
                  <div class="flex gap-2">
                    <button (click)="viewContract(contract)" class="px-3 py-1.5 text-sm rounded-lg border border-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition">
                      <i class="ph ph-eye mr-1"></i>{{ 'COMMON.VIEW' | translate }}
                    </button>
                    <button (click)="openPaymentModal(contract)" class="px-3 py-1.5 text-sm rounded-lg border border-emerald-300 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition">
                      <i class="ph ph-currency-eur mr-1"></i>{{ 'CONTRACTS.RECORD_PAYMENT' | translate }}
                    </button>
                    <button (click)="openTerminateModal(contract)" class="px-3 py-1.5 text-sm rounded-lg border border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition">
                      <i class="ph ph-x-circle mr-1"></i>{{ 'CONTRACTS.TERMINATE' | translate }}
                    </button>
                  </div>
                </div>
              </div>
            }
          }
        </div>
      </div>

      <!-- Create Contract Modal -->
      @if (showCreateModal()) {
        <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" (click)="closeModals()">
          <div class="bg-white dark:bg-slate-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" (click)="$event.stopPropagation()">
            <div class="p-6 border-b border-slate-200 dark:border-slate-700">
              <h2 class="text-xl font-bold">{{ 'CONTRACTS.CREATE_NEW' | translate }}</h2>
            </div>
            <form [formGroup]="createForm" (ngSubmit)="submitCreate()" class="p-6 space-y-4">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium mb-2">{{ 'CONTRACTS.PROPERTY' | translate }} *</label>
                  <input type="text" formControlName="propertyId" placeholder="Property ID" class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700" />
                </div>
                <div>
                  <label class="block text-sm font-medium mb-2">{{ 'CONTRACTS.TENANT' | translate }} *</label>
                  <input type="text" formControlName="tenantId" placeholder="Tenant ID" class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700" />
                </div>
                <div>
                  <label class="block text-sm font-medium mb-2">{{ 'CONTRACTS.TYPE' | translate }} *</label>
                  <select formControlName="type" class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700">
                    <option value="Furnished">{{ 'CONTRACT.TYPE_FURNISHED' | translate }}</option>
                    <option value="Unfurnished">{{ 'CONTRACT.TYPE_UNFURNISHED' | translate }}</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium mb-2">{{ 'CONTRACTS.RENT' | translate }} *</label>
                  <input type="number" formControlName="rent" class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700" />
                </div>
                <div>
                  <label class="block text-sm font-medium mb-2">{{ 'CONTRACTS.START_DATE' | translate }} *</label>
                  <input type="date" formControlName="startDate" class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700" />
                </div>
                <div>
                  <label class="block text-sm font-medium mb-2">{{ 'CONTRACTS.END_DATE' | translate }} *</label>
                  <input type="date" formControlName="endDate" class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700" />
                </div>
                <div class="col-span-2">
                  <label class="block text-sm font-medium mb-2">{{ 'CONTRACTS.DEPOSIT' | translate }}</label>
                  <input type="number" formControlName="deposit" class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700" />
                </div>
              </div>
              <div class="flex gap-3 justify-end pt-4">
                <button type="button" (click)="closeModals()" class="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">{{ 'COMMON.CANCEL' | translate }}</button>
                <button type="submit" [disabled]="createForm.invalid" class="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">{{ 'COMMON.CREATE' | translate }}</button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Payment Modal -->
      @if (showPaymentModal()) {
        <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" (click)="closeModals()">
          <div class="bg-white dark:bg-slate-800 rounded-xl max-w-md w-full" (click)="$event.stopPropagation()">
            <div class="p-6 border-b border-slate-200 dark:border-slate-700">
              <h2 class="text-xl font-bold">{{ 'CONTRACTS.RECORD_PAYMENT' | translate }}</h2>
              <p class="text-sm text-slate-500 mt-1">{{ selectedContract()?.propertyName }} - {{ selectedContract()?.tenantName }}</p>
            </div>
            <form [formGroup]="paymentForm" (ngSubmit)="submitPayment()" class="p-6 space-y-4">
              <div>
                <label class="block text-sm font-medium mb-2">{{ 'PAYMENT.AMOUNT' | translate }} *</label>
                <input type="number" formControlName="amount" class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700" />
              </div>
              <div>
                <label class="block text-sm font-medium mb-2">{{ 'PAYMENT.DATE' | translate }} *</label>
                <input type="date" formControlName="paymentDate" class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700" />
              </div>
              <div>
                <label class="block text-sm font-medium mb-2">{{ 'PAYMENT.METHOD' | translate }} *</label>
                <select formControlName="method" class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700">
                  <option value="BankTransfer">{{ 'PAYMENT.METHOD_BANK' | translate }}</option>
                  <option value="Check">{{ 'PAYMENT.METHOD_CHECK' | translate }}</option>
                  <option value="Cash">{{ 'PAYMENT.METHOD_CASH' | translate }}</option>
                  <option value="CreditCard">{{ 'PAYMENT.METHOD_CARD' | translate }}</option>
                </select>
              </div>
              <div class="flex gap-3 justify-end pt-4">
                <button type="button" (click)="closeModals()" class="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">{{ 'COMMON.CANCEL' | translate }}</button>
                <button type="submit" [disabled]="paymentForm.invalid" class="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50">{{ 'COMMON.SAVE' | translate }}</button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Terminate Contract Modal -->
      @if (showTerminateModal()) {
        <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" (click)="closeModals()">
          <div class="bg-white dark:bg-slate-800 rounded-xl max-w-md w-full" (click)="$event.stopPropagation()">
            <div class="p-6 border-b border-slate-200 dark:border-slate-700">
              <h2 class="text-xl font-bold text-red-600">{{ 'CONTRACTS.TERMINATE_CONTRACT' | translate }}</h2>
              <p class="text-sm text-slate-500 mt-1">{{ selectedContract()?.propertyName }} - {{ selectedContract()?.tenantName }}</p>
            </div>
            <form [formGroup]="terminateForm" (ngSubmit)="submitTerminate()" class="p-6 space-y-4">
              <div class="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                <p class="text-sm text-orange-800 dark:text-orange-200">
                  <i class="ph ph-warning-circle mr-2"></i>
                  {{ 'CONTRACTS.TERMINATE_WARNING' | translate }}
                </p>
              </div>
              <div>
                <label class="block text-sm font-medium mb-2">{{ 'CONTRACTS.TERMINATION_DATE' | translate }} *</label>
                <input type="date" formControlName="terminationDate" class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700" />
              </div>
              <div>
                <label class="flex items-center gap-2">
                  <input type="checkbox" formControlName="markPropertyVacant" class="rounded" />
                  <span class="text-sm">{{ 'CONTRACTS.MARK_PROPERTY_VACANT' | translate }}</span>
                </label>
              </div>
              <div class="flex gap-3 justify-end pt-4">
                <button type="button" (click)="closeModals()" class="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">{{ 'COMMON.CANCEL' | translate }}</button>
                <button type="submit" [disabled]="terminateForm.invalid" class="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50">{{ 'CONTRACTS.TERMINATE' | translate }}</button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `
})
export class ContractsTab implements OnInit {
  private contractsApi = inject(ContractsApi);
  private tenantsApi = inject(TenantsApi);
  private propertiesApi = inject(PropertiesApi);
  private fb = inject(FormBuilder);
  
  stats = signal<ContractStats | null>(null);
  contracts = signal<ContractDto[]>([]);
  isLoading = signal(false);
  
  searchTerm = '';
  statusFilter = '';
  typeFilter = '';

  // Modals
  showCreateModal = signal(false);
  showPaymentModal = signal(false);
  showTerminateModal = signal(false);
  showViewModal = signal(false);
  selectedContract = signal<ContractDto | null>(null);

  // Forms
  createForm = this.fb.group({
    propertyId: ['', Validators.required],
    tenantId: ['', Validators.required],
    type: ['Furnished', Validators.required],
    startDate: ['', Validators.required],
    endDate: ['', Validators.required],
    rent: [0, [Validators.required, Validators.min(0)]],
    deposit: [0, Validators.min(0)]
  });

  paymentForm = this.fb.group({
    amount: [0, [Validators.required, Validators.min(0)]],
    paymentDate: [new Date().toISOString().split('T')[0], Validators.required],
    method: ['BankTransfer', Validators.required]
  });

  terminateForm = this.fb.group({
    terminationDate: [new Date().toISOString().split('T')[0], Validators.required],
    markPropertyVacant: [true]
  });

  ngOnInit() {
    this.loadStats();
    this.loadContracts();
  }

  loadStats() {
    this.contractsApi.getStats().subscribe({
      next: (data) => this.stats.set(data),
      error: (err) => console.error('❌ Error loading contract stats:', err)
    });
  }

  loadContracts() {
    this.isLoading.set(true);
    this.contractsApi.getAllContracts(this.searchTerm, this.statusFilter, this.typeFilter).subscribe({
      next: (data) => {
        this.contracts.set(data);
        this.isLoading.set(false);
        console.log('✅ Contracts loaded:', data.length);
      },
      error: (err) => {
        console.error('❌ Error loading contracts:', err);
        this.isLoading.set(false);
      }
    });
  }

  onSearchChange() {
    this.loadContracts();
  }

  onFilterChange() {
    this.loadContracts();
  }

  // View contract details
  viewContract(contract: ContractDto) {
    this.selectedContract.set(contract);
    this.showViewModal.set(true);
  }

  // Create contract
  openCreateModal() {
    this.createForm.reset({
      type: 'Furnished',
      rent: 0,
      deposit: 0
    });
    this.showCreateModal.set(true);
  }

  submitCreate() {
    if (this.createForm.invalid) return;

    const formValue = this.createForm.value;
    const request: CreateContractRequest = {
      propertyId: formValue.propertyId!,
      tenantId: formValue.tenantId!,
      type: formValue.type as 'Furnished' | 'Unfurnished',
      startDate: formValue.startDate!,
      endDate: formValue.endDate!,
      rent: formValue.rent!,
      deposit: formValue.deposit || 0
    };

    this.contractsApi.createContract(request).subscribe({
      next: () => {
        this.showCreateModal.set(false);
        this.loadContracts();
        this.loadStats();
        alert('✅ Contrat créé avec succès !');
      },
      error: (err) => {
        console.error('❌ Error creating contract:', err);
        alert('❌ Erreur lors de la création du contrat');
      }
    });
  }

  // Record payment
  openPaymentModal(contract: ContractDto) {
    this.selectedContract.set(contract);
    this.paymentForm.reset({
      amount: contract.rent,
      paymentDate: new Date().toISOString().split('T')[0],
      method: 'BankTransfer'
    });
    this.showPaymentModal.set(true);
  }

  submitPayment() {
    if (this.paymentForm.invalid) return;

    const contract = this.selectedContract();
    if (!contract) return;

    const formValue = this.paymentForm.value;
    const request: RecordPaymentRequest = {
      amount: formValue.amount!,
      paymentDate: formValue.paymentDate!,
      method: formValue.method as any
    };

    this.contractsApi.recordPayment(contract.id, request).subscribe({
      next: () => {
        this.showPaymentModal.set(false);
        this.loadContracts();
        alert('✅ Paiement enregistré avec succès !');
      },
      error: (err) => {
        console.error('❌ Error recording payment:', err);
        alert('❌ Erreur lors de l\'enregistrement du paiement');
      }
    });
  }

  // Terminate contract
  openTerminateModal(contract: ContractDto) {
    this.selectedContract.set(contract);
    this.terminateForm.reset({
      terminationDate: new Date().toISOString().split('T')[0],
      markPropertyVacant: true
    });
    this.showTerminateModal.set(true);
  }

  submitTerminate() {
    if (this.terminateForm.invalid) return;
    if (!confirm('⚠️ Êtes-vous sûr de vouloir résilier ce contrat ?')) return;

    const contract = this.selectedContract();
    if (!contract) return;

    const formValue = this.terminateForm.value;
    const request: TerminateContractRequest = {
      terminationDate: formValue.terminationDate!,
      markPropertyVacant: formValue.markPropertyVacant!
    };

    this.contractsApi.terminateContract(contract.id, request).subscribe({
      next: () => {
        this.showTerminateModal.set(false);
        this.loadContracts();
        this.loadStats();
        alert('✅ Contrat résilié avec succès');
      },
      error: (err) => {
        console.error('❌ Error terminating contract:', err);
        alert('❌ Erreur lors de la résiliation du contrat');
      }
    });
  }

  closeModals() {
    this.showCreateModal.set(false);
    this.showPaymentModal.set(false);
    this.showTerminateModal.set(false);
    this.showViewModal.set(false);
    this.selectedContract.set(null);
  }
}
