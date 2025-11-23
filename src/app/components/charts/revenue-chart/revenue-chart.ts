import { Component, ViewChild, OnInit, inject } from '@angular/core';
import { NgApexchartsModule, ChartComponent } from 'ng-apexcharts';
import { AnalyticsApi } from '../../../core/api/analytics.api';

@Component({
  selector: 'revenue-chart',
  standalone: true,
  imports: [NgApexchartsModule],
  template: `
    <apx-chart
      [series]="chartOptions.series"
      [chart]="chartOptions.chart"
      [plotOptions]="chartOptions.plotOptions"
      [xaxis]="chartOptions.xaxis"
      [yaxis]="chartOptions.yaxis"
      [colors]="chartOptions.colors"
      [dataLabels]="chartOptions.dataLabels"
      [grid]="chartOptions.grid"
      [tooltip]="chartOptions.tooltip"
      [legend]="chartOptions.legend"
    ></apx-chart>
  `
})
export class RevenueChart implements OnInit {
  private analyticsApi = inject(AnalyticsApi);
  @ViewChild('chart') chart?: ChartComponent;

  chartOptions: any = {
    series: [
      {
        name: 'Revenus',
        data: []
      }
    ],
    chart: {
      height: 250,
      type: 'bar',
      toolbar: { show: false }
    },
    plotOptions: {
      bar: {
        borderRadius: 8,
        dataLabels: { position: 'top' }
      }
    },
    dataLabels: { enabled: false },
    colors: ['#10b981'],
    xaxis: {
      categories: [],
      labels: {
        style: { fontSize: '12px' }
      }
    },
    yaxis: {
      labels: {
        formatter: (val: number) => '€' + (val / 1000).toFixed(1) + 'k'
      }
    },
    grid: {
      borderColor: '#f1f1f1',
      strokeDashArray: 4
    },
    tooltip: {
      y: {
        formatter: (val: number) => '€' + val.toLocaleString()
      }
    },
    legend: { show: false }
  };

  ngOnInit() {
    this.loadRevenueData();
  }

  loadRevenueData() {
    this.analyticsApi.getRevenueEvolution(12).subscribe({
      next: (data) => {
        const revenues = data.map(d => d.revenue);
        const months = data.map(d => d.month);
        
        this.chartOptions.series = [{
          name: 'Revenus',
          data: revenues
        }];
        this.chartOptions.xaxis.categories = months;
        
        // Update chart if needed
        if (this.chart) {
          this.chart.updateOptions(this.chartOptions);
        }
      },
      error: (err) => console.error('Error loading revenue data:', err)
    });
  }
}
