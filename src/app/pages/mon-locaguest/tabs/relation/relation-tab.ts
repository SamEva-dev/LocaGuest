import { Component, input, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { RevenueChart } from '../../../../components/charts/revenue-chart/revenue-chart';
import { OccupancyChart } from '../../../../components/charts/occupancy-chart/occupancy-chart';

@Component({
  selector: 'relation-tab',
  standalone: true,
  imports: [TranslatePipe, RevenueChart, OccupancyChart],
  template: `
    <div class="p-6 space-y-6">
      <!-- Header Two Columns -->
      <div class="grid lg:grid-cols-2 gap-6">
        <!-- Left: Combined Card -->
        <div class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
          <div class="relative mb-4">
            <div class="w-full h-32 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-lg"></div>
            <div class="absolute -bottom-6 left-4 w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-rose-500 border-4 border-white dark:border-slate-800 flex items-center justify-center text-white text-2xl font-bold">
              MD
            </div>
          </div>
          <div class="mt-8 space-y-3">
            <div>
              <h3 class="text-xl font-bold">Marie Dupont</h3>
              <p class="text-sm text-slate-500 dark:text-slate-400">Appartement T3 - 15 Rue de la Paix, Paris</p>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <p class="text-xs text-slate-500 dark:text-slate-400">Date de début</p>
                <p class="font-medium">15 Jan 2023</p>
              </div>
              <div>
                <p class="text-xs text-slate-500 dark:text-slate-400">Type de bail</p>
                <p class="font-medium">Longue durée</p>
              </div>
              <div class="col-span-2">
                <p class="text-xs text-slate-500 dark:text-slate-400">Statut</p>
                <span class="inline-block mt-1 text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30">
                  Contrat actif
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Right: Financial Summary -->
        <div class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
          <h3 class="text-lg font-semibold mb-4">{{ 'RELATION.FINANCIAL_SUMMARY' | translate }}</h3>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <p class="text-xs text-slate-500 dark:text-slate-400">Loyer mensuel</p>
              <p class="text-2xl font-bold">€ 1,850</p>
            </div>
            <div>
              <p class="text-xs text-slate-500 dark:text-slate-400">Dépôt de garantie</p>
              <p class="text-2xl font-bold">€ 3,700</p>
            </div>
            <div>
              <p class="text-xs text-slate-500 dark:text-slate-400">Total payé</p>
              <p class="text-lg font-semibold text-emerald-600">€ 40,700</p>
            </div>
            <div>
              <p class="text-xs text-slate-500 dark:text-slate-400">Solde</p>
              <p class="text-lg font-semibold">€ 0</p>
            </div>
            <div class="col-span-2">
              <p class="text-xs text-slate-500 dark:text-slate-400 mb-2">Régularité des paiements</p>
              <div class="flex items-center gap-2">
                <div class="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div class="h-full bg-emerald-500 rounded-full" style="width: 100%"></div>
                </div>
                <span class="text-sm font-semibold text-emerald-600">100%</span>
              </div>
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
              [class.border-blue-500]="activeSubTab() === tab.id"
              [class.text-blue-600]="activeSubTab() === tab.id"
              class="px-4 py-3 text-sm font-medium whitespace-nowrap transition hover:text-blue-600"
            >
              <i [class]="'ph ' + tab.icon + ' mr-2'"></i>{{ tab.label | translate }}
            </button>
          }
        </div>

        <div class="p-6">
          @switch (activeSubTab()) {
            @case ('overview') {
              <div class="space-y-6">
                <div>
                  <h3 class="text-lg font-semibold mb-4">{{ 'RELATION.CONTRACT_SUMMARY' | translate }}</h3>
                  <div class="grid md:grid-cols-2 gap-4">
                    <div><span class="font-medium">Durée:</span> 3 ans</div>
                    <div><span class="font-medium">Début:</span> 15 Jan 2023</div>
                    <div><span class="font-medium">Fin prévue:</span> 14 Jan 2026</div>
                    <div><span class="font-medium">Renouvellement:</span> Tacite</div>
                  </div>
                </div>
                <div>
                  <h4 class="font-semibold mb-3">Progression des paiements</h4>
                  <div class="flex items-center gap-2 mb-2">
                    <div class="flex-1 h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div class="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full" style="width: 75%"></div>
                    </div>
                    <span class="text-sm font-semibold">22/36 mois</span>
                  </div>
                </div>
              </div>
            }
            @case ('payments') {
              <div class="space-y-4">
                <h3 class="text-lg font-semibold">{{ 'RELATION.PAYMENT_TRANSACTIONS' | translate }}</h3>
                <div class="space-y-2">
                  @for (i of [1,2,3,4,5]; track i) {
                    <div class="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-700 rounded-lg">
                      <div>
                        <p class="font-medium">Loyer {{ 12 - i }} 2024</p>
                        <p class="text-xs text-slate-500">Virement bancaire</p>
                      </div>
                      <div class="text-right">
                        <p class="font-semibold">€ 1,850</p>
                        <span class="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30">
                          Payé
                        </span>
                      </div>
                    </div>
                  }
                </div>
                <revenue-chart />
              </div>
            }
            @case ('documents') {
              <div>
                <h3 class="text-lg font-semibold mb-4">{{ 'RELATION.CONTRACT_FILES' | translate }}</h3>
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
            @case ('events') {
              <div>
                <h3 class="text-lg font-semibold mb-4">{{ 'RELATION.EVENTS_MAINTENANCE' | translate }}</h3>
                <div class="space-y-4">
                  @for (event of mockEvents; track event.id) {
                    <div class="flex gap-4">
                      <div class="flex flex-col items-center">
                        <div class="w-3 h-3 rounded-full" [class]="event.type === 'maintenance' ? 'bg-amber-500' : 'bg-blue-500'"></div>
                        <div class="w-0.5 h-full bg-slate-200 dark:bg-slate-700"></div>
                      </div>
                      <div class="flex-1 pb-4">
                        <p class="font-medium">{{ event.title }}</p>
                        <p class="text-xs text-slate-500">{{ event.date }}</p>
                        <p class="text-sm text-slate-600 dark:text-slate-400 mt-1">{{ event.description }}</p>
                      </div>
                    </div>
                  }
                </div>
              </div>
            }
            @case ('performance') {
              <div class="space-y-6">
                <div>
                  <h3 class="text-lg font-semibold mb-4">{{ 'RELATION.PROFITABILITY' | translate }}</h3>
                  <div class="grid md:grid-cols-3 gap-4">
                    <div class="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                      <p class="text-xs text-slate-500 dark:text-slate-400">ROI annuel</p>
                      <p class="text-2xl font-bold text-emerald-600">7.2%</p>
                    </div>
                    <div class="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                      <p class="text-xs text-slate-500 dark:text-slate-400">Rentabilité</p>
                      <p class="text-2xl font-bold">5.8%</p>
                    </div>
                    <div class="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                      <p class="text-xs text-slate-500 dark:text-slate-400">Marge nette</p>
                      <p class="text-2xl font-bold">€ 18,800</p>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 class="font-semibold mb-3">Prévisions annuelles</h4>
                  <occupancy-chart />
                </div>
              </div>
            }
          }
        </div>
      </div>
    </div>
  `
})
export class RelationTab {
  data = input<any>();

  activeSubTab = signal('overview');

  subTabs = [
    { id: 'overview', label: 'RELATION.SUB_TABS.OVERVIEW', icon: 'ph-info' },
    { id: 'payments', label: 'RELATION.SUB_TABS.PAYMENTS', icon: 'ph-currency-eur' },
    { id: 'documents', label: 'RELATION.SUB_TABS.DOCUMENTS', icon: 'ph-file-text' },
    { id: 'events', label: 'RELATION.SUB_TABS.EVENTS', icon: 'ph-clock-clockwise' },
    { id: 'performance', label: 'RELATION.SUB_TABS.PERFORMANCE', icon: 'ph-chart-line-up' },
  ];

  mockDocuments = [
    { id: '1', name: 'Bail signé.pdf', size: '2.4 MB' },
    { id: '2', name: 'État des lieux entrée.pdf', size: '1.8 MB' },
    { id: '3', name: 'Assurance habitation.pdf', size: '950 KB' },
  ];

  mockEvents = [
    { id: '1', type: 'contract', title: 'Signature du bail', date: '15 Jan 2023', description: 'Contrat signé pour 3 ans' },
    { id: '2', type: 'maintenance', title: 'Réparation plomberie', date: '12 Mar 2023', description: 'Intervention d\'urgence' },
    { id: '3', type: 'payment', title: 'Révision loyer annuelle', date: '01 Jan 2024', description: 'Augmentation de 2.5%' },
  ];
}
