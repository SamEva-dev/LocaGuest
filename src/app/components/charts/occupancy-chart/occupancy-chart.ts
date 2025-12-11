import { Component, ViewChild, OnInit, OnChanges, Input, inject, SimpleChanges } from '@angular/core';
import { NgApexchartsModule, ChartComponent } from 'ng-apexcharts';
import { DashboardService } from '../../../core/services/dashboard.service';

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
export class OccupancyChart implements OnInit, OnChanges {
  private dashboardService = inject(DashboardService);
  @ViewChild('chart') chart?: ChartComponent;
  
  @Input() month: number = new Date().getMonth() + 1;
  @Input() year: number = new Date().getFullYear();

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

  ngOnChanges(changes: SimpleChanges) {
    if ((changes['month'] || changes['year']) && !changes['month']?.firstChange && !changes['year']?.firstChange) {
      this.loadOccupancyData();
    }
  }

  loadOccupancyData() {
    this.dashboardService.getOccupancyChart(this.year).subscribe({
      next: (data) => {
        const occupancyRates = data.map(d => d.occupancyRate);
        const labels = data.map(d => d.monthName);
        
        this.chartOptions.series = [{
          name: 'Taux d\'occupation',
          data: occupancyRates
        }];
        this.chartOptions.xaxis.categories = labels;
        
        // Update chart if needed
        if (this.chart) {
          this.chart.updateSeries(this.chartOptions.series);
          this.chart.updateOptions({ xaxis: { categories: labels } });
        }
      },
      error: (err: any) => console.error('Error loading occupancy data:', err)
    });
  }
}
