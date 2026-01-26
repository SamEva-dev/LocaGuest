import { Component, ViewChild, OnInit, OnChanges, Input, inject, SimpleChanges } from '@angular/core';
import { NgApexchartsModule, ChartComponent } from 'ng-apexcharts';
import { DashboardService } from '../../../core/services/dashboard.service';

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
export class RevenueChart implements OnInit, OnChanges {
  private dashboardService = inject(DashboardService);
  @ViewChild('chart') chart?: ChartComponent;
  
  @Input() month: number = new Date().getMonth() + 1;
  @Input() year: number = new Date().getFullYear();

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

  ngOnChanges(changes: SimpleChanges) {
    if ((changes['month'] || changes['year']) && !changes['month']?.firstChange && !changes['year']?.firstChange) {
      this.loadRevenueData();
    }
  }

  loadRevenueData() {
    this.dashboardService.getRevenueChart(this.month, this.year).subscribe({
      next: (data) => {
        const revenues = data.map(d => d.actualRevenue);
        const labels = data.map(d => d.label);
        
        this.chartOptions.series = [{
          name: 'Revenus',
          data: revenues
        }];
        this.chartOptions.xaxis.categories = labels;
        
        // Update chart if needed
        if (this.chart) {
          this.chart.updateOptions(this.chartOptions);
        }
      },
      error: (err: any) => console.error('Error loading revenue data:', err)
    });
  }
}
