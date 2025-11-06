import { Component, input, signal, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { InternalTabManagerService } from '../../../../core/services/internal-tab-manager.service';
import { OccupancyChart } from '../../../../components/charts/occupancy-chart/occupancy-chart';

@Component({
  selector: 'tenant-detail-tab',
  standalone: true,
  imports: [TranslatePipe, OccupancyChart],
  template: `
    <div class="p-6 space-y-6">
      <!-- Header Two Columns -->
      <div class="grid lg:grid-cols-2 gap-6">
        <!-- Left: Tenant Info Card -->
        <div class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
          <div class="flex items-center gap-4 mb-6">
            <div class="w-20 h-20 rounded-full bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center text-white text-3xl font-bold">
              MD
            </div>
            <div>
              <h3 class="text-xl font-bold">Marie Dupont</h3>
              <p class="text-sm text-slate-500 dark:text-slate-400">marie.dupont@example.com</p>
              <p class="text-sm text-slate-500 dark:text-slate-400">+33 6 12 34 56 78</p>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <p class="text-xs text-slate-500 dark:text-slate-400">Type de bail</p>
              <p class="font-medium">Longue durée</p>
            </div>
            <div>
              <p class="text-xs text-slate-500 dark:text-slate-400">Date d'entrée</p>
              <p class="font-medium">15 Jan 2023</p>
            </div>
            <div>
              <p class="text-xs text-slate-500 dark:text-slate-400">Occupation</p>
              <p class="font-medium">Ingénieur</p>
            </div>
            <div>
              <p class="text-xs text-slate-500 dark:text-slate-400">Statut</p>
              <span class="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30">
                Actif
              </span>
            </div>
          </div>
        </div>

        <!-- Right: Stats Card -->
        <div class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
          <h3 class="text-lg font-semibold mb-4">{{ 'TENANT.PAYMENT_STATS' | translate }}</h3>
          <div class="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p class="text-xs text-slate-500 dark:text-slate-400">Loyer mensuel</p>
              <p class="text-2xl font-bold">€ 1,850</p>
            </div>
            <div>
              <p class="text-xs text-slate-500 dark:text-slate-400">Total payé</p>
              <p class="text-2xl font-bold text-emerald-600">€ 40,700</p>
            </div>
            <div>
              <p class="text-xs text-slate-500 dark:text-slate-400">Restant</p>
              <p class="text-lg font-semibold">€ 0</p>
            </div>
            <div>
              <p class="text-xs text-slate-500 dark:text-slate-400">Régularité</p>
              <p class="text-lg font-semibold text-emerald-600">100%</p>
            </div>
          </div>
          <occupancy-chart />
        </div>
      </div>

      <!-- Sub-tabs -->
      <div class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
        <div class="flex overflow-x-auto border-b border-slate-200 dark:border-slate-700 px-4">
          @for (tab of subTabs; track tab.id) {
            <button
              (click)="activeSubTab.set(tab.id)"
              [class.border-b-2]="activeSubTab() === tab.id"
              [class.border-orange-500]="activeSubTab() === tab.id"
              [class.text-orange-600]="activeSubTab() === tab.id"
              class="px-4 py-3 text-sm font-medium whitespace-nowrap transition hover:text-orange-600"
            >
              <i [class]="'ph ' + tab.icon + ' mr-2'"></i>{{ tab.label | translate }}
            </button>
          }
        </div>

        <div class="p-6">
          @switch (activeSubTab()) {
            @case ('property') {
              <div class="space-y-4">
                <h3 class="text-lg font-semibold">{{ 'TENANT.LINKED_PROPERTY' | translate }}</h3>
                <div 
                  (click)="openPropertyTab()"
                  class="border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:shadow-md transition cursor-pointer"
                >
                  <div class="flex items-center gap-4">
                    <div class="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-lg"></div>
                    <div>
                      <h4 class="font-semibold">Appartement T3</h4>
                      <p class="text-sm text-slate-500">15 Rue de la Paix, Paris</p>
                      <button class="mt-2 text-sm text-emerald-600 hover:underline">
                        <i class="ph ph-arrow-right mr-1"></i>Voir le bien
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            }
            @case ('payment-history') {
              <div>
                <h3 class="text-lg font-semibold mb-4">{{ 'TENANT.PAYMENT_HISTORY' | translate }}</h3>
                <div class="space-y-2">
                  @for (payment of mockPayments; track payment.id) {
                    <div class="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-700 rounded-lg">
                      <div>
                        <p class="font-medium">{{ payment.month }}</p>
                        <p class="text-xs text-slate-500">{{ payment.method }}</p>
                      </div>
                      <div class="text-right">
                        <p class="font-semibold">{{ payment.amount }}</p>
                        <span class="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30">
                          {{ payment.status }}
                        </span>
                      </div>
                    </div>
                  }
                </div>
              </div>
            }
            @case ('contracts') {
              <div>
                <h3 class="text-lg font-semibold mb-4">{{ 'TENANT.CONTRACTS_DOCS' | translate }}</h3>
                <div class="grid sm:grid-cols-2 gap-3">
                  @for (doc of mockDocuments; track doc.id) {
                    <div class="border border-slate-200 dark:border-slate-700 rounded-lg p-3 flex items-center gap-3">
                      <i class="ph ph-file-pdf text-2xl text-rose-500"></i>
                      <div>
                        <p class="text-sm font-medium">{{ doc.name }}</p>
                        <p class="text-xs text-slate-500">{{ doc.size }}</p>
                      </div>
                    </div>
                  }
                </div>
              </div>
            }
            @case ('history') {
              <div>
                <h3 class="text-lg font-semibold mb-4">{{ 'TENANT.HISTORY_EVENTS' | translate }}</h3>
                <div class="space-y-3">
                  @for (event of mockEvents; track event.id) {
                    <div class="flex gap-3">
                      <div class="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                      <div>
                        <p class="font-medium">{{ event.title }}</p>
                        <p class="text-xs text-slate-500">{{ event.date }}</p>
                      </div>
                    </div>
                  }
                </div>
              </div>
            }
            @case ('reminders') {
              <div>
                <h3 class="text-lg font-semibold mb-4">{{ 'TENANT.REMINDERS_SENT' | translate }}</h3>
                <p class="text-slate-500">Aucun rappel envoyé</p>
              </div>
            }
          }
        </div>
      </div>
    </div>
  `
})
export class TenantDetailTab {
  data = input<any>();
  private tabManager = inject(InternalTabManagerService);

  activeSubTab = signal('property');

  subTabs = [
    { id: 'property', label: 'TENANT.SUB_TABS.PROPERTY', icon: 'ph-house-line' },
    { id: 'payment-history', label: 'TENANT.SUB_TABS.PAYMENT_HISTORY', icon: 'ph-currency-eur' },
    { id: 'contracts', label: 'TENANT.SUB_TABS.CONTRACTS', icon: 'ph-file-text' },
    { id: 'history', label: 'TENANT.SUB_TABS.HISTORY', icon: 'ph-clock-clockwise' },
    { id: 'reminders', label: 'TENANT.SUB_TABS.REMINDERS', icon: 'ph-bell' },
  ];

  mockPayments = [
    { id: '1', month: 'Nov 2024', amount: '€ 1,850', status: 'Payé', method: 'Virement' },
    { id: '2', month: 'Oct 2024', amount: '€ 1,850', status: 'Payé', method: 'Virement' },
    { id: '3', month: 'Sep 2024', amount: '€ 1,850', status: 'Payé', method: 'Virement' },
  ];

  mockDocuments = [
    { id: '1', name: 'Bail.pdf', size: '2.4 MB' },
    { id: '2', name: 'Pièce d\'identité.pdf', size: '850 KB' },
    { id: '3', name: 'Justificatif domicile.pdf', size: '1.2 MB' },
  ];

  mockEvents = [
    { id: '1', title: 'Signature du bail', date: '15 Jan 2023' },
    { id: '2', title: 'État des lieux d\'entrée', date: '15 Jan 2023' },
    { id: '3', title: 'Premier paiement', date: '01 Fév 2023' },
  ];

  openPropertyTab() {
    this.tabManager.openProperty('1', 'Appartement T3');
  }
}
