import { Component, input, signal, computed, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DocumentsApi, ContractDocumentsStatusDto } from '../../../../core/api/documents.api';
import { RequiredDocumentDto, DocumentStatus } from '../../../../core/models/documents.models';

@Component({
  selector: 'app-contract-documents-status',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="contract-documents-card bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <i class="ph ph-files text-blue-500"></i>
          Documents du Contrat
        </h3>
        
        @if (allSigned()) {
          <span class="px-3 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-sm font-medium">
            <i class="ph ph-check-circle mr-1"></i>
            Tous signés
          </span>
        }
      </div>

      @if (isLoading()) {
        <div class="flex items-center justify-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      } @else if (error()) {
        <div class="text-center py-8 text-slate-500">
          <i class="ph ph-warning-circle text-3xl mb-2"></i>
          <p>{{ error() }}</p>
        </div>
      } @else {
        <div class="space-y-3">
          @for (doc of requiredDocuments(); track doc.type) {
            <div class="document-item border border-slate-200 dark:border-slate-700 rounded-lg p-4 transition-all"
                 [class.border-green-300]="doc.isSigned"
                 [class.bg-green-50]="doc.isSigned"
                 [class.dark:bg-green-900/10]="doc.isSigned">
              <div class="flex items-center gap-3">
                <!-- Icon -->
                <div class="flex-shrink-0">
                  @if (doc.isSigned) {
                    <i class="ph-fill ph-seal-check text-2xl text-green-500"></i>
                  } @else if (doc.isProvided) {
                    <i class="ph ph-file-dashed text-2xl text-amber-500"></i>
                  } @else {
                    <i class="ph ph-file text-2xl text-slate-400"></i>
                  }
                </div>

                <!-- Document Info -->
                <div class="flex-1">
                  <div class="flex items-center gap-2">
                    <span class="font-medium text-slate-900 dark:text-white">
                      {{ getDocumentLabel(doc.type) }}
                    </span>
                    @if (doc.isRequired) {
                      <span class="text-xs px-2 py-0.5 rounded bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                        Requis
                      </span>
                    }
                  </div>
                  
                  @if (doc.documentInfo) {
                    <div class="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      {{ doc.documentInfo.fileName }}
                      @if (doc.documentInfo.signedDate) {
                        <span class="ml-2">• Signé le {{ doc.documentInfo.signedDate | date:'short' }}</span>
                      }
                    </div>
                  }
                </div>

                <!-- Status & Actions -->
                <div class="flex-shrink-0">
                  @if (doc.isSigned) {
                    <span class="px-3 py-1.5 rounded-lg bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-sm font-medium">
                      <i class="ph ph-check mr-1"></i>Signé
                    </span>
                  } @else if (doc.isProvided && doc.documentInfo) {
                    <button
                      (click)="markDocumentAsSigned(doc)"
                      class="px-3 py-1.5 text-sm rounded-lg border border-blue-300 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition"
                      title="Signaler comme signé">
                      <i class="ph ph-seal-check mr-1"></i>Signaler comme signé
                    </button>
                  } @else {
                    <span class="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 text-sm">
                      Non fourni
                    </span>
                  }
                </div>
              </div>
            </div>
          }
        </div>

        <!-- Progress Bar -->
        <div class="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
          <div class="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400 mb-2">
            <span>Progression de signature</span>
            <span class="font-medium">{{ signedCount() }} / {{ totalRequired() }}</span>
          </div>
          <div class="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
            <div 
              class="h-2.5 rounded-full transition-all duration-300"
              [class.bg-green-500]="allSigned()"
              [class.bg-blue-500]="!allSigned()"
              [style.width.%]="signatureProgress()">
            </div>
          </div>
        </div>

        <!-- Success Message -->
        @if (allSigned()) {
          <div class="mt-4 p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
            <div class="flex items-start gap-3">
              <i class="ph-fill ph-check-circle text-2xl text-green-500 mt-0.5"></i>
              <div class="flex-1">
                <h4 class="font-semibold text-green-900 dark:text-green-100">
                  Tous les documents requis sont signés !
                </h4>
                <p class="text-sm text-green-700 dark:text-green-300 mt-1">
                  Le contrat est maintenant <strong>{{ contractStatus() }}</strong> et prêt à être activé.
                </p>
              </div>
            </div>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .document-item {
      &:hover {
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }
    }
  `]
})
export class ContractDocumentsStatusComponent {
  // Inputs
  contractId = input.required<string>();

  // Injects
  private documentsApi = inject(DocumentsApi);

  // Signals
  isLoading = signal(false);
  error = signal<string | null>(null);
  status = signal<ContractDocumentsStatusDto | null>(null);
  requiredDocuments = computed(() => this.status()?.requiredDocuments || []);
  contractStatus = computed(() => this.status()?.contractStatus || 'Unknown');
  
  signedCount = computed(() => 
    this.requiredDocuments().filter(d => d.isSigned).length
  );
  
  totalRequired = computed(() => 
    this.requiredDocuments().filter(d => d.isRequired).length
  );
  
  signatureProgress = computed(() => {
    const total = this.totalRequired();
    return total > 0 ? (this.signedCount() / total) * 100 : 0;
  });
  
  allSigned = computed(() => 
    this.totalRequired() > 0 && this.signedCount() === this.totalRequired()
  );

  constructor() {
    // Auto-load when contractId changes
    effect(() => {
      const id = this.contractId();
      if (id) {
        this.loadDocumentStatus();
      }
    }, { allowSignalWrites: true });
  }

  loadDocumentStatus() {
    const id = this.contractId();
    if (!id) return;

    this.isLoading.set(true);
    this.error.set(null);

    this.documentsApi.getContractDocumentsStatus(id).subscribe({
      next: (status) => {
        this.status.set(status);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('❌ Error loading contract documents status:', err);
        this.error.set('Erreur lors du chargement des documents');
        this.isLoading.set(false);
      }
    });
  }

  markDocumentAsSigned(doc: RequiredDocumentDto) {
    if (!doc.documentInfo?.id) {
      alert('⚠️ Document non trouvé');
      return;
    }

    if (!confirm(`Confirmer que le document "${this.getDocumentLabel(doc.type)}" a été signé ?`)) {
      return;
    }

    const request = {
      signedDate: new Date().toISOString().split('T')[0],
      signedBy: 'Propriétaire' // TODO: Get from user context
    };

    this.documentsApi.markDocumentAsSigned(doc.documentInfo.id, request).subscribe({
      next: () => {
        alert('✅ Document marqué comme signé avec succès !');
        // Reload status
        this.loadDocumentStatus();
      },
      error: (err) => {
        console.error('❌ Error marking document as signed:', err);
        alert('❌ Erreur lors de la signature du document');
      }
    });
  }

  getDocumentLabel(type: string): string {
    const labels: Record<string, string> = {
      'Bail': '📄 Bail de location',
      'EtatDesLieuxEntree': '🏠 État des lieux d\'entrée',
      'Assurance': '🛡️ Attestation d\'assurance',
      'Avenant': '📝 Avenant au bail'
    };
    return labels[type] || type;
  }
}
