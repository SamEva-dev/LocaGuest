import { Component, ViewChild, OnInit, inject } from '@angular/core';
import { NgApexchartsModule, ChartComponent } from 'ng-apexcharts';
import { AnalyticsApi } from '../../../core/api/analytics.api';

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
export class OccupancyChart implements OnInit {
  private analyticsApi = inject(AnalyticsApi);
  @ViewChild('chart') chart?: ChartComponent;

  chartOptions: any = {
    series: [
      {
        name: 'Taux d\'occupation',
        data: []
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

  ngOnInit() {
    this.loadOccupancyData();
  }

  loadOccupancyData() {
    this.analyticsApi.getOccupancyTrend(30).subscribe({
      next: (data) => {
        const occupancyRates = data.map(d => d.occupancyRate);
        this.chartOptions.series = [{
          name: 'Taux d\'occupation',
          data: occupancyRates
        }];
        // Update chart if needed
        if (this.chart) {
          this.chart.updateSeries(this.chartOptions.series);
        }
      },
      error: (err) => console.error('Error loading occupancy data:', err)
    });
  }
}
