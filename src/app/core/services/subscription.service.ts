import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of, map } from 'rxjs';
import { environment } from '../../../environnements/environment';

export interface Plan {
  id: string;
  code: string;
  name: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  sortOrder: number;
  
  // Limits
  maxScenarios: number;
  maxExportsPerMonth: number;
  maxVersionsPerScenario: number;
  maxShares: number;
  maxAiSuggestionsPerMonth: number;
  maxWorkspaces: number;
  
  // Features
  hasUnlimitedExports: boolean;
  hasUnlimitedVersioning: boolean;
  hasUnlimitedAi: boolean;
  hasPrivateTemplates: boolean;
  hasTeamTemplates: boolean;
  hasAdvancedComparison: boolean;
  hasApiAccess: boolean;
  hasApiReadWrite: boolean;
  hasEmailNotifications: boolean;
  hasSlackIntegration: boolean;
  hasWebhooks: boolean;
  hasSso: boolean;
  hasPrioritySupport: boolean;
  hasDedicatedSupport: boolean;
}

export interface SubscriptionDto {
  id?: string;
  userId?: string;
  plan: Plan;
  status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid' | 'free';
  isAnnual?: boolean;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  trialEndsAt?: string;
  isActive: boolean;
}

export interface UsageDto {
  dimension: string;
  current: number;
  limit: number;
  unlimited: boolean;
}

@Injectable({ providedIn: 'root' })
export class SubscriptionService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.BASE_LOCAGUEST_API}/api/subscriptions`;
  
  // State
  private currentSubscription = signal<SubscriptionDto | null>(null);
  private allPlans = signal<Plan[]>([]);
  private usageData = signal<Record<string, UsageDto>>({});
  
  // Computed
  subscription = this.currentSubscription.asReadonly();
  plans = this.allPlans.asReadonly();
  
  currentPlan = computed(() => this.currentSubscription()?.plan || null);
  
  isFreePlan = computed(() => this.currentPlan()?.code === 'free');
  isProPlan = computed(() => this.currentPlan()?.code === 'pro');
  isBusinessPlan = computed(() => this.currentPlan()?.code === 'business');
  isEnterprisePlan = computed(() => this.currentPlan()?.code === 'enterprise');
  
  isInTrial = computed(() => {
    const sub = this.currentSubscription();
    if (!sub || sub.status !== 'trialing' || !sub.trialEndsAt) return false;
    return new Date(sub.trialEndsAt) > new Date();
  });
  
  daysUntilRenewal = computed(() => {
    const sub = this.currentSubscription();
    if (!sub?.currentPeriodEnd) return null;
    const end = new Date(sub.currentPeriodEnd);
    const now = new Date();
    const days = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  });

  /**
   * Charge tous les plans disponibles
   */
  loadPlans(): Observable<Plan[]> {
    return this.http.get<Plan[]>(`${this.baseUrl}/plans`).pipe(
      tap(plans => this.allPlans.set(plans)),
      catchError(() => {
        console.error('Failed to load plans');
        return of([]);
      })
    );
  }

  /**
   * Charge l'abonnement actuel de l'utilisateur
   */
  loadCurrentSubscription(): Observable<SubscriptionDto> {
    return this.http.get<SubscriptionDto>(`${this.baseUrl}/current`).pipe(
      tap(sub => this.currentSubscription.set(sub)),
      catchError(() => {
        console.error('Failed to load subscription');
        return of({
          plan: this.getDefaultFreePlan(),
          status: 'free' as const,
          isActive: true
        });
      })
    );
  }

  /**
   * Charge l'usage actuel
   */
  loadUsage(): Observable<any> {
    return this.http.get(`${this.baseUrl}/usage`).pipe(
      tap((usage: any) => {
        const normalized: Record<string, UsageDto> = {};
        Object.keys(usage).forEach(key => {
          normalized[key] = {
            dimension: key,
            current: usage[key].current,
            limit: usage[key].limit,
            unlimited: usage[key].unlimited
          };
        });
        this.usageData.set(normalized);
      }),
      catchError(() => {
        console.error('Failed to load usage');
        return of({});
      })
    );
  }

  /**
   * Vérifie si une feature est accessible
   */
  canAccessFeature(featureName: string): Observable<boolean> {
    const plan = this.currentPlan();
    if (!plan) return of(false);
    
    // Check local first for performance
    const hasFeature = this.checkFeatureLocally(featureName, plan);
    if (hasFeature !== null) return of(hasFeature);
    
    // Fallback to API
    return this.http.get<{ feature: string; hasAccess: boolean }>(
      `${this.baseUrl}/features/${featureName}`
    ).pipe(
      map((result: { feature: string; hasAccess: boolean }) => result.hasAccess),
      catchError(() => of(false))
    );
  }

  /**
   * Vérifie le quota pour une dimension
   */
  checkQuota(dimension: string): Observable<boolean> {
    const usage = this.usageData()[dimension];
    if (usage && usage.unlimited) return of(true);
    if (usage && usage.current < usage.limit) return of(true);
    
    return this.http.get<{ dimension: string; hasQuota: boolean }>(
      `${this.baseUrl}/quota/${dimension}`
    ).pipe(
      map((result: { dimension: string; hasQuota: boolean }) => result.hasQuota),
      catchError(() => of(false))
    );
  }

  /**
   * Récupère l'usage pour une dimension
   */
  getUsage(dimension: string): UsageDto | null {
    return this.usageData()[dimension] || null;
  }

  /**
   * Vérifie localement si une feature est accessible (performance)
   */
  private checkFeatureLocally(featureName: string, plan: Plan): boolean | null {
    const featureMap: Record<string, boolean> = {
      'unlimited_exports': plan.hasUnlimitedExports,
      'unlimited_versioning': plan.hasUnlimitedVersioning,
      'unlimited_ai': plan.hasUnlimitedAi,
      'private_templates': plan.hasPrivateTemplates,
      'team_templates': plan.hasTeamTemplates,
      'advanced_comparison': plan.hasAdvancedComparison,
      'api_access': plan.hasApiAccess,
      'api_read_write': plan.hasApiReadWrite,
      'email_notifications': plan.hasEmailNotifications,
      'slack_integration': plan.hasSlackIntegration,
      'webhooks': plan.hasWebhooks,
      'sso': plan.hasSso,
      'priority_support': plan.hasPrioritySupport,
      'dedicated_support': plan.hasDedicatedSupport
    };
    
    return featureMap[featureName] ?? null;
  }

  /**
   * Plan Free par défaut
   */
  private getDefaultFreePlan(): Plan {
    return {
      id: '',
      code: 'free',
      name: 'Free',
      description: 'Plan gratuit',
      monthlyPrice: 0,
      annualPrice: 0,
      sortOrder: 1,
      maxScenarios: 3,
      maxExportsPerMonth: 5,
      maxVersionsPerScenario: 3,
      maxShares: 1,
      maxAiSuggestionsPerMonth: 2,
      maxWorkspaces: 1,
      hasUnlimitedExports: false,
      hasUnlimitedVersioning: false,
      hasUnlimitedAi: false,
      hasPrivateTemplates: false,
      hasTeamTemplates: false,
      hasAdvancedComparison: false,
      hasApiAccess: false,
      hasApiReadWrite: false,
      hasEmailNotifications: false,
      hasSlackIntegration: false,
      hasWebhooks: false,
      hasSso: false,
      hasPrioritySupport: false,
      hasDedicatedSupport: false
    };
  }

  /**
   * Initialise le service (à appeler au démarrage de l'app)
   */
  initialize(): void {
    this.loadPlans().subscribe();
    this.loadCurrentSubscription().subscribe();
    this.loadUsage().subscribe();
  }

  /**
   * Rafraîchit les données
   */
  refresh(): void {
    this.loadCurrentSubscription().subscribe();
    this.loadUsage().subscribe();
  }
}
