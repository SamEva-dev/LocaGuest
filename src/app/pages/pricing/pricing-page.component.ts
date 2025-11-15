import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { SubscriptionService, Plan } from '../../core/services/subscription.service';

@Component({
  selector: 'app-pricing-page',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 py-12 px-4">
      <div class="max-w-7xl mx-auto">
        
        <!-- Header -->
        <div class="text-center mb-12">
          <h1 class="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
            {{ 'PRICING.TITLE' | translate }}
          </h1>
          <p class="text-xl text-slate-600 dark:text-slate-300 mb-6">
            {{ 'PRICING.SUBTITLE' | translate }}
          </p>
          
          <!-- Toggle Annual/Monthly -->
          <div class="inline-flex items-center gap-3 bg-white dark:bg-slate-800 rounded-full p-1 shadow-lg">
            <button (click)="isAnnual.set(false)"
                    [class.bg-blue-600]="!isAnnual()"
                    [class.text-white]="!isAnnual()"
                    class="px-6 py-2 rounded-full transition-all">
              Mensuel
            </button>
            <button (click)="isAnnual.set(true)"
                    [class.bg-blue-600]="isAnnual()"
                    [class.text-white]="isAnnual()"
                    class="px-6 py-2 rounded-full transition-all flex items-center gap-2">
              Annuel
              <span class="text-xs bg-green-500 text-white px-2 py-1 rounded-full">-20%</span>
            </button>
          </div>
        </div>

        <!-- Plans Grid -->
        <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          @for (plan of plans(); track plan.id) {
            <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 relative"
                 [class.ring-4]="plan.code === 'pro'"
                 [class.ring-blue-500]="plan.code === 'pro'"
                 [class.scale-105]="plan.code === 'pro'">
              
              @if (plan.code === 'pro') {
                <div class="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span class="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Populaire
                  </span>
                </div>
              }

              <!-- Plan Header -->
              <div class="text-center mb-6">
                <h3 class="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  {{ plan.name }}
                </h3>
                <p class="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  {{ plan.description }}
                </p>
                
                <!-- Price -->
                <div class="mb-4">
                  @if (plan.code === 'enterprise') {
                    <div class="text-3xl font-bold text-slate-900 dark:text-white">
                      Sur devis
                    </div>
                  } @else if (plan.monthlyPrice === 0) {
                    <div class="text-3xl font-bold text-slate-900 dark:text-white">
                      Gratuit
                    </div>
                  } @else {
                    <div class="text-3xl font-bold text-slate-900 dark:text-white">
                      {{ isAnnual() ? (plan.annualPrice / 12).toFixed(0) : plan.monthlyPrice }}€
                      <span class="text-lg font-normal text-slate-500">/mois</span>
                    </div>
                    @if (isAnnual()) {
                      <div class="text-sm text-slate-500">
                        {{ plan.annualPrice }}€ facturé annuellement
                      </div>
                    }
                  }
                </div>

                <!-- CTA Button -->
                @if (currentPlan()?.code === plan.code) {
                  <button disabled
                          class="w-full px-6 py-3 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-lg cursor-not-allowed">
                    Plan actuel
                  </button>
                } @else if (plan.code === 'enterprise') {
                  <button (click)="contactSales()"
                          class="w-full px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg hover:bg-slate-700 dark:hover:bg-slate-100 transition-colors font-semibold">
                    Nous contacter
                  </button>
                } @else {
                  <button (click)="selectPlan(plan)"
                          [class.bg-blue-600]="plan.code === 'pro'"
                          [class.hover:bg-blue-700]="plan.code === 'pro'"
                          class="w-full px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg hover:bg-slate-700 dark:hover:bg-slate-100 transition-colors font-semibold">
                    {{ plan.monthlyPrice === 0 ? 'Commencer' : 'Choisir ce plan' }}
                  </button>
                }
              </div>

              <!-- Features List -->
              <div class="space-y-3">
                <div class="flex items-start gap-2 text-sm">
                  <i class="ph ph-check text-green-500 mt-0.5"></i>
                  <span>
                    <strong>{{ plan.maxScenarios === 2147483647 ? 'Illimité' : plan.maxScenarios }}</strong> scénarios
                  </span>
                </div>
                
                <div class="flex items-start gap-2 text-sm">
                  <i class="ph ph-check text-green-500 mt-0.5"></i>
                  <span>
                    <strong>{{ plan.hasUnlimitedExports ? 'Illimité' : plan.maxExportsPerMonth }}</strong> exports/mois
                  </span>
                </div>
                
                <div class="flex items-start gap-2 text-sm">
                  <i class="ph ph-check text-green-500 mt-0.5"></i>
                  <span>
                    <strong>{{ plan.hasUnlimitedVersioning ? 'Illimité' : plan.maxVersionsPerScenario }}</strong> versions
                  </span>
                </div>
                
                <div class="flex items-start gap-2 text-sm">
                  <i class="ph ph-check text-green-500 mt-0.5"></i>
                  <span>
                    <strong>{{ plan.hasUnlimitedAi ? 'Illimité' : plan.maxAiSuggestionsPerMonth }}</strong> suggestions IA/mois
                  </span>
                </div>
                
                <div class="flex items-start gap-2 text-sm">
                  <i class="ph ph-check text-green-500 mt-0.5"></i>
                  <span>
                    Partage avec <strong>{{ plan.maxShares }}</strong> utilisateurs
                  </span>
                </div>

                @if (plan.hasPrivateTemplates) {
                  <div class="flex items-start gap-2 text-sm">
                    <i class="ph ph-check text-green-500 mt-0.5"></i>
                    <span>Templates privés</span>
                  </div>
                }

                @if (plan.hasAdvancedComparison) {
                  <div class="flex items-start gap-2 text-sm">
                    <i class="ph ph-check text-green-500 mt-0.5"></i>
                    <span>Comparaison avancée</span>
                  </div>
                }

                @if (plan.hasApiAccess) {
                  <div class="flex items-start gap-2 text-sm">
                    <i class="ph ph-check text-green-500 mt-0.5"></i>
                    <span>API {{ plan.hasApiReadWrite ? 'R+W' : 'Read' }}</span>
                  </div>
                }

                @if (plan.hasPrioritySupport) {
                  <div class="flex items-start gap-2 text-sm">
                    <i class="ph ph-check text-green-500 mt-0.5"></i>
                    <span>Support prioritaire</span>
                  </div>
                }
              </div>
            </div>
          }
        </div>

        <!-- FAQ Section -->
        <div class="max-w-3xl mx-auto bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8">
          <h2 class="text-2xl font-bold text-slate-900 dark:text-white mb-6">
            Questions fréquentes
          </h2>
          
          <div class="space-y-4">
            <details class="group">
              <summary class="flex items-center justify-between cursor-pointer p-4 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg">
                <span class="font-medium">Puis-je changer de plan à tout moment ?</span>
                <i class="ph ph-caret-down group-open:rotate-180 transition-transform"></i>
              </summary>
              <div class="px-4 pb-4 text-slate-600 dark:text-slate-400">
                Oui, vous pouvez upgrader ou downgrader à tout moment. Les changements sont effectifs immédiatement.
              </div>
            </details>

            <details class="group">
              <summary class="flex items-center justify-between cursor-pointer p-4 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg">
                <span class="font-medium">Y a-t-il une période d'essai ?</span>
                <i class="ph ph-caret-down group-open:rotate-180 transition-transform"></i>
              </summary>
              <div class="px-4 pb-4 text-slate-600 dark:text-slate-400">
                Oui, tous les plans payants bénéficient de 14 jours d'essai gratuit.
              </div>
            </details>

            <details class="group">
              <summary class="flex items-center justify-between cursor-pointer p-4 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg">
                <span class="font-medium">Que se passe-t-il si je dépasse mon quota ?</span>
                <i class="ph ph-caret-down group-open:rotate-180 transition-transform"></i>
              </summary>
              <div class="px-4 pb-4 text-slate-600 dark:text-slate-400">
                Vous serez invité à upgrader votre plan. Vos données restent accessibles en lecture seule.
              </div>
            </details>
          </div>
        </div>
      </div>
    </div>
  `
})
export class PricingPageComponent implements OnInit {
  private subscriptionService = inject(SubscriptionService);
  private router = inject(Router);

  plans = signal<Plan[]>([]);
  currentPlan = this.subscriptionService.currentPlan;
  isAnnual = signal(false);

  ngOnInit() {
    this.subscriptionService.loadPlans().subscribe(
      plans => this.plans.set(plans)
    );
  }

  selectPlan(plan: Plan) {
    if (plan.monthlyPrice === 0) {
      // Free plan - just redirect to app
      this.router.navigate(['/']);
    } else {
      // Paid plan - TODO: Redirect to Stripe Checkout
      console.log('Selected plan:', plan);
      alert(`Checkout pour le plan ${plan.name} - À implémenter avec Stripe`);
    }
  }

  contactSales() {
    window.location.href = 'mailto:sales@locaguest.com?subject=Enterprise Plan';
  }
}
