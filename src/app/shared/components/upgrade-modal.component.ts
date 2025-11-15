import { Component, input, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-upgrade-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
         (click)="close.emit()">
      <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-8"
           (click)="$event.stopPropagation()">
        
        <!-- Icon -->
        <div class="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <i class="ph ph-crown text-white text-3xl"></i>
        </div>

        <!-- Title -->
        <h2 class="text-2xl font-bold text-center text-slate-900 dark:text-white mb-3">
          {{ title() || 'Passez au niveau supérieur' }}
        </h2>

        <!-- Message -->
        <p class="text-center text-slate-600 dark:text-slate-300 mb-6">
          {{ message() || 'Cette fonctionnalité nécessite un plan supérieur pour être accessible.' }}
        </p>

        <!-- Feature Required Badge -->
        @if (feature()) {
          <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <div class="flex items-center gap-2 text-blue-900 dark:text-blue-100">
              <i class="ph ph-lock-simple-open"></i>
              <span class="font-medium">Feature requise: {{ feature() }}</span>
            </div>
          </div>
        }

        <!-- Benefits -->
        <div class="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 mb-6">
          <h3 class="font-semibold text-slate-900 dark:text-white mb-3">
            Avec un plan supérieur :
          </h3>
          <ul class="space-y-2">
            <li class="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              <i class="ph ph-check-circle text-green-500"></i>
              <span>Scénarios et exports illimités</span>
            </li>
            <li class="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              <i class="ph ph-check-circle text-green-500"></i>
              <span>Suggestions IA avancées</span>
            </li>
            <li class="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              <i class="ph ph-check-circle text-green-500"></i>
              <span>Collaboration en équipe</span>
            </li>
            <li class="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              <i class="ph ph-check-circle text-green-500"></i>
              <span>Support prioritaire</span>
            </li>
          </ul>
        </div>

        <!-- Actions -->
        <div class="flex gap-3">
          <button (click)="close.emit()"
                  class="flex-1 px-6 py-3 border border-slate-300 dark:border-slate-600 rounded-lg
                         hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
            Plus tard
          </button>
          <button (click)="goToPricing()"
                  class="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg
                         hover:from-blue-700 hover:to-purple-700 transition-colors font-semibold">
            Voir les plans
          </button>
        </div>
      </div>
    </div>
  `
})
export class UpgradeModalComponent {
  private router = inject(Router);
  
  title = input<string>();
  message = input<string>();
  feature = input<string>();
  close = output<void>();

  goToPricing() {
    this.close.emit();
    this.router.navigate(['/pricing'], {
      queryParams: { feature: this.feature(), reason: 'upgrade_required' }
    });
  }
}
