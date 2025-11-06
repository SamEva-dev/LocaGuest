import { Component, input, signal, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { InternalTabManagerService } from '../../../../core/services/internal-tab-manager.service';
import { RevenueChart } from '../../../../components/charts/revenue-chart/revenue-chart';

@Component({
  selector: 'property-detail-tab',
  standalone: true,
  imports: [TranslatePipe, RevenueChart],
  template: `
    <div class="p-6 space-y-6">
      <!-- Header Two Columns -->
      <div class="grid lg:grid-cols-2 gap-6">
        <!-- Left: Image Carousel -->
        <div class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5">
          <div class="aspect-video bg-gradient-to-br from-emerald-400 to-teal-500 rounded-lg mb-3 flex items-center justify-center">
            <i class="ph ph-image text-6xl text-white/50"></i>
          </div>
          <div class="flex gap-2 overflow-x-auto">
            @for (i of [1,2,3,4]; track i) {
              <div class="w-20 h-20 bg-slate-200 dark:bg-slate-700 rounded flex-shrink-0"></div>
            }
          </div>
        </div>

        <!-- Right: Stacked Cards -->
        <div class="space-y-4">
          <!-- Financial Analysis -->
          <div class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5">
            <h3 class="text-lg font-semibold mb-4">{{ 'PROPERTY.FINANCIAL_ANALYSIS' | translate }}</h3>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <p class="text-xs text-slate-500 dark:text-slate-400">{{ 'PROPERTY.ANALYTICS.ROI' | translate }}</p>
                <p class="text-2xl font-bold text-emerald-600">7.2%</p>
              </div>
              <div>
                <p class="text-xs text-slate-500 dark:text-slate-400">{{ 'PROPERTY.ANALYTICS.PROFITABILITY' | translate }}</p>
                <p class="text-2xl font-bold">5.8%</p>
              </div>
              <div>
                <p class="text-xs text-slate-500 dark:text-slate-400">{{ 'PROPERTY.ANALYTICS.REVENUE' | translate }}</p>
                <p class="text-lg font-semibold">€ 22,200</p>
              </div>
              <div>
                <p class="text-xs text-slate-500 dark:text-slate-400">{{ 'PROPERTY.ANALYTICS.CHARGES' | translate }}</p>
                <p class="text-lg font-semibold">€ 3,400</p>
              </div>
            </div>
          </div>

          <!-- Recent Payments -->
          <div class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5">
            <h3 class="text-lg font-semibold mb-4">{{ 'PROPERTY.RECENT_PAYMENTS' | translate }}</h3>
            <div class="space-y-2">
              @for (payment of mockPayments; track payment.id) {
                <div class="flex items-center justify-between text-sm">
                  <div>
                    <p class="font-medium">{{ payment.date }}</p>
                    <p class="text-xs text-slate-500">{{ payment.tenant }}</p>
                  </div>
                  <div class="text-right">
                    <p class="font-semibold">{{ payment.amount }}</p>
                    <span class="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30">
                      {{ 'PAYMENT.STATUS.PAID' | translate }}
                    </span>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      </div>

      <!-- Sub-tabs -->
      <div class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
        <div class="flex overflow-x-auto border-b border-slate-200 dark:border-slate-700 px-4">
          @for (tab of subTabs; track tab.id) {
            <button
              (click)="activeSubTab.set(tab.id)"
              [class.border-b-2]="activeSubTab() === tab.id"
              [class.border-emerald-500]="activeSubTab() === tab.id"
              [class.text-emerald-600]="activeSubTab() === tab.id"
              class="px-4 py-3 text-sm font-medium whitespace-nowrap transition hover:text-emerald-600"
            >
              <i [class]="'ph ' + tab.icon + ' mr-2'"></i>{{ tab.label | translate }}
            </button>
          }
        </div>

        <div class="p-6">
          @switch (activeSubTab()) {
            @case ('overview') {
              <div class="space-y-4">
                <h3 class="text-lg font-semibold">{{ 'PROPERTY.OVERVIEW' | translate }}</h3>
                <div class="grid md:grid-cols-2 gap-4">
                  <div><span class="font-medium">Type:</span> Appartement</div>
                  <div><span class="font-medium">Surface:</span> 75 m²</div>
                  <div><span class="font-medium">Pièces:</span> 3</div>
                  <div><span class="font-medium">Étage:</span> 2</div>
                </div>
                <revenue-chart />
              </div>
            }
            @case ('tenants') {
              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <h3 class="text-lg font-semibold">{{ 'PROPERTY.TENANTS' | translate }}</h3>
                  <button 
                    (click)="addTenant()"
                    class="px-3 py-1.5 rounded-lg bg-orange-500 text-white text-sm hover:bg-orange-600 transition"
                  >
                    <i class="ph ph-plus mr-1"></i>{{ 'PROPERTY.ADD_TENANT' | translate }}
                  </button>
                </div>
                @for (tenant of mockTenants; track tenant.id) {
                  <div 
                    (click)="openTenantTab(tenant)"
                    class="border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:shadow-md transition cursor-pointer"
                  >
                    <div class="flex items-center gap-3">
                      <div class="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center text-white font-bold text-sm">
                        {{ getInitials(tenant.name) }}
                      </div>
                      <div>
                        <p class="font-medium">{{ tenant.name }}</p>
                        <p class="text-xs text-slate-500">{{ tenant.email }}</p>
                      </div>
                      <span class="ml-auto text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30">
                        {{ 'TENANT.ACTIVE' | translate }}
                      </span>
                    </div>
                  </div>
                }
              </div>
            }
            @case ('contracts') {
              <div>
                <h3 class="text-lg font-semibold mb-4">{{ 'PROPERTY.CONTRACTS' | translate }}</h3>
                <p class="text-slate-500">{{ 'PROPERTY.CONTRACTS_PLACEHOLDER' | translate }}</p>
              </div>
            }
            @case ('documents') {
              <div>
                <h3 class="text-lg font-semibold mb-4">{{ 'PROPERTY.DOCUMENTS' | translate }}</h3>
                <div class="grid sm:grid-cols-2 gap-3">
                  @for (i of [1,2,3]; track i) {
                    <div class="border border-slate-200 dark:border-slate-700 rounded-lg p-3 flex items-center gap-3">
                      <i class="ph ph-file-pdf text-2xl text-rose-500"></i>
                      <div>
                        <p class="text-sm font-medium">Document {{ i }}.pdf</p>
                        <p class="text-xs text-slate-500">2.4 MB</p>
                      </div>
                    </div>
                  }
                </div>
              </div>
            }
            @case ('maintenance') {
              <div>
                <h3 class="text-lg font-semibold mb-4">{{ 'PROPERTY.MAINTENANCE' | translate }}</h3>
                <p class="text-slate-500">{{ 'PROPERTY.MAINTENANCE_PLACEHOLDER' | translate }}</p>
              </div>
            }
            @case ('payments') {
              <div>
                <h3 class="text-lg font-semibold mb-4">{{ 'PROPERTY.PAYMENTS' | translate }}</h3>
                <p class="text-slate-500">{{ 'PROPERTY.PAYMENTS_PLACEHOLDER' | translate }}</p>
              </div>
            }
            @case ('invoices') {
              <div>
                <h3 class="text-lg font-semibold mb-4">{{ 'PROPERTY.INVOICES' | translate }}</h3>
                <p class="text-slate-500">{{ 'PROPERTY.INVOICES_PLACEHOLDER' | translate }}</p>
              </div>
            }
            @case ('projection') {
              <div>
                <h3 class="text-lg font-semibold mb-4">{{ 'PROPERTY.PROJECTION' | translate }}</h3>
                <revenue-chart />
              </div>
            }
          }
        </div>
      </div>
    </div>
  `
})
export class PropertyDetailTab {
  data = input<any>();
  private tabManager = inject(InternalTabManagerService);

  activeSubTab = signal('overview');

  subTabs = [
    { id: 'overview', label: 'PROPERTY.SUB_TABS.OVERVIEW', icon: 'ph-house' },
    { id: 'tenants', label: 'PROPERTY.SUB_TABS.TENANTS', icon: 'ph-users-three' },
    { id: 'contracts', label: 'PROPERTY.SUB_TABS.CONTRACTS', icon: 'ph-file-text' },
    { id: 'documents', label: 'PROPERTY.SUB_TABS.DOCUMENTS', icon: 'ph-folder' },
    { id: 'maintenance', label: 'PROPERTY.SUB_TABS.MAINTENANCE', icon: 'ph-wrench' },
    { id: 'payments', label: 'PROPERTY.SUB_TABS.PAYMENTS', icon: 'ph-currency-eur' },
    { id: 'invoices', label: 'PROPERTY.SUB_TABS.INVOICES', icon: 'ph-receipt' },
    { id: 'projection', label: 'PROPERTY.SUB_TABS.PROJECTION', icon: 'ph-chart-line-up' },
  ];

  mockPayments = [
    { id: '1', date: 'Nov 2024', tenant: 'Marie Dupont', amount: '€ 1,850', status: 'Payé' },
    { id: '2', date: 'Oct 2024', tenant: 'Marie Dupont', amount: '€ 1,850', status: 'Payé' },
  ];

  mockTenants = [
    { id: '1', name: 'Marie Dupont', email: 'marie@example.com' },
  ];

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  addTenant() {
    // Open tenant creation modal or new tab
    alert('Ajouter un locataire - À implémenter');
  }

  openTenantTab(tenant: any) {
    this.tabManager.openTenant(tenant.id, tenant.name);
  }
}
