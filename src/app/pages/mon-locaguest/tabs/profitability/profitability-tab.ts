import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'profitability-tab',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  template: `
    <div class="p-6 space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold">{{ 'PROFITABILITY.TITLE' | translate }}</h1>
          <p class="text-slate-500 text-sm">{{ 'PROFITABILITY.SUBTITLE' | translate }}</p>
        </div>
      </div>

      <!-- Placeholder Content -->
      <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
        <i class="ph ph-chart-line-up text-6xl text-slate-300 mb-4"></i>
        <h2 class="text-xl font-semibold mb-2">Rentabilité - En Construction</h2>
        <p class="text-slate-500">Ce module sera bientôt disponible</p>
        <p class="text-sm text-slate-400 mt-2">Graphiques, statistiques et analyses de performance</p>
      </div>
    </div>
  `
})
export class ProfitabilityTab {
}
