import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { RentabilityScenariosService } from '../../../core/services/rentability-scenarios.service';
import { RentabilityScenarioDto } from '../../../core/api/rentability-scenarios.api';
import { VersionHistoryComponent } from './version-history.component';

@Component({
  selector: 'app-scenarios-manager',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe, VersionHistoryComponent],
  template: `
    <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6">
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-lg font-semibold text-slate-900 dark:text-white">
          {{ 'RENTABILITY.SCENARIOS.TITLE' | translate }}
        </h3>
        <button (click)="createNew()" 
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
          <i class="ph ph-plus"></i>
          {{ 'RENTABILITY.SCENARIOS.NEW' | translate }}
        </button>
      </div>

      @if (isLoading()) {
        <div class="text-center py-8">
          <i class="ph ph-spinner text-4xl text-blue-600 animate-spin"></i>
        </div>
      } @else if (scenarios().length === 0) {
        <div class="text-center py-8 text-slate-500">
          {{ 'RENTABILITY.SCENARIOS.EMPTY' | translate }}
        </div>
      } @else {
        <!-- View mode selector -->
        <div class="flex gap-2 mb-4">
          <button (click)="viewMode.set('list')" 
            [class.bg-blue-600]="viewMode() === 'list'"
            [class.text-white]="viewMode() === 'list'"
            class="px-3 py-1 rounded border">
            <i class="ph ph-list"></i> Liste
          </button>
          <button (click)="viewMode.set('compare')" 
            [class.bg-blue-600]="viewMode() === 'compare'"
            [class.text-white]="viewMode() === 'compare'"
            class="px-3 py-1 rounded border">
            <i class="ph ph-arrows-left-right"></i> Comparer
          </button>
        </div>

        @if (viewMode() === 'list') {
          <!-- List view -->
          <div class="space-y-3">
            @for (scenario of scenarios(); track scenario.id) {
              <div class="border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <div class="flex items-center gap-2 mb-1">
                      <h4 class="font-medium text-slate-900 dark:text-white">{{ scenario.name }}</h4>
                      @if (scenario.isBase) {
                        <span class="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded">
                          Base
                        </span>
                      }
                    </div>
                    <div class="text-sm text-slate-500">
                      {{ 'RENTABILITY.SCENARIOS.MODIFIED' | translate }}: {{ scenario.lastModifiedAt | date:'short' }}
                    </div>
                    @if (scenario.resultsJson) {
                      <div class="mt-2 flex gap-4 text-sm">
                        <span class="text-emerald-600">
                          <i class="ph ph-chart-line-up"></i>
                          {{ getKPI(scenario, 'netNetYield') }}% rendement
                        </span>
                        <span class="text-blue-600">
                          <i class="ph ph-currency-circle-dollar"></i>
                          {{ getKPI(scenario, 'cashflow') }}€/mois
                        </span>
                      </div>
                    }
                  </div>

                  <div class="flex items-center gap-2">
                    <button (click)="loadScenario(scenario)" 
                      class="px-3 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded hover:bg-slate-100 dark:hover:bg-slate-700">
                      <i class="ph ph-folder-open"></i>
                      {{ 'RENTABILITY.SCENARIOS.LOAD' | translate }}
                    </button>
                    <button (click)="toggleVersions(scenario.id)" 
                      class="px-3 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
                      title="Historique">
                      <i class="ph ph-clock-counter-clockwise"></i>
                    </button>
                    <button (click)="cloneScenario(scenario)" 
                      class="px-3 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded hover:bg-slate-100 dark:hover:bg-slate-700">
                      <i class="ph ph-copy"></i>
                    </button>
                    <button (click)="deleteScenario(scenario)" 
                      class="px-3 py-1 text-sm text-red-600 border border-red-300 rounded hover:bg-red-50 dark:hover:bg-red-900/20">
                      <i class="ph ph-trash"></i>
                    </button>
                  </div>
                </div>
                
                <!-- Version History (collapsible) -->
                @if (showVersionsForScenario() === scenario.id) {
                  <div class="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                    <app-version-history 
                      [scenarioId]="scenario.id"
                      [currentVersion]="getCurrentVersion(scenario)"
                      (onRestore)="handleVersionRestore()">
                    </app-version-history>
                  </div>
                }
              </div>
            }
          </div>
        } @else {
          <!-- Compare view -->
          <div class="grid grid-cols-2 gap-4">
            @for (scenario of selectedForComparison(); track scenario.id) {
              <div class="border-2 border-blue-600 rounded-lg p-4">
                <h4 class="font-semibold mb-3">{{ scenario.name }}</h4>
                @if (scenario.resultsJson) {
                  <div class="space-y-2 text-sm">
                    <div class="flex justify-between">
                      <span>Rendement:</span>
                      <span class="font-medium">{{ getKPI(scenario, 'netNetYield') }}%</span>
                    </div>
                    <div class="flex justify-between">
                      <span>Cashflow:</span>
                      <span class="font-medium">{{ getKPI(scenario, 'cashflow') }}€</span>
                    </div>
                    <div class="flex justify-between">
                      <span>TRI:</span>
                      <span class="font-medium">{{ getKPI(scenario, 'irr') }}%</span>
                    </div>
                    <div class="flex justify-between">
                      <span>VAN:</span>
                      <span class="font-medium">{{ getKPI(scenario, 'npv') }}€</span>
                    </div>
                  </div>
                }
              </div>
            }
          </div>

          <!-- Selector for comparison -->
          <div class="mt-4">
            <select [(ngModel)]="compareScenario1" (ngModelChange)="updateComparison()"
              class="px-4 py-2 rounded border mr-2">
              <option [value]="null">-- Scénario 1 --</option>
              @for (s of scenarios(); track s.id) {
                <option [value]="s.id">{{ s.name }}</option>
              }
            </select>
            <select [(ngModel)]="compareScenario2" (ngModelChange)="updateComparison()"
              class="px-4 py-2 rounded border">
              <option [value]="null">-- Scénario 2 --</option>
              @for (s of scenarios(); track s.id) {
                <option [value]="s.id">{{ s.name }}</option>
              }
            </select>
          </div>
        }
      }
    </div>
  `
})
export class ScenariosManagerComponent {
  private scenariosService = inject(RentabilityScenariosService);

  scenarios = this.scenariosService.scenarios;
  isLoading = this.scenariosService.isLoading;
  viewMode = signal<'list' | 'compare'>('list');
  showVersionsForScenario = signal<string | null>(null);

  compareScenario1: string | null = null;
  compareScenario2: string | null = null;

  selectedForComparison = computed(() => {
    const scenarios = this.scenarios();
    const selected = [];
    if (this.compareScenario1) {
      const s1 = scenarios.find(s => s.id === this.compareScenario1);
      if (s1) selected.push(s1);
    }
    if (this.compareScenario2) {
      const s2 = scenarios.find(s => s.id === this.compareScenario2);
      if (s2) selected.push(s2);
    }
    return selected;
  });

  createNew() {
    // Emit event to parent to create new scenario
    window.location.reload(); // Simple reload for now
  }

  loadScenario(scenario: RentabilityScenarioDto) {
    this.scenariosService.loadScenario(scenario);
    // Reload wizard with this scenario data
    window.location.reload();
  }

  cloneScenario(scenario: RentabilityScenarioDto) {
    const newName = prompt('Nom du nouveau scénario:', `${scenario.name} (copie)`);
    if (newName) {
      // TODO: Call API to clone
      this.scenariosService.saveScenario(
        scenario.input as any,
        newName,
        false
      ).subscribe(() => {
        this.scenariosService.loadUserScenarios();
      });
    }
  }

  deleteScenario(scenario: RentabilityScenarioDto) {
    if (confirm(`Supprimer le scénario "${scenario.name}" ?`)) {
      this.scenariosService.deleteScenario(scenario.id).subscribe(() => {
        // List updated automatically via signal
      });
    }
  }

  getKPI(scenario: RentabilityScenarioDto, kpi: string): number {
    if (!scenario.resultsJson) return 0;
    try {
      const results = JSON.parse(scenario.resultsJson);
      switch (kpi) {
        case 'netNetYield':
          return Math.round(results.kpis.netNetYield * 10) / 10;
        case 'cashflow':
          return Math.round(results.yearlyResults[0].cashflowAfterTax / 12);
        case 'irr':
          return Math.round(results.kpis.irr * 10) / 10;
        case 'npv':
          return Math.round(results.kpis.npv);
        default:
          return 0;
      }
    } catch {
      return 0;
    }
  }

  updateComparison() {
    // Update comparison view
  }

  toggleVersions(scenarioId: string) {
    if (this.showVersionsForScenario() === scenarioId) {
      this.showVersionsForScenario.set(null);
    } else {
      this.showVersionsForScenario.set(scenarioId);
    }
  }

  getCurrentVersion(scenario: RentabilityScenarioDto): number {
    // Parse from resultsJson or return 1 by default
    return 1; // TODO: Get from scenario if stored
  }

  handleVersionRestore() {
    // Reload scenarios after restore
    this.scenariosService.loadUserScenarios();
    alert('Version restaurée avec succès!');
  }
}
