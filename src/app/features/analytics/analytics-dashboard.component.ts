import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { environment } from '../../../environnements/environment.dev';

interface AnalyticsStats {
  dailyActiveUsers: number;
  weeklyActiveUsers: number;
  monthlyActiveUsers: number;
  totalEvents: number;
  topPages: PageStat[];
  topFeatures: FeatureStat[];
  errorRate: number;
}

interface PageStat {
  pageName: string;
  visitCount: number;
  uniqueUsers: number;
}

interface FeatureStat {
  featureName: string;
  usageCount: number;
}

/**
 * Analytics Dashboard Component
 * Displays product analytics and user behavior insights
 */
@Component({
  selector: 'app-analytics-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="analytics-dashboard p-6">
      <h1 class="text-3xl font-bold mb-6">📊 Analytics Dashboard</h1>

      <!-- KPIs Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <!-- DAU -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600 dark:text-gray-400">Daily Active Users</p>
              <p class="text-3xl font-bold text-blue-600">{{ stats()?.dailyActiveUsers || 0 }}</p>
            </div>
            <div class="text-4xl">👥</div>
          </div>
        </div>

        <!-- WAU -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600 dark:text-gray-400">Weekly Active Users</p>
              <p class="text-3xl font-bold text-green-600">{{ stats()?.weeklyActiveUsers || 0 }}</p>
            </div>
            <div class="text-4xl">📅</div>
          </div>
        </div>

        <!-- MAU -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600 dark:text-gray-400">Monthly Active Users</p>
              <p class="text-3xl font-bold text-purple-600">{{ stats()?.monthlyActiveUsers || 0 }}</p>
            </div>
            <div class="text-4xl">📈</div>
          </div>
        </div>

        <!-- Total Events -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600 dark:text-gray-400">Total Events (30d)</p>
              <p class="text-3xl font-bold text-orange-600">{{ stats()?.totalEvents || 0 }}</p>
            </div>
            <div class="text-4xl">🎯</div>
          </div>
        </div>
      </div>

      <!-- Top Pages & Features Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <!-- Top Pages -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 class="text-xl font-bold mb-4">📄 Pages les plus visitées</h2>
          <div class="space-y-3">
            @for (page of stats()?.topPages || []; track page.pageName) {
              <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
                <div class="flex-1">
                  <p class="font-medium">{{ page.pageName }}</p>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    {{ page.uniqueUsers }} utilisateurs uniques
                  </p>
                </div>
                <div class="text-right">
                  <p class="text-2xl font-bold text-blue-600">{{ page.visitCount }}</p>
                  <p class="text-xs text-gray-500">visites</p>
                </div>
              </div>
            } @empty {
              <p class="text-gray-500">Aucune donnée disponible</p>
            }
          </div>
        </div>

        <!-- Top Features -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 class="text-xl font-bold mb-4">⚡ Features les plus utilisées</h2>
          <div class="space-y-3">
            @for (feature of stats()?.topFeatures || []; track feature.featureName) {
              <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
                <div class="flex-1">
                  <p class="font-medium">{{ feature.featureName }}</p>
                </div>
                <div class="text-right">
                  <p class="text-2xl font-bold text-green-600">{{ feature.usageCount }}</p>
                  <p class="text-xs text-gray-500">utilisations</p>
                </div>
              </div>
            } @empty {
              <p class="text-gray-500">Aucune donnée disponible</p>
            }
          </div>
        </div>
      </div>

      <!-- Error Rate -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 class="text-xl font-bold mb-4">⚠️ Taux d'erreur</h2>
        <div class="flex items-center justify-between">
          <p class="text-gray-600 dark:text-gray-400">
            Pourcentage d'erreurs sur les 7 derniers jours
          </p>
          <p class="text-4xl font-bold" 
             [class.text-green-600]="(stats()?.errorRate || 0) < 1"
             [class.text-yellow-600]="(stats()?.errorRate || 0) >= 1 && (stats()?.errorRate || 0) < 5"
             [class.text-red-600]="(stats()?.errorRate || 0) >= 5">
            {{ (stats()?.errorRate || 0).toFixed(2) }}%
          </p>
        </div>
      </div>

      <!-- Loading State -->
      @if (loading()) {
        <div class="flex items-center justify-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      }

      <!-- Error State -->
      @if (error()) {
        <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mt-6">
          <p class="text-red-800 dark:text-red-200">
            Erreur lors du chargement des analytics: {{ error() }}
          </p>
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class AnalyticsDashboardComponent implements OnInit {
  private http = inject(HttpClient);
  
  stats = signal<AnalyticsStats | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadAnalytics();
    
    // Auto-refresh every 5 minutes
    setInterval(() => this.loadAnalytics(), 5 * 60 * 1000);
  }

  private loadAnalytics(): void {
    this.loading.set(true);
    this.error.set(null);

    // TODO: Replace with real API endpoint
    // For now, using mock data
    this.getMockAnalytics().subscribe({
      next: (data) => {
        this.stats.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.message);
        this.loading.set(false);
      }
    });
  }

  private getMockAnalytics(): Observable<AnalyticsStats> {
    // Mock data for demonstration
    // TODO: Replace with real API call
    return of({
      dailyActiveUsers: 42,
      weeklyActiveUsers: 156,
      monthlyActiveUsers: 489,
      totalEvents: 12543,
      topPages: [
        { pageName: 'Dashboard', visitCount: 2341, uniqueUsers: 156 },
        { pageName: 'Properties', visitCount: 1823, uniqueUsers: 142 },
        { pageName: 'Contracts', visitCount: 1456, uniqueUsers: 98 },
        { pageName: 'Tenants', visitCount: 987, uniqueUsers: 87 },
        { pageName: 'Reports', visitCount: 654, uniqueUsers: 45 }
      ],
      topFeatures: [
        { featureName: 'Export CSV', usageCount: 234 },
        { featureName: 'Generate Document', usageCount: 187 },
        { featureName: 'Send Reminder', usageCount: 156 },
        { featureName: 'Record Payment', usageCount: 142 },
        { featureName: 'Search', usageCount: 98 }
      ],
      errorRate: 1.23
    });
  }

  // TODO: Implement real API call
  // private getAnalyticsFromApi(): Observable<AnalyticsStats> {
  //   return this.http.get<AnalyticsStats>(`${environment.BASE_LOCAGUEST_API}/api/analytics/dashboard`)
  //     .pipe(catchError(err => {
  //       console.error('Analytics error:', err);
  //       return of(null);
  //     }));
  // }
}
