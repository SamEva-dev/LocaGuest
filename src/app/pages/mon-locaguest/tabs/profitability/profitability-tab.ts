import { Component, inject, signal, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Chart, registerables } from 'chart.js';
import { AnalyticsService } from '../../../../core/services/analytics.service';
import { ProfitabilityStats, RevenueEvolution, PropertyPerformance } from '../../../../core/api/analytics.api';
import { ProfitabilityTourService } from './profitability-tour.service';

Chart.register(...registerables);

@Component({
  selector: 'profitability-tab',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './profitability-tab.html'
})
export class ProfitabilityTab implements OnInit, AfterViewInit {
  private analyticsService = inject(AnalyticsService);
  private translate = inject(TranslateService);
  private tour = inject(ProfitabilityTourService);
  
  @ViewChild('revenueChart') revenueChartRef!: ElementRef<HTMLCanvasElement>;
  
  stats = signal<ProfitabilityStats | null>(null);
  evolution = signal<RevenueEvolution[]>([]);
  performance = signal<PropertyPerformance[]>([]);
  isLoading = signal(false);
  availableYears = signal<number[]>([]);
  selectedYear = signal<number>(new Date().getFullYear());
  selectedPeriod = signal<number>(6);
  periods = [3, 6, 9, 12];
  
  private revenueChart: Chart | null = null;

  ngOnInit() {
    this.loadAvailableYears();
    this.loadStats();
    this.loadEvolution();
    this.loadPerformance();
  }

  ngAfterViewInit() {
    // Le graphique sera créé après le chargement des données
  }

  startTour() {
    this.tour.start();
  }

  loadStats() {
    this.analyticsService.getProfitabilityStats().subscribe({
      next: (data) => this.stats.set(data),
      error: (err) => console.error('Error loading profitability stats:', err)
    });
  }

  loadAvailableYears() {
    this.analyticsService.getAvailableYears().subscribe({
      next: (data) => {
        this.availableYears.set(data);
        if (data.length > 0) {
          this.selectedYear.set(data[0]);
        }
      },
      error: (err) => console.error('Error loading available years:', err)
    });
  }

  loadEvolution() {
    this.analyticsService.getRevenueEvolution(this.selectedPeriod(), this.selectedYear()).subscribe({
      next: (data) => {
        this.evolution.set(data);
        setTimeout(() => this.createRevenueChart(), 100);
      },
      error: (err) => console.error('Error loading revenue evolution:', err)
    });
  }

  loadPerformance() {
    this.analyticsService.getPropertyPerformance().subscribe({
      next: (data) => this.performance.set(data),
      error: (err) => console.error('Error loading property performance:', err)
    });
  }

  createRevenueChart() {
    if (!this.revenueChartRef) return;
    
    const ctx = this.revenueChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    if (this.revenueChart) {
      this.revenueChart.destroy();
    }

    const data = this.evolution();
    
    this.revenueChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.map(d => d.month),
        datasets: [
          {
            label: this.translate.instant('PROFITABILITY.CHART.REVENUE'),
            data: data.map(d => d.revenue),
            borderColor: 'rgb(16, 185, 129)',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            fill: true,
            tension: 0.4
          },
          {
            label: this.translate.instant('PROFITABILITY.CHART.EXPENSES'),
            data: data.map(d => d.expenses),
            borderColor: 'rgb(239, 68, 68)',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            fill: true,
            tension: 0.4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          },
          title: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => `${value}€`
            }
          }
        }
      }
    });
  }

  getChangeIcon(percent: number): string {
    return percent >= 0 ? 'ph-trend-up' : 'ph-trend-down';
  }

  getChangeColor(percent: number): string {
    return percent >= 0 ? 'text-emerald-600' : 'text-red-600';
  }

  onYearChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.selectedYear.set(parseInt(target.value));
    // Recharger les données pour l'année sélectionnée
    this.loadStats();
    this.loadEvolution();
    this.loadPerformance();
  }

  onPeriodChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.selectedPeriod.set(parseInt(target.value));
    this.loadEvolution();
  }
}
