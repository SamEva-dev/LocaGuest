import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxChartsModule, Color, ScaleType, LegendPosition } from '@swimlane/ngx-charts';
import { YearlyResults } from '../../../../core/models/rentability.models';

@Component({
  selector: 'app-yearly-breakdown',
  standalone: true,
  imports: [CommonModule, NgxChartsModule],
  template: `
    <div class="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
      <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">
        Décomposition annuelle
      </h3>
      <ngx-charts-bar-vertical-stacked
        [view]="[700, 300]"
        [scheme]="colorScheme"
        [results]="chartData"
        [xAxis]="true"
        [yAxis]="true"
        [legend]="true"
        [legendPosition]="legendPosition"
        [showXAxisLabel]="true"
        [showYAxisLabel]="true"
        xAxisLabel="Année"
        yAxisLabel="€"
        [barPadding]="8">
      </ngx-charts-bar-vertical-stacked>
    </div>
  `
})
export class YearlyBreakdownComponent implements OnChanges {
  @Input() yearlyResults: YearlyResults[] = [];

  chartData: any[] = [];
  legendPosition = LegendPosition.Below;

  colorScheme: Color = {
    name: 'custom',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: ['#10b981', '#ef4444', '#3b82f6', '#f59e0b']
  };

  ngOnChanges() {
    this.updateChartData();
  }

  private updateChartData() {
    if (!this.yearlyResults?.length) return;

    // Limiter à 10 ans max pour la lisibilité
    const years = this.yearlyResults.slice(0, 10);

    this.chartData = [
      {
        name: 'Revenus nets',
        series: years.map(y => ({
          name: `An ${y.year}`,
          value: Math.round(y.netRevenue)
        }))
      },
      {
        name: 'Charges',
        series: years.map(y => ({
          name: `An ${y.year}`,
          value: -Math.round(y.totalCharges)
        }))
      },
      {
        name: 'Crédit',
        series: years.map(y => ({
          name: `An ${y.year}`,
          value: -Math.round(y.loanPayment)
        }))
      },
      {
        name: 'Impôts',
        series: years.map(y => ({
          name: `An ${y.year}`,
          value: -Math.round(y.tax)
        }))
      }
    ];
  }
}
