import { Component, inject, signal } from '@angular/core';
import { AnalyticsService } from '../../services/analytics.service';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { AnalyticsCharts } from './analytics-charts';

@Component({
  selector: 'app-analytics',
  imports: [CommonModule,  FormsModule,TranslateModule, AnalyticsCharts],
  templateUrl: './analytics.html',
  styleUrl: './analytics.scss'
})
export class Analytics {
private readonly analyticsService = inject(AnalyticsService);

  readonly period = signal('6m');
  readonly selectedProperty = signal('all');

  overview = this.analyticsService.overview;
  performances = this.analyticsService.performances;
  optimizations = this.analyticsService.optimizations;
  loading = this.analyticsService.loading;

    cashflow = this.analyticsService.cashflow;
  yieldShare = this.analyticsService.yieldShare;

  periods = [
    { id: '3m', label: 'ANALYTICS.PERIOD.3M' },
    { id: '6m', label: 'ANALYTICS.PERIOD.6M' },
    { id: '12m', label: 'ANALYTICS.PERIOD.12M' }
  ];

  properties = [
    { id: 'all', label: 'ANALYTICS.PROPERTIES.ALL' },
    { id: 'apt-centre', label: 'Appartement Centre' },
    { id: 'studio', label: 'Studio Étudiant' }
  ];

  async ngOnInit() {
    await this.analyticsService.load(this.period());
  }

  async onFilterChange() {
    await this.analyticsService.load(this.period(), this.selectedProperty() === 'all' ? undefined : this.selectedProperty());
  }
}
