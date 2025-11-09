import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environnements/environment';

interface ContractStats {
  activeContracts: number;
  expiringIn3Months: number;
  monthlyRevenue: number;
  totalTenants: number;
}

interface Contract {
  id: string;
  propertyId: string;
  tenantId: string;
  propertyName?: string;
  tenantName?: string;
  type: string;
  startDate: Date;
  endDate: Date;
  rent: number;
  deposit?: number;
  status: string;
  paymentsCount: number;
  createdAt: Date;
}

@Component({
  selector: 'contracts-tab',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  template: `
    <div class="p-6 space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold">{{ 'CONTRACTS.TITLE' | translate }}</h1>
          <p class="text-slate-500 text-sm">{{ 'CONTRACTS.SUBTITLE' | translate }}</p>
        </div>
        <button class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
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
                    <button class="px-3 py-1.5 text-sm rounded-lg border border-slate-300 hover:bg-slate-50 transition">
                      {{ 'COMMON.VIEW' | translate }}
                    </button>
                    <button class="px-3 py-1.5 text-sm rounded-lg border border-slate-300 hover:bg-slate-50 transition">
                      {{ 'COMMON.EDIT' | translate }}
                    </button>
                    <button class="px-3 py-1.5 text-sm rounded-lg border border-slate-300 hover:bg-slate-50 transition">
                      {{ 'CONTRACTS.DOCUMENTS' | translate }}
                    </button>
                  </div>
                </div>
              </div>
            }
          }
        </div>
      </div>
    </div>
  `
})
export class ContractsTab implements OnInit {
  private http = inject(HttpClient);
  
  stats = signal<ContractStats | null>(null);
  contracts = signal<Contract[]>([]);
  isLoading = signal(false);
  
  searchTerm = '';
  statusFilter = '';
  typeFilter = '';

  ngOnInit() {
    this.loadStats();
    this.loadContracts();
  }

  loadStats() {
    this.http.get<ContractStats>(`${environment.BASE_LOCAGUEST_API}/api/contracts/stats`).subscribe({
      next: (data) => this.stats.set(data),
      error: (err) => console.error('Error loading contract stats:', err)
    });
  }

  loadContracts() {
    this.isLoading.set(true);
    const params = new URLSearchParams();
    if (this.searchTerm) params.append('searchTerm', this.searchTerm);
    if (this.statusFilter) params.append('status', this.statusFilter);
    if (this.typeFilter) params.append('type', this.typeFilter);

    const url = `${environment.BASE_LOCAGUEST_API}/api/contracts/all${params.toString() ? '?' + params.toString() : ''}`;
    
    this.http.get<Contract[]>(url).subscribe({
      next: (data) => {
        this.contracts.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading contracts:', err);
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
}
