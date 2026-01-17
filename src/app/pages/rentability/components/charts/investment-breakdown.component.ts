import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxChartsModule, Color, ScaleType, LegendPosition } from '@swimlane/ngx-charts';
import { GlobalKPIs, RentabilityInput } from '../../../../core/models/rentability.models';

@Component({
  selector: 'app-investment-breakdown',
  standalone: true,
  imports: [CommonModule, NgxChartsModule],
  template: `
    <div class="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
      <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">
        Répartition de l'investissement
      </h3>
      <ngx-charts-pie-chart
        [view]="[350, 250]"
        [scheme]="colorScheme"
        [results]="chartData"
        [legend]="true"
        [legendPosition]="legendPosition"
        [labels]="true"
        [doughnut]="true"
        [arcWidth]="0.4">
      </ngx-charts-pie-chart>
    </div>
  `
})
export class InvestmentBreakdownComponent implements OnChanges {
  @Input() input?: Partial<RentabilityInput>;
  @Input() kpis?: GlobalKPIs;

  chartData: any[] = [];
  legendPosition = LegendPosition.Below;

  colorScheme: Color = {
    name: 'custom',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899']
  };

  ngOnChanges() {
    this.updateChartData();
  }

  private updateChartData() {
    if (!this.input?.context || !this.kpis) return;

    const ctx = this.input.context;
    const financing = this.input.financing;

    this.chartData = [
      { name: 'Apport personnel', value: this.kpis.ownFunds },
      { name: 'Emprunt', value: financing?.loanAmount || 0 },
      { name: 'Frais de notaire', value: ctx.notaryFees || 0 },
      { name: 'Travaux', value: ctx.renovationCost || 0 },
      { name: 'Mobilier', value: ctx.furnitureCost || 0 }
    ].filter(d => d.value > 0);
  }
}
