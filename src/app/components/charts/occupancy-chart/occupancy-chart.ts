import { Component, ViewChild } from '@angular/core';
import { NgApexchartsModule, ChartComponent } from 'ng-apexcharts';

@Component({
  selector: 'occupancy-chart',
  standalone: true,
  imports: [NgApexchartsModule],
  template: `
    <apx-chart
      [series]="chartOptions.series!"
      [chart]="chartOptions.chart!"
      [xaxis]="chartOptions.xaxis!"
      [stroke]="chartOptions.stroke!"
      [dataLabels]="chartOptions.dataLabels!"
      [markers]="chartOptions.markers!"
      [colors]="chartOptions.colors!"
      [yaxis]="chartOptions.yaxis!"
      [grid]="chartOptions.grid!"
      [legend]="chartOptions.legend!"
      [tooltip]="chartOptions.tooltip!"
    ></apx-chart>
  `
})
export class OccupancyChart {
  @ViewChild('chart') chart?: ChartComponent;

  chartOptions: any = {
    series: [
      {
        name: 'Taux d\'occupation',
        data: [85, 88, 92, 89, 91, 94, 92, 90, 93, 95, 92, 91, 94, 92, 89, 91, 93, 95, 92, 94, 96, 93, 91, 92, 94, 95, 93, 92, 94, 92]
      }
    ],
    chart: {
      height: 250,
      type: 'area',
      toolbar: { show: false },
      zoom: { enabled: false }
    },
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 2 },
    markers: { size: 0 },
    colors: ['#f59e0b'],
    xaxis: {
      categories: Array.from({length: 30}, (_, i) => `J${i+1}`),
      labels: { show: false }
    },
    yaxis: {
      labels: {
        formatter: (val: number) => val + '%'
      }
    },
    grid: {
      borderColor: '#f1f1f1',
      strokeDashArray: 4
    },
    tooltip: {
      y: {
        formatter: (val: number) => val + '%'
      }
    },
    legend: { show: false }
  };
}
