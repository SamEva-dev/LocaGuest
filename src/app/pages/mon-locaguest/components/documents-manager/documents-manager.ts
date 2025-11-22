import { Component, input, signal, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { HttpClient, HttpEventType } from '@angular/common/http';

export interface TenantDocument {
  id?: string;
  tenantId: string;
  type: DocumentType;
  fileName: string;
  fileSize: number;
  uploadDate: Date;
  expiryDate?: Date;
  url?: string;
  description?: string;
}

export interface GenerateContractDto {
  tenantId: string;
  propertyId: string;
  contractType: DocumentType;
  startDate: string;
  endDate: string;
  rent: number;
  deposit?: number;
  charges?: number;
  additionalClauses?: string;
  isThirdPartyLandlord: boolean;
  landlordInfo?: {
    companyName?: string;
    firstName?: string;
    lastName?: string;
    address?: string;
    siret?: string;
    email?: string;
    phone?: string;
  };
}

export type DocumentType = 
  | 'CNI' 
  | 'PASSPORT' 
  | 'ASSURANCE' 
  | 'BAIL' 
  | 'AVENANT' 
  | 'ETAT_LIEUX_ENTREE' 
  | 'ETAT_LIEUX_SORTIE'
  | 'ATTESTATION_EMPLOI'
  | 'BULLETIN_SALAIRE'
  | 'AVIS_IMPOSITION'
  | 'OTHER';

interface DocumentTemplate {
  type: DocumentType;
  label: string;
  icon: string;
  color: string;
  requiresExpiry: boolean;
}

export interface TenantInfo {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  address?: string;
  propertyId?: string;
  propertyCode?: string;
  contracts?: any[];
}

@Component({
  selector: 'documents-manager',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  template: `
    <div class="space-y-6">
      <!-- Header Actions -->
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold">{{ 'DOCUMENTS.TITLE' | translate }}</h3>
        <div class="flex gap-2">
          <button
            (click)="showUploadModal.set(true)"
            class="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition flex items-center gap-2"
          >
            <i class="ph ph-upload-simple"></i>
            <span>{{ 'DOCUMENTS.UPLOAD' | translate }}</span>
          </button>
          <button
            (click)="showContractModal.set(true)"
            [disabled]="!hasActiveContract()"
            [title]="!hasActiveContract() ? 'Le locataire doit avoir un contrat actif' : ''"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <i class="ph ph-file-text"></i>
            <span>{{ 'DOCUMENTS.CREATE_CONTRACT' | translate }}</span>
          </button>
        </div>
      </div>

      <!-- Documents Grid by Category -->
      <div class="space-y-6">
        @for (category of documentCategories; track category.label) {
          @if (getDocumentsByType(category.type).length > 0 || category.showEmpty) {
            <div>
              <h4 class="text-sm font-medium text-slate-600 dark:text-slate-400 mb-3 flex items-center gap-2">
                <i [class]="'ph ' + category.icon"></i>
                {{ category.label }}
              </h4>
              <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                @for (doc of getDocumentsByType(category.type); track doc.id || doc.fileName) {
                  <div class="border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:shadow-md transition group">
                    <div class="flex items-start justify-between mb-2">
                      <div class="flex items-center gap-3">
                        <div [class]="'w-10 h-10 rounded-lg flex items-center justify-center ' + getDocumentColor(doc.type)">
                          <i [class]="'ph ' + getDocumentIcon(doc.type) + ' text-xl'"></i>
                        </div>
                        <div class="flex-1 min-w-0">
                          <p class="text-sm font-medium truncate">{{ doc.fileName }}</p>
                          <p class="text-xs text-slate-500">{{ formatFileSize(doc.fileSize) }}</p>
                        </div>
                      </div>
                      <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                        @if (doc.url) {
                          <button
                            (click)="downloadDocument(doc)"
                            class="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                            title="Télécharger"
                          >
                            <i class="ph ph-download text-slate-600 dark:text-slate-400"></i>
                          </button>
                        }
                        <button
                          (click)="deleteDocument(doc)"
                          class="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                          title="Supprimer"
                        >
                          <i class="ph ph-trash text-red-600"></i>
                        </button>
                      </div>
                    </div>
                    <div class="flex items-center justify-between text-xs">
                      <span class="text-slate-500">{{ doc.uploadDate | date:'dd/MM/yyyy' }}</span>
                      @if (doc.expiryDate) {
                        <span [class]="isExpiringSoon(doc.expiryDate) ? 'text-orange-600 font-medium' : 'text-slate-500'">
                          <i class="ph ph-clock"></i> {{ doc.expiryDate | date:'dd/MM/yyyy' }}
                        </span>
                      }
                    </div>
                    @if (doc.description) {
                      <p class="text-xs text-slate-500 mt-2">{{ doc.description }}</p>
                    }
                  </div>
                } @empty {
                  <div class="col-span-full text-center py-8 text-slate-400">
                    <i [class]="'ph ' + category.icon + ' text-4xl mb-2'"></i>
                    <p class="text-sm">Aucun document de type {{ category.label }}</p>
                  </div>
                }
              </div>
            </div>
          }
        }
      </div>

      <!-- Upload Modal -->
      @if (showUploadModal()) {
        <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div class="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-2xl w-full mx-4" (click)="$event.stopPropagation()">
            <div class="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
              <h3 class="text-xl font-bold">{{ 'DOCUMENTS.UPLOAD_NEW' | translate }}</h3>
              <button (click)="showUploadModal.set(false)" class="text-slate-400 hover:text-slate-600">
                <i class="ph ph-x text-2xl"></i>
              </button>
            </div>

            <div class="p-6 space-y-4">
              <!-- Document Type -->
              <div>
                <label class="block text-sm font-medium mb-2">Type de document *</label>
                <select
                  [(ngModel)]="uploadForm.type"
                  class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                  required
                >
                  <option value="">Sélectionner un type...</option>
                  @for (template of documentTemplates; track template.type) {
                    <option [value]="template.type">{{ template.label }}</option>
                  }
                </select>
              </div>

              <!-- File Upload -->
              <div>
                <label class="block text-sm font-medium mb-2">Fichier *</label>
                <div class="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-6">
                  <input
                    type="file"
                    #fileInput
                    (change)="onFileSelected($event)"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    class="hidden"
                  />
                  @if (!uploadForm.file) {
                    <button
                      type="button"
                      (click)="fileInput.click()"
                      class="w-full flex flex-col items-center justify-center text-center py-4"
                    >
                      <i class="ph ph-upload-simple text-4xl text-slate-400 mb-2"></i>
                      <p class="text-sm font-medium">Cliquez pour sélectionner un fichier</p>
                      <p class="text-xs text-slate-500 mt-1">PDF, Image, Word (Max 10MB)</p>
                    </button>
                  } @else {
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-3">
                        <i class="ph ph-file text-2xl text-emerald-600"></i>
                        <div>
                          <p class="text-sm font-medium">{{ uploadForm.file.name }}</p>
                          <p class="text-xs text-slate-500">{{ formatFileSize(uploadForm.file.size) }}</p>
                        </div>
                      </div>
                      <button
                        (click)="uploadForm.file = null"
                        class="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                      >
                        <i class="ph ph-x text-slate-600"></i>
                      </button>
                    </div>
                  }
                </div>
              </div>

              <!-- Expiry Date (if required) -->
              @if (requiresExpiryDate(uploadForm.type)) {
                <div>
                  <label class="block text-sm font-medium mb-2">Date d'expiration</label>
                  <input
                    type="date"
                    [(ngModel)]="uploadForm.expiryDate"
                    class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                  />
                </div>
              }

              <!-- Description -->
              <div>
                <label class="block text-sm font-medium mb-2">Description (optionnel)</label>
                <textarea
                  [(ngModel)]="uploadForm.description"
                  rows="3"
                  class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                  placeholder="Notes ou informations complémentaires..."
                ></textarea>
              </div>

              <!-- Upload Progress -->
              @if (uploadProgress() > 0 && uploadProgress() < 100) {
                <div class="space-y-2">
                  <div class="flex items-center justify-between text-sm">
                    <span>Upload en cours...</span>
                    <span>{{ uploadProgress() }}%</span>
                  </div>
                  <div class="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                    <div
                      class="bg-emerald-600 h-2 rounded-full transition-all"
                      [style.width.%]="uploadProgress()"
                    ></div>
                  </div>
                </div>
              }
            </div>

            <div class="flex items-center justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-700">
              <button
                (click)="showUploadModal.set(false)"
                class="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                Annuler
              </button>
              <button
                (click)="uploadDocument()"
                [disabled]="!canUpload() || uploading()"
                class="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                @if (uploading()) {
                  <i class="ph ph-spinner animate-spin mr-2"></i>
                }
                Uploader
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Contract Creation Modal -->
      @if (showContractModal()) {
        <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div class="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto" (click)="$event.stopPropagation()">
            <div class="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800">
              <h3 class="text-xl font-bold">Générer un contrat</h3>
              <button (click)="showContractModal.set(false)" class="text-slate-400 hover:text-slate-600">
                <i class="ph ph-x text-2xl"></i>
              </button>
            </div>

            <div class="p-6 space-y-4">
              <!-- Tenant & Property Info -->
              @if (tenantInfo() && getActiveContract()) {
                <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                  <h4 class="font-semibold mb-2 text-blue-900 dark:text-blue-100">Informations du contrat</h4>
                  <div class="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p class="text-blue-700 dark:text-blue-300">Locataire:</p>
                      <p class="font-medium">{{ tenantInfo()!.fullName }}</p>
                      <p class="text-xs text-blue-600">{{ tenantInfo()!.email }}</p>
                    </div>
                    <div>
                      <p class="text-blue-700 dark:text-blue-300">Bien:</p>
                      <p class="font-medium">{{ getActiveContract()!.propertyName || 'N/A' }}</p>
                      <p class="text-xs text-blue-600">Loyer actuel: {{ getActiveContract()!.rent }}€</p>
                    </div>
                  </div>
                </div>
              }

              <!-- Contract Type -->
              <div>
                <label class="block text-sm font-medium mb-2">Type de contrat *</label>
                <div class="grid grid-cols-2 gap-3">
                  @for (cType of contractTypes; track cType.value) {
                    <button
                      type="button"
                      (click)="contractForm.type = cType.value"
                      [class.ring-2]="contractForm.type === cType.value"
                      [class.ring-blue-500]="contractForm.type === cType.value"
                      [class.bg-blue-50]="contractForm.type === cType.value"
                      class="p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition text-left"
                    >
                      <i [class]="'ph ' + cType.icon + ' text-2xl mb-2'"></i>
                      <p class="font-medium">{{ cType.label }}</p>
                      <p class="text-xs text-slate-500">{{ cType.description }}</p>
                    </button>
                  }
                </div>
              </div>

              <!-- Landlord Selection -->
              <div class="border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-slate-50 dark:bg-slate-800/50">
                <label class="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    [(ngModel)]="contractForm.isThirdPartyLandlord"
                    class="w-4 h-4 text-blue-600 rounded"
                  />
                  <div>
                    <p class="font-medium">Le bailleur est une tierce personne ou société</p>
                    <p class="text-xs text-slate-500">Cochez si le bailleur n'est pas l'utilisateur actuel (ex: société immobilière)</p>
                  </div>
                </label>
              </div>

              <!-- Third Party Landlord Info -->
              @if (contractForm.isThirdPartyLandlord) {
                <div class="border border-orange-200 dark:border-orange-800 rounded-lg p-4 bg-orange-50 dark:bg-orange-900/20 space-y-3">
                  <h4 class="font-semibold text-orange-900 dark:text-orange-100 flex items-center gap-2">
                    <i class="ph ph-buildings"></i>
                    Informations du bailleur
                  </h4>
                  
                  <div>
                    <label class="block text-sm font-medium mb-1">Raison sociale / Nom de la société</label>
                    <input
                      type="text"
                      [(ngModel)]="contractForm.landlordCompanyName"
                      placeholder="Ex: SCI Immobilière du Centre"
                      class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                    />
                  </div>

                  <div class="grid grid-cols-2 gap-3">
                    <div>
                      <label class="block text-sm font-medium mb-1">Prénom du représentant</label>
                      <input
                        type="text"
                        [(ngModel)]="contractForm.landlordFirstName"
                        placeholder="Ex: Marie"
                        class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                      />
                    </div>
                    <div>
                      <label class="block text-sm font-medium mb-1">Nom du représentant</label>
                      <input
                        type="text"
                        [(ngModel)]="contractForm.landlordLastName"
                        placeholder="Ex: Durand"
                        class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                      />
                    </div>
                  </div>

                  <div>
                    <label class="block text-sm font-medium mb-1">Adresse du bailleur</label>
                    <input
                      type="text"
                      [(ngModel)]="contractForm.landlordAddress"
                      placeholder="Adresse complète"
                      class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                    />
                  </div>

                  <div class="grid grid-cols-2 gap-3">
                    <div>
                      <label class="block text-sm font-medium mb-1">SIRET (optionnel)</label>
                      <input
                        type="text"
                        [(ngModel)]="contractForm.landlordSiret"
                        placeholder="XXX XXX XXX XXXXX"
                        maxlength="14"
                        class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                      />
                    </div>
                    <div>
                      <label class="block text-sm font-medium mb-1">Email</label>
                      <input
                        type="email"
                        [(ngModel)]="contractForm.landlordEmail"
                        placeholder="contact@sci.fr"
                        class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                      />
                    </div>
                  </div>

                  <div>
                    <label class="block text-sm font-medium mb-1">Téléphone</label>
                    <input
                      type="tel"
                      [(ngModel)]="contractForm.landlordPhone"
                      placeholder="+33 X XX XX XX XX"
                      class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                    />
                  </div>
                </div>
              }

              <!-- Date Range -->
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium mb-2">Date de début *</label>
                  <input
                    type="date"
                    [(ngModel)]="contractForm.startDate"
                    class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                    required
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium mb-2">Date de fin *</label>
                  <input
                    type="date"
                    [(ngModel)]="contractForm.endDate"
                    class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                    required
                  />
                </div>
              </div>

              <!-- Rent, Deposit & Charges -->
              <div class="grid grid-cols-3 gap-4">
                <div>
                  <label class="block text-sm font-medium mb-2">Loyer mensuel (€) *</label>
                  <input
                    type="number"
                    [(ngModel)]="contractForm.rent"
                    min="0"
                    step="0.01"
                    class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                    required
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium mb-2">Charges (€)</label>
                  <input
                    type="number"
                    [(ngModel)]="contractForm.charges"
                    min="0"
                    step="0.01"
                    class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium mb-2">Dépôt de garantie (€)</label>
                  <input
                    type="number"
                    [(ngModel)]="contractForm.deposit"
                    min="0"
                    step="0.01"
                    class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                  />
                </div>
              </div>

              <!-- Additional Clauses -->
              <div>
                <label class="block text-sm font-medium mb-2">Clauses particulières (optionnel)</label>
                <textarea
                  [(ngModel)]="contractForm.additionalClauses"
                  rows="4"
                  class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                  placeholder="Ajoutez des clauses spécifiques au contrat..."
                ></textarea>
              </div>
            </div>

            <div class="flex items-center justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-700 sticky bottom-0 bg-white dark:bg-slate-800">
              <button
                (click)="showContractModal.set(false)"
                class="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                Annuler
              </button>
              <button
                (click)="generateContract()"
                [disabled]="!canGenerateContract()"
                class="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <i class="ph ph-file-text"></i>
                Générer le contrat PDF
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: []
})
export class DocumentsManager {
  private http = inject(HttpClient);
  
  tenantId = input.required<string>();
  tenantInfo = input<TenantInfo | null>(null);
  documents = signal<TenantDocument[]>([]);
  
  showUploadModal = signal(false);
  showContractModal = signal(false);
  uploading = signal(false);
  uploadProgress = signal(0);

  uploadForm = {
    type: '' as DocumentType | '',
    file: null as File | null,
    expiryDate: '',
    description: ''
  };

  contractForm = {
    type: 'BAIL' as DocumentType,
    startDate: '',
    endDate: '',
    rent: 0,
    deposit: 0,
    charges: 0,
    additionalClauses: '',
    isThirdPartyLandlord: false,
    landlordCompanyName: '',
    landlordFirstName: '',
    landlordLastName: '',
    landlordAddress: '',
    landlordSiret: '',
    landlordEmail: '',
    landlordPhone: ''
  };

  documentTemplates: DocumentTemplate[] = [
    { type: 'CNI', label: 'Carte d\'identité', icon: 'ph-identification-card', color: 'bg-blue-100 text-blue-600', requiresExpiry: true },
    { type: 'PASSPORT', label: 'Passeport', icon: 'ph-identification-badge', color: 'bg-indigo-100 text-indigo-600', requiresExpiry: true },
    { type: 'ASSURANCE', label: 'Assurance habitation', icon: 'ph-shield-check', color: 'bg-emerald-100 text-emerald-600', requiresExpiry: true },
    { type: 'BAIL', label: 'Bail de location', icon: 'ph-file-text', color: 'bg-purple-100 text-purple-600', requiresExpiry: false },
    { type: 'AVENANT', label: 'Avenant au bail', icon: 'ph-file-plus', color: 'bg-violet-100 text-violet-600', requiresExpiry: false },
    { type: 'ETAT_LIEUX_ENTREE', label: 'État des lieux d\'entrée', icon: 'ph-clipboard-text', color: 'bg-teal-100 text-teal-600', requiresExpiry: false },
    { type: 'ETAT_LIEUX_SORTIE', label: 'État des lieux de sortie', icon: 'ph-clipboard', color: 'bg-cyan-100 text-cyan-600', requiresExpiry: false },
    { type: 'ATTESTATION_EMPLOI', label: 'Attestation d\'emploi', icon: 'ph-briefcase', color: 'bg-amber-100 text-amber-600', requiresExpiry: false },
    { type: 'BULLETIN_SALAIRE', label: 'Bulletin de salaire', icon: 'ph-currency-eur', color: 'bg-lime-100 text-lime-600', requiresExpiry: false },
    { type: 'AVIS_IMPOSITION', label: 'Avis d\'imposition', icon: 'ph-receipt', color: 'bg-orange-100 text-orange-600', requiresExpiry: false },
    { type: 'OTHER', label: 'Autre document', icon: 'ph-file', color: 'bg-slate-100 text-slate-600', requiresExpiry: false }
  ];

  documentCategories = [
    { type: ['CNI', 'PASSPORT'], label: 'Identité', icon: 'ph-identification-card', showEmpty: true },
    { type: ['ASSURANCE'], label: 'Assurances', icon: 'ph-shield-check', showEmpty: true },
    { type: ['BAIL', 'AVENANT'], label: 'Contrats', icon: 'ph-file-text', showEmpty: true },
    { type: ['ETAT_LIEUX_ENTREE', 'ETAT_LIEUX_SORTIE'], label: 'États des lieux', icon: 'ph-clipboard-text', showEmpty: false },
    { type: ['ATTESTATION_EMPLOI', 'BULLETIN_SALAIRE', 'AVIS_IMPOSITION'], label: 'Documents financiers', icon: 'ph-currency-eur', showEmpty: false },
    { type: ['OTHER'], label: 'Autres', icon: 'ph-folder', showEmpty: false }
  ];

  contractTypes: Array<{value: DocumentType, label: string, icon: string, description: string}> = [
    { value: 'BAIL' as DocumentType, label: 'Bail de location', icon: 'ph-house', description: 'Contrat de location principal' },
    { value: 'AVENANT' as DocumentType, label: 'Avenant', icon: 'ph-file-plus', description: 'Modification du contrat existant' },
    { value: 'ETAT_LIEUX_ENTREE' as DocumentType, label: 'État des lieux d\'entrée', icon: 'ph-clipboard-text', description: 'Constat d\'entrée dans le logement' },
    { value: 'ETAT_LIEUX_SORTIE' as DocumentType, label: 'État des lieux de sortie', icon: 'ph-clipboard', description: 'Constat de sortie du logement' }
  ];

  constructor() {
    // Load documents when tenantId is available
    effect(() => {
      const id = this.tenantId();
      if (id) {
        this.loadDocuments();
      }
    });

    // Debug tenant info and contracts
    effect(() => {
      const info = this.tenantInfo();
      console.log('📊 TenantInfo updated:', {
        tenant: info?.fullName,
        contracts: info?.contracts?.length || 0,
        hasActiveContract: this.hasActiveContract()
      });
    });
  }

  loadDocuments() {
    const id = this.tenantId();
    if (!id) return;

    // TODO: Call API to load tenant documents
    // For now, using mock data
    this.documents.set([
      {
        id: '1',
        tenantId: id,
        type: 'CNI',
        fileName: 'CNI_Dupont_Jean.pdf',
        fileSize: 1024000,
        uploadDate: new Date('2024-01-15'),
        expiryDate: new Date('2029-12-31'),
        url: '/api/documents/1'
      }
    ]);
  }

  getDocumentsByType(types: string[] | DocumentType[]): TenantDocument[] {
    return this.documents().filter(doc => types.includes(doc.type));
  }

  getDocumentIcon(type: DocumentType): string {
    return this.documentTemplates.find(t => t.type === type)?.icon || 'ph-file';
  }

  getDocumentColor(type: DocumentType): string {
    return this.documentTemplates.find(t => t.type === type)?.color || 'bg-slate-100 text-slate-600';
  }

  requiresExpiryDate(type: DocumentType | ''): boolean {
    if (!type) return false;
    return this.documentTemplates.find(t => t.type === type)?.requiresExpiry || false;
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  isExpiringSoon(expiryDate: Date): boolean {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    return new Date(expiryDate) <= thirtyDaysFromNow;
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      if (file.size > 10 * 1024 * 1024) {
        alert('Le fichier ne doit pas dépasser 10MB');
        return;
      }
      this.uploadForm.file = file;
    }
  }

  canUpload(): boolean {
    return !!(this.uploadForm.type && this.uploadForm.file);
  }

  uploadDocument() {
    if (!this.canUpload()) return;

    this.uploading.set(true);
    this.uploadProgress.set(0);

    const formData = new FormData();
    formData.append('file', this.uploadForm.file!);
    formData.append('tenantId', this.tenantId());
    formData.append('type', this.uploadForm.type as string);
    if (this.uploadForm.expiryDate) {
      formData.append('expiryDate', this.uploadForm.expiryDate);
    }
    if (this.uploadForm.description) {
      formData.append('description', this.uploadForm.description);
    }

    // TODO: Replace with actual API call
    this.http.post(`https://localhost:5001/api/documents/upload`, formData, {
      reportProgress: true,
      observe: 'events'
    }).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          this.uploadProgress.set(Math.round(100 * event.loaded / event.total));
        } else if (event.type === HttpEventType.Response) {
          console.log('✅ Document uploaded:', event.body);
          this.uploading.set(false);
          this.uploadProgress.set(100);
          this.showUploadModal.set(false);
          this.resetUploadForm();
          this.loadDocuments();
        }
      },
      error: (err) => {
        console.error('❌ Upload error:', err);
        this.uploading.set(false);
        this.uploadProgress.set(0);
        alert('Erreur lors de l\'upload du document');
      }
    });
  }

  resetUploadForm() {
    this.uploadForm = {
      type: '',
      file: null,
      expiryDate: '',
      description: ''
    };
    this.uploadProgress.set(0);
  }

  hasActiveContract(): boolean {
    const tenant = this.tenantInfo();
    console.log("📊 Checking association:", {
      tenant: tenant?.fullName,
      propertyId: tenant?.propertyId,
      propertyCode: tenant?.propertyCode,
      hasAssociation: !!(tenant?.propertyId)
    });
    
    // ✅ Vérifier l'association Tenant ↔ Property au lieu du contrat
    return !!(tenant?.propertyId);
  }

  getActiveContract(): any | null {
    const tenant = this.tenantInfo();
    if (!tenant?.propertyId) {
      return null;
    }
    // Retourner un objet simulé avec le propertyId pour la génération de contrat
    return {
      propertyId: tenant.propertyId,
      propertyCode: tenant.propertyCode
    };
  }

  canGenerateContract(): boolean {
    const basicValidation = !!(
      this.contractForm.type &&
      this.contractForm.startDate &&
      this.contractForm.endDate &&
      this.contractForm.rent > 0
    );

    // If third party landlord, validate landlord info
    if (this.contractForm.isThirdPartyLandlord) {
      const hasLandlordInfo = !!(
        (this.contractForm.landlordCompanyName || (this.contractForm.landlordFirstName && this.contractForm.landlordLastName)) &&
        this.contractForm.landlordAddress
      );
      return basicValidation && hasLandlordInfo;
    }

    return basicValidation;
  }

  generateContract() {
    if (!this.canGenerateContract()) {
      alert('Veuillez remplir tous les champs requis');
      return;
    }

    const activeContract = this.getActiveContract();
    if (!activeContract || !activeContract.propertyId) {
      alert('Impossible de trouver le bien associé au locataire');
      return;
    }

    const dto: GenerateContractDto = {
      tenantId: this.tenantId(),
      propertyId: activeContract.propertyId,
      contractType: this.contractForm.type,
      startDate: this.contractForm.startDate,
      endDate: this.contractForm.endDate,
      rent: this.contractForm.rent,
      deposit: this.contractForm.deposit || undefined,
      charges: this.contractForm.charges || undefined,
      additionalClauses: this.contractForm.additionalClauses || undefined,
      isThirdPartyLandlord: this.contractForm.isThirdPartyLandlord
    };

    // Add landlord info if third party
    if (this.contractForm.isThirdPartyLandlord) {
      dto.landlordInfo = {
        companyName: this.contractForm.landlordCompanyName || undefined,
        firstName: this.contractForm.landlordFirstName || undefined,
        lastName: this.contractForm.landlordLastName || undefined,
        address: this.contractForm.landlordAddress || undefined,
        siret: this.contractForm.landlordSiret || undefined,
        email: this.contractForm.landlordEmail || undefined,
        phone: this.contractForm.landlordPhone || undefined
      };
    }

    console.log('📄 Generating contract with full DTO:', dto);
    
    // Call API to generate contract PDF
    this.http.post(`https://localhost:5001/api/documents/generate-contract`, dto, {
      responseType: 'blob',
      observe: 'response'
    }).subscribe({
      next: (response) => {
        // Download the PDF
        const blob = response.body;
        if (blob) {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `Contrat_${this.contractForm.type}_${new Date().toISOString().split('T')[0]}.pdf`;
          link.click();
          window.URL.revokeObjectURL(url);
          
          console.log('✅ Contract generated successfully');
          alert('Contrat généré avec succès !');
          this.showContractModal.set(false);
          
          // Reload documents
          this.loadDocuments();
        }
      },
      error: (err) => {
        console.error('❌ Error generating contract:', err);
        const errorMsg = err?.error?.message || 'Erreur lors de la génération du contrat';
        alert(`Erreur: ${errorMsg}`);
      }
    });
  }

  downloadDocument(doc: TenantDocument) {
    if (doc.url) {
      window.open(doc.url, '_blank');
    }
  }

  deleteDocument(doc: TenantDocument) {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${doc.fileName} ?`)) return;

    // TODO: Call API to delete document
    this.documents.set(this.documents().filter(d => d.id !== doc.id));
    console.log('🗑️ Document deleted:', doc.fileName);
  }
}
