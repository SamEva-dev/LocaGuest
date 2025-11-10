import { Component, inject, signal, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { TranslatePipe } from '@ngx-translate/core';
import { environment } from '../../../../environnements/environment';

export interface ScenarioVersion {
  id: string;
  scenarioId: string;
  versionNumber: number;
  changeDescription: string;
  snapshotJson: string;
  createdAt: string;
}

@Component({
  selector: 'app-version-history',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  template: `
    <div class="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-4">
      <div class="flex items-center justify-between mb-4">
        <h4 class="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <i class="ph ph-clock-counter-clockwise"></i>
          {{ 'RENTABILITY.VERSIONS.TITLE' | translate }}
        </h4>
        <button (click)="loadVersions()" 
          [disabled]="isLoading()"
          class="px-3 py-1 text-sm border rounded hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50">
          <i class="ph" [class.ph-spinner]="isLoading()" [class.ph-arrow-clockwise]="!isLoading()" 
             [class.animate-spin]="isLoading()"></i>
          {{ 'RENTABILITY.VERSIONS.REFRESH' | translate }}
        </button>
      </div>

      @if (isLoading()) {
        <div class="text-center py-8">
          <i class="ph ph-spinner text-4xl text-blue-600 animate-spin"></i>
        </div>
      } @else if (error()) {
        <div class="text-center py-8 text-red-600">
          <i class="ph ph-warning-circle text-4xl"></i>
          <p class="mt-2">{{ error() }}</p>
        </div>
      } @else if (versions().length === 0) {
        <div class="text-center py-8 text-slate-500">
          <i class="ph ph-file-dashed text-4xl"></i>
          <p class="mt-2">{{ 'RENTABILITY.VERSIONS.EMPTY' | translate }}</p>
        </div>
      } @else {
        <div class="space-y-3 max-h-96 overflow-y-auto">
          @for (version of versions(); track version.id) {
            <div class="border border-slate-200 dark:border-slate-700 rounded-lg p-3 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="font-semibold text-slate-900 dark:text-white">
                      Version {{ version.versionNumber }}
                    </span>
                    @if (version.versionNumber === currentVersion()) {
                      <span class="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded">
                        Actuelle
                      </span>
                    }
                  </div>
                  <p class="text-sm text-slate-600 dark:text-slate-400">
                    {{ version.changeDescription }}
                  </p>
                  <p class="text-xs text-slate-500 mt-1">
                    {{ version.createdAt | date:'medium' }}
                  </p>
                </div>

                <div class="flex gap-2 ml-4">
                  <button (click)="previewVersion(version)" 
                    class="px-3 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
                    title="Aperçu">
                    <i class="ph ph-eye"></i>
                  </button>
                  @if (version.versionNumber !== currentVersion()) {
                    <button (click)="confirmRestore(version)" 
                      class="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                      title="Restaurer cette version">
                      <i class="ph ph-arrow-counter-clockwise"></i>
                      Restaurer
                    </button>
                  }
                </div>
              </div>
            </div>
          }
        </div>
      }
    </div>

    <!-- Preview Modal -->
    @if (previewData()) {
      <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" (click)="closePreview()">
        <div class="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-4xl max-h-[90vh] overflow-y-auto m-4" 
             (click)="$event.stopPropagation()">
          <div class="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 flex items-center justify-between">
            <h3 class="text-lg font-semibold text-slate-900 dark:text-white">
              Aperçu - Version {{ previewData()!.versionNumber }}
            </h3>
            <button (click)="closePreview()" class="text-slate-500 hover:text-slate-700">
              <i class="ph ph-x text-2xl"></i>
            </button>
          </div>
          <div class="p-6">
            <pre class="bg-slate-50 dark:bg-slate-900 p-4 rounded text-xs overflow-x-auto">{{ formatSnapshot(previewData()!.snapshotJson) }}</pre>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class VersionHistoryComponent {
  private http = inject(HttpClient);
  
  scenarioId = input.required<string>();
  currentVersion = input<number>(1);
  onRestore = output<ScenarioVersion>();

  versions = signal<ScenarioVersion[]>([]);
  isLoading = signal<boolean>(false);
  error = signal<string | null>(null);
  previewData = signal<ScenarioVersion | null>(null);

  private baseUrl = `${environment.BASE_LOCAGUEST_API}/api/rentabilityscenarios`;

  ngOnInit() {
    this.loadVersions();
  }

  loadVersions() {
    this.isLoading.set(true);
    this.error.set(null);

    this.http.get<ScenarioVersion[]>(`${this.baseUrl}/${this.scenarioId()}/versions`)
      .subscribe({
        next: (versions) => {
          this.versions.set(versions);
          this.isLoading.set(false);
        },
        error: (err) => {
          this.error.set('Erreur lors du chargement des versions');
          this.isLoading.set(false);
          console.error('Error loading versions:', err);
        }
      });
  }

  confirmRestore(version: ScenarioVersion) {
    if (confirm(`Restaurer la version ${version.versionNumber} ?\n\n"${version.changeDescription}"\n\nL'état actuel sera sauvegardé comme nouvelle version.`)) {
      this.restoreVersion(version);
    }
  }

  restoreVersion(version: ScenarioVersion) {
    this.isLoading.set(true);

    this.http.post(`${this.baseUrl}/${this.scenarioId()}/versions/${version.id}/restore`, {})
      .subscribe({
        next: () => {
          this.isLoading.set(false);
          this.onRestore.emit(version);
          this.loadVersions(); // Reload to see new backup version
        },
        error: (err) => {
          this.error.set('Erreur lors de la restauration');
          this.isLoading.set(false);
          console.error('Error restoring version:', err);
        }
      });
  }

  previewVersion(version: ScenarioVersion) {
    this.previewData.set(version);
  }

  closePreview() {
    this.previewData.set(null);
  }

  formatSnapshot(json: string): string {
    try {
      return JSON.stringify(JSON.parse(json), null, 2);
    } catch {
      return json;
    }
  }
}
