import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxChartsModule, Color, ScaleType } from '@swimlane/ngx-charts';
import { YearlyResults } from '../../../../core/models/rentability.models';

@Component({
  selector: 'app-cashflow-chart',
  standalone: true,
  imports: [CommonModule, NgxChartsModule],
  template: `
    <div class="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
      <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">
        Évolution du cashflow
      </h3>
      <ngx-charts-line-chart
        [view]="[700, 300]"
        [scheme]="colorScheme"
        [results]="chartData"
        [xAxis]="true"
        [yAxis]="true"
        [legend]="true"
        [showXAxisLabel]="true"
        [showYAxisLabel]="true"
        xAxisLabel="Année"
        yAxisLabel="€"
        [autoScale]="true"
        [timeline]="false">
      </ngx-charts-line-chart>
    </div>
  `
})
export class CashflowChartComponent implements OnChanges {
  @Input() yearlyResults: YearlyResults[] = [];

  chartData: any[] = [];

  colorScheme: Color = {
    name: 'custom',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: ['#10b981', '#3b82f6', '#f59e0b']
  };

  ngOnChanges() {
    this.updateChartData();
  }

  private updateChartData() {
    if (!this.yearlyResults?.length) return;

    this.chartData = [
      {
        name: 'Cashflow après impôt',
        series: this.yearlyResults.map(y => ({
          name: `An ${y.year}`,
          value: Math.round(y.cashflowAfterTax)
        }))
      },
      {
        name: 'Revenus nets',
        series: this.yearlyResults.map(y => ({
          name: `An ${y.year}`,
          value: Math.round(y.netRevenue)
        }))
      },
      {
        name: 'Cashflow cumulé',
        series: this.yearlyResults.map(y => ({
          name: `An ${y.year}`,
          value: Math.round(y.cumulativeCashflow)
        }))
      }
    ];
  }
}
