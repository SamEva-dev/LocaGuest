import { Component, ViewChild } from '@angular/core';
import { NgApexchartsModule, ChartComponent } from 'ng-apexcharts';

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
export class RevenueChart {
  @ViewChild('chart') chart?: ChartComponent;

  chartOptions: any = {
    series: [
      {
        name: 'Revenus',
        data: [12400, 13200, 12800, 14100, 13900, 14500, 15200, 14800, 15600, 14900, 15100, 14320]
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
      categories: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'],
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
}
