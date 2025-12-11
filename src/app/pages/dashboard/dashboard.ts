import { Component, inject, computed, signal } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { OccupancyChart } from '../../components/charts/occupancy-chart/occupancy-chart';
import { RevenueChart } from '../../components/charts/revenue-chart/revenue-chart';
import { TabManagerService } from '../../core/services/tab-manager.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { PaymentsService, PaymentsDashboard } from '../../core/services/payments.service';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  imports: [TranslatePipe, OccupancyChart, RevenueChart, RouterLink, CommonModule, FormsModule],
  templateUrl: './dashboard.html'
})
export class Dashboard {
  private tabManager = inject(TabManagerService);
  private translate = inject(TranslateService)
  dashboard = inject(DashboardService);
  private paymentsService = inject(PaymentsService);

  // Filtres période
  selectedMonth = new Date().getMonth() + 1;
  selectedYear = new Date().getFullYear();
  availableYears = signal<number[]>([new Date().getFullYear()]);

  // Charger données
  summary$ = this.dashboard.getSummary(this.selectedMonth, this.selectedYear);
  activities$ = this.dashboard.getActivities(20);
  
  // Payments dashboard data
  paymentsDashboard = signal<PaymentsDashboard | null>(null);
  loadingPayments = signal(false);

  // Mapper les stat cards à partir du summary + payments
  stats = computed(() => {
    const s = this.dashboard.summary();
    const p = this.paymentsDashboard();
    console.log('Dashboard summary:', s); 
    return [
      { key: 'properties', label: 'DASHBOARD.STATS.PROPERTIES', value: s?.propertiesCount ?? 0, icon: 'ph-house', color: 'blue', delta: undefined, deltaPositive: true },
      { key: 'tenants', label: 'DASHBOARD.STATS.TENANTS', value: s?.activeTenants ?? 0, icon: 'ph-users-three', color: 'green', delta: undefined, deltaPositive: true },
      { key: 'occupancy', label: 'DASHBOARD.STATS.OCCUPANCY', value: `${Math.round((s?.occupancyRate ?? 0)*100)}%`, icon: 'ph-chart-line-up', color: 'purple', delta: undefined, deltaPositive: true },
      { key: 'revenue', label: 'DASHBOARD.STATS.REVENUE', value: `€ ${s?.monthlyRevenue?.toLocaleString?.() ?? 0}`, icon: 'ph-currency-eur', color: 'amber', delta: undefined, deltaPositive: true },
      { key: 'collection', label: 'Taux Collection', value: `${p?.collectionRate?.toFixed(1) ?? 0}%`, icon: 'ph-percent', color: 'emerald', delta: undefined, deltaPositive: (p?.collectionRate ?? 0) >= 80 },
      { key: 'overdue', label: 'En Retard', value: p?.overdueCount ?? 0, icon: 'ph-warning', color: 'red', delta: undefined, deltaPositive: false },
    ];
  });

  activities = this.dashboard.activities();

  ngOnInit() {
    this.summary$.subscribe();
    this.activities$.subscribe();
    this.loadPaymentsDashboard();
    this.loadAvailableYears();
  }

  loadAvailableYears() {
    this.dashboard.getAvailableYears().subscribe({
      next: (years) => {
        this.availableYears.set(years);
      },
      error: (err) => {
        console.error('Error loading available years:', err);
        this.availableYears.set([new Date().getFullYear()]);
      }
    });
  }

  loadPaymentsDashboard() {
    this.loadingPayments.set(true);
    this.paymentsService.getPaymentsDashboard({
      month: this.selectedMonth,
      year: this.selectedYear
    }).subscribe({
      next: (data) => {
        this.paymentsDashboard.set(data);
        this.loadingPayments.set(false);
      },
      error: (err) => {
        console.error('Error loading payments dashboard:', err);
        this.loadingPayments.set(false);
      }
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  }
  
  onPeriodChange() {
    // Recharger summary avec nouveaux filtres
    this.summary$ = this.dashboard.getSummary(this.selectedMonth, this.selectedYear);
    this.summary$.subscribe();
    
    // Recharger payments dashboard
    this.loadPaymentsDashboard();
  }
  
  refreshDashboard() {
    this.summary$ = this.dashboard.getSummary(this.selectedMonth, this.selectedYear);
    this.activities$ = this.dashboard.getActivities(20);
    this.loadPaymentsDashboard();
    this.loadAvailableYears();
    this.summary$.subscribe();
    this.activities$.subscribe();
  }

  openPropertyDemo() {
    this.tabManager.openProperty('1', 'T3 - Centre Ville');
  }

  openTenantDemo() {
    this.tabManager.openTenant('1', 'Marie Dupont');
  }
}
