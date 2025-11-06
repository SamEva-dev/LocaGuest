import { Component, inject, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { InternalTabManagerService } from '../../../../core/services/internal-tab-manager.service';
import { OccupancyChart } from '../../../../components/charts/occupancy-chart/occupancy-chart';

@Component({
  selector: 'summary-tab',
  standalone: true,
  imports: [TranslatePipe, OccupancyChart],
  template: `
    <div class="p-6 space-y-6">
      <!-- Header with Add Property button -->
      <div class="flex items-center justify-between">
        <h2 class="text-2xl font-bold">{{ 'SUMMARY.TITLE' | translate }}</h2>
        <button class="px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-emerald-500 text-white hover:shadow-lg transition">
          <i class="ph ph-plus mr-2"></i>{{ 'SUMMARY.ADD_PROPERTY' | translate }}
        </button>
      </div>

      <!-- Stats Row -->
      <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        @for (stat of stats; track stat.key) {
          <div class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm hover:shadow-md transition">
            <div class="flex items-center justify-between mb-3">
              <span class="text-sm text-slate-500 dark:text-slate-400">{{ stat.label | translate }}</span>
              <div 
                class="w-10 h-10 rounded-lg flex items-center justify-center"
                [style.background]="stat.bgColor"
              >
                <i [class]="'ph ' + stat.icon + ' text-lg text-white'"></i>
              </div>
            </div>
            <p class="text-3xl font-bold text-slate-800 dark:text-white">{{ stat.value }}</p>
            @if (stat.delta) {
              <p class="text-xs mt-2" [class]="stat.deltaPositive ? 'text-emerald-600' : 'text-rose-600'">
                <i [class]="stat.deltaPositive ? 'ph ph-trend-up' : 'ph ph-trend-down'"></i>
                {{ stat.delta }}% {{ 'SUMMARY.VS_LAST_MONTH' | translate }}
              </p>
            }
          </div>
        }
      </div>

      <!-- Two Column Layout -->
      <div class="grid lg:grid-cols-3 gap-6">
        <!-- Left: Properties/Tenants view -->
        <div class="lg:col-span-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
          <!-- View Switcher & Filters -->
          <div class="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div class="flex items-center gap-2">
              <!-- Toggle Properties/Tenants -->
              <div class="flex bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
                <button
                  (click)="viewMode.set('properties')"
                  [class.bg-white]="viewMode() === 'properties'"
                  [class.dark:bg-slate-600]="viewMode() === 'properties'"
                  [class.shadow-sm]="viewMode() === 'properties'"
                  class="px-3 py-1.5 rounded text-sm font-medium transition"
                >
                  <i class="ph ph-house-line mr-1"></i>{{ 'SUMMARY.PROPERTIES' | translate }}
                </button>
                <button
                  (click)="viewMode.set('tenants')"
                  [class.bg-white]="viewMode() === 'tenants'"
                  [class.dark:bg-slate-600]="viewMode() === 'tenants'"
                  [class.shadow-sm]="viewMode() === 'tenants'"
                  class="px-3 py-1.5 rounded text-sm font-medium transition"
                >
                  <i class="ph ph-users-three mr-1"></i>{{ 'SUMMARY.TENANTS' | translate }}
                </button>
              </div>

              <!-- Card/Table toggle -->
              <div class="flex bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
                <button
                  (click)="displayMode.set('card')"
                  [class.bg-white]="displayMode() === 'card'"
                  [class.dark:bg-slate-600]="displayMode() === 'card'"
                  [class.shadow-sm]="displayMode() === 'card'"
                  class="p-1.5 rounded transition"
                >
                  <i class="ph ph-squares-four text-lg"></i>
                </button>
                <button
                  (click)="displayMode.set('table')"
                  [class.bg-white]="displayMode() === 'table'"
                  [class.dark:bg-slate-600]="displayMode() === 'table'"
                  [class.shadow-sm]="displayMode() === 'table'"
                  class="p-1.5 rounded transition"
                >
                  <i class="ph ph-list text-lg"></i>
                </button>
              </div>
            </div>

            <!-- Filters -->
            <div class="flex items-center gap-2">
              <select class="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 text-sm">
                <option>{{ 'SUMMARY.FILTERS.STATUS_ALL' | translate }}</option>
                <option>{{ 'PROPERTY.STATUS_OCCUPIED' | translate }}</option>
                <option>{{ 'PROPERTY.STATUS_VACANT' | translate }}</option>
              </select>
              <button class="p-1.5 rounded-lg border border-slate-300 dark:border-slate-600" [title]="'SUMMARY.FILTERS.FILTERS' | translate">
                <i class="ph ph-funnel text-lg"></i>
              </button>
            </div>
          </div>

          <!-- Content -->
          @if (viewMode() === 'properties') {
            @if (displayMode() === 'card') {
              <div class="grid md:grid-cols-2 gap-4">
                @for (property of mockProperties; track property.id) {
                  <div 
                    (click)="openProperty(property)"
                    class="border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:shadow-md transition cursor-pointer"
                  >
                    <div class="flex items-start gap-3">
                      <div class="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-lg flex-shrink-0"></div>
                      <div class="flex-1 min-w-0">
                        <h4 class="font-semibold text-sm truncate">{{ property.name }}</h4>
                        <p class="text-xs text-slate-500 dark:text-slate-400 truncate">{{ property.address }}</p>
                        <div class="flex items-center gap-2 mt-2">
                          <span class="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                            {{ property.status }}
                          </span>
                          <span class="text-sm font-medium">{{ property.rent }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                }
              </div>
            } @else {
              <div class="overflow-x-auto">
                <table class="w-full">
                  <thead class="border-b border-slate-200 dark:border-slate-700">
                    <tr class="text-left text-xs text-slate-500 dark:text-slate-400">
                      <th class="pb-2 font-medium">{{ 'SUMMARY.TABLE.PROPERTY' | translate }}</th>
                      <th class="pb-2 font-medium">{{ 'SUMMARY.TABLE.ADDRESS' | translate }}</th>
                      <th class="pb-2 font-medium">{{ 'SUMMARY.TABLE.RENT' | translate }}</th>
                      <th class="pb-2 font-medium">{{ 'SUMMARY.TABLE.STATUS' | translate }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (property of mockProperties; track property.id) {
                      <tr 
                        (click)="openProperty(property)"
                        class="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer"
                      >
                        <td class="py-3 text-sm font-medium">{{ property.name }}</td>
                        <td class="py-3 text-sm text-slate-600 dark:text-slate-400">{{ property.address }}</td>
                        <td class="py-3 text-sm font-medium">{{ property.rent }}</td>
                        <td class="py-3">
                          <span class="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                            {{ property.status }}
                          </span>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          } @else {
            <!-- Tenants view -->
            @if (displayMode() === 'card') {
              <div class="grid md:grid-cols-2 gap-4">
                @for (tenant of mockTenants; track tenant.id) {
                  <div 
                    (click)="openTenant(tenant)"
                    class="border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:shadow-md transition cursor-pointer"
                  >
                    <div class="flex items-center gap-3">
                      <div class="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center text-white font-bold">
                        {{ getInitials(tenant.name) }}
                      </div>
                      <div class="flex-1">
                        <h4 class="font-semibold text-sm">{{ tenant.name }}</h4>
                        <p class="text-xs text-slate-500 dark:text-slate-400">{{ tenant.property }}</p>
                        <p class="text-sm font-medium mt-1">{{ tenant.rent }}</p>
                      </div>
                    </div>
                  </div>
                }
              </div>
            } @else {
              <div class="overflow-x-auto">
                <table class="w-full">
                  <thead class="border-b border-slate-200 dark:border-slate-700">
                    <tr class="text-left text-xs text-slate-500 dark:text-slate-400">
                      <th class="pb-2 font-medium">{{ 'SUMMARY.TABLE.TENANT' | translate }}</th>
                      <th class="pb-2 font-medium">{{ 'SUMMARY.TABLE.PROPERTY' | translate }}</th>
                      <th class="pb-2 font-medium">{{ 'SUMMARY.TABLE.RENT' | translate }}</th>
                      <th class="pb-2 font-medium">{{ 'SUMMARY.TABLE.STATUS' | translate }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (tenant of mockTenants; track tenant.id) {
                      <tr 
                        (click)="openTenant(tenant)"
                        class="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer"
                      >
                        <td class="py-3 text-sm font-medium">{{ tenant.name }}</td>
                        <td class="py-3 text-sm text-slate-600 dark:text-slate-400">{{ tenant.property }}</td>
                        <td class="py-3 text-sm font-medium">{{ tenant.rent }}</td>
                        <td class="py-3">
                          <span class="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                            {{ 'TENANT.ACTIVE' | translate }}
                          </span>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          }
        </div>

        <!-- Right Column -->
        <div class="space-y-6">
          <!-- Notifications -->
          <div class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5">
            <h3 class="text-lg font-semibold mb-4">{{ 'SUMMARY.NOTIFICATIONS' | translate }}</h3>
            <div class="space-y-3">
              @for (notif of mockNotifications; track notif.id) {
                <div class="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                  <div class="w-2 h-2 rounded-full mt-1.5" [class]="notif.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'"></div>
                  <div class="flex-1 text-sm">
                    <p class="font-medium">{{ notif.title }}</p>
                    <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">{{ notif.when }}</p>
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- Upcoming Deadlines -->
          <div class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5">
            <h3 class="text-lg font-semibold mb-4">{{ 'SUMMARY.DEADLINES' | translate }}</h3>
            <div class="space-y-2">
              @for (deadline of mockDeadlines; track deadline.id) {
                <div class="flex items-center justify-between text-sm">
                  <span>{{ deadline.title }}</span>
                  <span class="text-xs text-slate-500">{{ deadline.date }}</span>
                </div>
              }
            </div>
          </div>

          <!-- Annual Projections Chart -->
          <div class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5">
            <h3 class="text-lg font-semibold mb-4">{{ 'SUMMARY.PROJECTIONS' | translate }}</h3>
            <occupancy-chart />
          </div>
        </div>
      </div>
    </div>
  `
})
export class SummaryTab {
  private tabManager = inject(InternalTabManagerService);

  viewMode = signal<'properties' | 'tenants'>('properties');
  displayMode = signal<'card' | 'table'>('card');

  stats = [
    { key: 'properties', label: 'SUMMARY.STATS.PROPERTIES', value: '12', icon: 'ph-house', bgColor: '#38B2AC', delta: 4.2, deltaPositive: true },
    { key: 'tenants', label: 'SUMMARY.STATS.ACTIVE_TENANTS', value: '10', icon: 'ph-users-three', bgColor: '#ED8936', delta: 1.5, deltaPositive: true },
    { key: 'occupancy', label: 'SUMMARY.STATS.OCCUPANCY', value: '83%', icon: 'ph-chart-line-up', bgColor: '#4299E1', delta: -2.1, deltaPositive: false },
    { key: 'revenue', label: 'SUMMARY.STATS.REVENUE', value: '€ 18,420', icon: 'ph-currency-eur', bgColor: '#48BB78', delta: 5.3, deltaPositive: true },
  ];

  mockProperties = [
    { id: '1', name: 'Appartement T3', address: '15 Rue de la Paix, Paris', rent: '€ 1,850', status: 'Occupé' },
    { id: '2', name: 'Studio Centre', address: '8 Avenue Victor Hugo, Lyon', rent: '€ 780', status: 'Occupé' },
    { id: '3', name: 'Maison T5', address: '22 Rue du Commerce, Bordeaux', rent: '€ 2,100', status: 'Vacant' },
    { id: '4', name: 'Appartement T2', address: '5 Place Bellecour, Lyon', rent: '€ 1,200', status: 'Occupé' },
  ];

  mockTenants = [
    { id: '1', name: 'Marie Dupont', property: 'Appartement T3', rent: '€ 1,850' },
    { id: '2', name: 'Jean Martin', property: 'Studio Centre', rent: '€ 780' },
    { id: '3', name: 'Sophie Bernard', property: 'Appartement T2', rent: '€ 1,200' },
  ];

  mockNotifications = [
    { id: '1', type: 'warning', title: 'Loyer impayé - Appartement T3', when: 'il y a 2h' },
    { id: '2', type: 'info', title: 'Nouveau contrat signé', when: 'hier' },
  ];

  mockDeadlines = [
    { id: '1', title: 'Bail à renouveler', date: '15 Dec' },
    { id: '2', title: 'Révision loyer', date: '20 Dec' },
  ];

  openProperty(property: any) {
    this.tabManager.openProperty(property.id, property.name);
  }

  openTenant(tenant: any) {
    this.tabManager.openTenant(tenant.id, tenant.name);
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }
}
