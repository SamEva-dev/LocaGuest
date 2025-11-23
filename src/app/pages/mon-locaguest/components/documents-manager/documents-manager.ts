import { Component, input, signal, inject, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { HttpClient, HttpEventType } from '@angular/common/http';
import { DocumentsApi, DocumentDto } from '../../../../core/api/documents.api';
import { TenantsApi } from '../../../../core/api/tenants.api';
import { Contract } from '../../../../core/api/properties.api';

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
      <!-- Loading State -->
      @if (isLoading()) {
        <div class="flex items-center justify-center py-12">
          <div class="flex flex-col items-center gap-3">
            <div class="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
            <p class="text-sm text-slate-600 dark:text-slate-400">Chargement des documents...</p>
          </div>
        </div>
      }
      
      <!-- Header Actions -->
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold">{{ 'DOCUMENTS.TITLE' | translate }}</h3>
        <div class="flex gap-2">
          <button
            (click)="exportAllDocuments()"
            [disabled]="documents().length === 0"
            class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Exporter tous les documents en ZIP"
          >
            <i class="ph ph-download-simple"></i>
            <span>Export ZIP</span>
          </button>
          <button
            (click)="showUploadModal.set(true)"
            class="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition flex items-center gap-2"
          >
            <i class="ph ph-upload-simple"></i>
            <span>{{ 'DOCUMENTS.UPLOAD' | translate }}</span>
          </button>
          <button
            (click)="openContractModal()"
            [disabled]="!hasActiveContract()"
            [title]="!hasActiveContract() ? 'Le locataire doit avoir un contrat actif' : ''"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <i class="ph ph-file-text"></i>
            <span>{{ 'DOCUMENTS.CREATE_CONTRACT' | translate }}</span>
          </button>
        </div>
      </div>

      <!-- Search & Filter -->
      @if (!isLoading()) {
        <div class="flex items-center gap-3">
          <div class="flex-1 relative">
            <i class="ph ph-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
            <input
              type="text"
              [(ngModel)]="searchQuery"
              (input)="onSearchChange()"
              placeholder="Rechercher un document..."
              class="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
            />
          </div>
          <select
            [(ngModel)]="selectedCategory"
            (change)="onCategoryChange()"
            class="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
          >
            <option value="">Toutes les catégories</option>
            @for (cat of documentCategories; track cat.label) {
              <option [value]="cat.label">{{ cat.label }}</option>
            }
          </select>
        </div>
      }
      
      <!-- Documents Grid by Category -->
      @if (!isLoading()) {
        <div class="space-y-6">
          @for (category of documentCategories; track category.label) {
            @if (getFilteredDocumentsByType(category.type).length > 0 || category.showEmpty) {
              <div>
                <h4 class="text-sm font-medium text-slate-600 dark:text-slate-400 mb-3 flex items-center gap-2">
                  <i [class]="'ph ' + category.icon"></i>
                  {{ category.label }}
                </h4>
                <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  @for (doc of getFilteredDocumentsByType(category.type); track doc.id || doc.fileName) {
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
      }

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
                    <option 
                      [value]="template.type"
                      [disabled]="!canUploadDocumentType(template.type)"
                      [class.text-slate-400]="!canUploadDocumentType(template.type)"
                    >
                      {{ template.label }}
                      @if (!canUploadDocumentType(template.type)) {
                        (Déjà existant)
                      }
                    </option>
                  }
                </select>
                @if (showUniqueDocumentWarning()) {
                  <p class="text-sm text-amber-600 mt-1 flex items-start gap-2">
                    <i class="ph ph-warning-circle"></i>
                    <span>Ce type de document existe déjà pour ce locataire. Un seul document de ce type est autorisé.</span>
                  </p>
                }
              </div>

              <!-- File Upload with Drag & Drop -->
              <div>
                <label class="block text-sm font-medium mb-2">Fichier *</label>
                <div 
                  class="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-6 transition"
                  [class.border-emerald-500]="isDragging()"
                  [class.bg-emerald-50]="isDragging()"
                  (dragover)="onDragOver($event)"
                  (dragleave)="onDragLeave($event)"
                  (drop)="onDrop($event)"
                >
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
                      <p class="text-sm font-medium">{{ isDragging() ? 'Déposez le fichier ici' : 'Cliquez ou glissez un fichier' }}</p>
                      <p class="text-xs text-slate-500 mt-1">PDF, Image, Word (Max 10MB)</p>
                    </button>
                  } @else {
                    <div class="space-y-3">
                      <!-- Preview for PDF/Images -->
                      @if (filePreviewUrl()) {
                        <div class="flex justify-center">
                          @if (uploadForm.file.type.includes('pdf')) {
                            <div class="w-32 h-40 border border-slate-300 rounded-lg flex items-center justify-center bg-slate-50">
                              <i class="ph ph-file-pdf text-6xl text-red-600"></i>
                            </div>
                          } @else {
                            <img [src]="filePreviewUrl()" class="max-h-40 rounded-lg" alt="Preview" />
                          }
                        </div>
                      }
                      
                      <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                          <i class="ph ph-file text-2xl text-emerald-600"></i>
                          <div>
                            <p class="text-sm font-medium">{{ uploadForm.file.name }}</p>
                            <p class="text-xs text-slate-500">{{ formatFileSize(uploadForm.file.size) }}</p>
                          </div>
                        </div>
                        <button
                          (click)="clearFile()"
                          class="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                        >
                          <i class="ph ph-x text-slate-600"></i>
                        </button>
                      </div>
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
                      (click)="contractFormType.set(cType.value); allowEditContractFields.set(false);"
                      [class.ring-2]="contractFormType() === cType.value"
                      [class.ring-blue-500]="contractFormType() === cType.value"
                      [class.bg-blue-50]="contractFormType() === cType.value"
                      class="p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition text-left"
                    >
                      <i [class]="'ph ' + cType.icon + ' text-2xl mb-2'"></i>
                      <p class="font-medium">{{ cType.label }}</p>
                      <p class="text-xs text-slate-500">{{ cType.description }}</p>
                    </button>
                  }
                </div>
              </div>

              <!-- Checkbox to allow editing protected fields -->
              @if (['BAIL', 'ETAT_LIEUX_ENTREE', 'ETAT_LIEUX_SORTIE'].includes(contractFormType())) {
                <div class="border border-blue-200 dark:border-blue-800 rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20">
                  <label class="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      [(ngModel)]="allowEditContractFields"
                      [checked]="allowEditContractFields()"
                      (change)="allowEditContractFields.set(!allowEditContractFields())"
                      class="w-4 h-4 text-blue-600 rounded"
                    />
                    <div>
                      <p class="font-medium text-blue-900 dark:text-blue-100">
                        <i class="ph ph-pencil mr-2"></i>
                        Autoriser la modification des champs du contrat
                      </p>
                      <p class="text-xs text-blue-700 dark:text-blue-300">
                        Les champs pré-remplis depuis le contrat actif sont en lecture seule par défaut. Cochez pour les modifier.
                      </p>
                    </div>
                  </label>
                </div>
              }

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
                  <label class="block text-sm font-medium mb-2">
                    Date de début *
                    @if (isContractFieldsReadonly()) {
                      <span class="text-xs text-blue-600">(depuis contrat actif)</span>
                    }
                  </label>
                  <input
                    type="date"
                    [(ngModel)]="contractForm.startDate"
                    [readonly]="isContractFieldsReadonly()"
                    [class.bg-slate-100]="isContractFieldsReadonly()"
                    [class.cursor-not-allowed]="isContractFieldsReadonly()"
                    class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                    required
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium mb-2">
                    Date de fin *
                    @if (isContractFieldsReadonly()) {
                      <span class="text-xs text-blue-600">(depuis contrat actif)</span>
                    }
                  </label>
                  <input
                    type="date"
                    [(ngModel)]="contractForm.endDate"
                    [readonly]="isContractFieldsReadonly()"
                    [class.bg-slate-100]="isContractFieldsReadonly()"
                    [class.cursor-not-allowed]="isContractFieldsReadonly()"
                    class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                    required
                  />
                </div>
              </div>

              <!-- Rent, Deposit & Charges -->
              <div class="grid grid-cols-3 gap-4">
                <div>
                  <label class="block text-sm font-medium mb-2">
                    Loyer mensuel (€) *
                    @if (isContractFieldsReadonly()) {
                      <span class="text-xs text-blue-600">(depuis contrat actif)</span>
                    }
                  </label>
                  <input
                    type="number"
                    [(ngModel)]="contractForm.rent"
                    [readonly]="isContractFieldsReadonly()"
                    [class.bg-slate-100]="isContractFieldsReadonly()"
                    [class.cursor-not-allowed]="isContractFieldsReadonly()"
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
                  <label class="block text-sm font-medium mb-2">
                    Dépôt de garantie (€)
                    @if (isContractFieldsReadonly()) {
                      <span class="text-xs text-blue-600">(depuis contrat actif)</span>
                    }
                  </label>
                  <input
                    type="number"
                    [(ngModel)]="contractForm.deposit"
                    [readonly]="isContractFieldsReadonly()"
                    [class.bg-slate-100]="isContractFieldsReadonly()"
                    [class.cursor-not-allowed]="isContractFieldsReadonly()"
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
export class DocumentsManagerComponent {
  tenantInfo = input.required<TenantInfo>();
  private http = inject(HttpClient);
  private documentsApi = inject(DocumentsApi);
  private tenantsApi = inject(TenantsApi);
  
  // Documents from API
  realDocuments = signal<DocumentDto[]>([]);
  isLoading = signal(false);
  
  // Search & Filter
  searchQuery = signal('');
  selectedCategory = signal('');
  filteredDocuments = computed(() => {
    let docs = this.documents();
    
    // Filter by search query
    if (this.searchQuery()) {
      const query = this.searchQuery().toLowerCase();
      docs = docs.filter(d => 
        d.fileName.toLowerCase().includes(query) ||
        d.description?.toLowerCase().includes(query)
      );
    }
    
    // Filter by category
    if (this.selectedCategory()) {
      const categoryTypes = this.documentCategories
        .find(c => c.label === this.selectedCategory())?.type || [];
      docs = docs.filter(d => categoryTypes.includes(d.type));
    }
    
    return docs;
  });
  
  tenantId = input.required<string>();
  // Mock documents for demo - will be replaced with real API calls
  documents = signal<TenantDocument[]>([]);
  
  showUploadModal = signal(false);
  showContractModal = signal(false);
  uploading = signal(false);
  uploadProgress = signal(0);
  
  // File preview
  filePreviewUrl = signal<string | null>(null);
  isDragging = signal(false);

  uploadForm = {
    type: '' as DocumentType | '',
    file: null as File | null,
    expiryDate: '',
    description: ''
  };

  // Signal pour le type de contrat (réactif)
  contractFormType = signal<DocumentType>('BAIL');

  // Signal pour la checkbox "Modifier"
  allowEditContractFields = signal<boolean>(false);

  contractForm = {
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

  // Computed: Les champs sont en lecture seule si type = BAIL, ETAT_LIEUX_ENTREE ou ETAT_LIEUX_SORTIE ET que la checkbox n'est pas cochée
  isContractFieldsReadonly = computed(() => {
    const protectedTypes: DocumentType[] = ['BAIL', 'ETAT_LIEUX_ENTREE', 'ETAT_LIEUX_SORTIE'];
    return protectedTypes.includes(this.contractFormType()) && !this.allowEditContractFields();
  });

  // Types de documents uniques (1 seul par locataire)
  uniqueDocumentTypes: DocumentType[] = ['BAIL', 'ETAT_LIEUX_ENTREE', 'ETAT_LIEUX_SORTIE'];

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

    this.isLoading.set(true);
    
    // Load from API
    this.documentsApi.getTenantDocuments(id).subscribe({
      next: (docs) => {
        this.realDocuments.set(docs);
        
        // Convert API documents to TenantDocument format for existing UI
        const converted: TenantDocument[] = docs.map(doc => ({
          id: doc.id,
          tenantId: id,
          type: this.mapCategoryToType(doc.category, doc.type),
          fileName: doc.fileName,
          fileSize: doc.fileSizeBytes,
          uploadDate: new Date(doc.createdAt),
          expiryDate: doc.expiryDate ? new Date(doc.expiryDate) : undefined,
          url: `/api/documents/download/${doc.id}`,
          description: doc.description
        }));
        
        this.documents.set(converted);
        this.isLoading.set(false);
        console.log('✅ Documents loaded:', converted.length);
      },
      error: (err) => {
        console.error('❌ Error loading documents:', err);
        this.isLoading.set(false);
        this.documents.set([]);
      }
    });
  }
  
  // Map backend category/type to frontend DocumentType
  mapCategoryToType(category: string, type: string): DocumentType {
    // Map backend types to frontend types
    const typeMap: Record<string, DocumentType> = {
      'Bail': 'BAIL',
      'Colocation': 'BAIL',
      'EtatDesLieuxEntree': 'ETAT_LIEUX_ENTREE',
      'EtatDesLieuxSortie': 'ETAT_LIEUX_SORTIE',
      'PieceIdentite': 'CNI',
      'Assurance': 'ASSURANCE',
      'JustificatifDomicile': 'OTHER',
      'BulletinSalaire': 'BULLETIN_SALAIRE',
      'AvisImposition': 'AVIS_IMPOSITION',
      'Quittance': 'OTHER',
      'Avenant': 'AVENANT',
      'Autre': 'OTHER'
    };
    
    return typeMap[type] || 'OTHER';
  }

  getDocumentsByType(types: string[] | DocumentType[]): TenantDocument[] {
    return this.documents().filter(doc => types.includes(doc.type));
  }
  
  getFilteredDocumentsByType(types: string[] | DocumentType[]): TenantDocument[] {
    return this.filteredDocuments().filter(doc => types.includes(doc.type));
  }
  
  onSearchChange() {
    // Signal is already bound with [(ngModel)], no need to do anything
  }
  
  onCategoryChange() {
    // Signal will automatically update filteredDocuments
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
      this.processFile(input.files[0]);
    }
  }
  
  processFile(file: File) {
    if (file.size > 10 * 1024 * 1024) {
      alert('Le fichier ne doit pas dépasser 10MB');
      return;
    }
    
    this.uploadForm.file = file;
    
    // Generate preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.filePreviewUrl.set(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else if (file.type === 'application/pdf') {
      this.filePreviewUrl.set('pdf');
    } else {
      this.filePreviewUrl.set(null);
    }
  }
  
  clearFile() {
    this.uploadForm.file = null;
    this.filePreviewUrl.set(null);
  }
  
  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }
  
  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }
  
  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.processFile(files[0]);
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
    
    const tenant = this.tenantInfo();
    if (tenant?.propertyId) {
      formData.append('propertyId', tenant.propertyId);
    }
    
    // Map frontend type to backend type and category
    const typeInfo = this.mapFrontendTypeToBackend(this.uploadForm.type as DocumentType);
    formData.append('type', typeInfo.type);
    formData.append('category', typeInfo.category);
    
    if (this.uploadForm.expiryDate) {
      formData.append('expiryDate', this.uploadForm.expiryDate);
    }
    if (this.uploadForm.description) {
      formData.append('description', this.uploadForm.description);
    }

    this.documentsApi.uploadDocument(formData).subscribe({
      next: (doc) => {
        console.log('✅ Document uploaded:', doc);
        this.uploading.set(false);
        this.uploadProgress.set(100);
        this.showUploadModal.set(false);
        this.resetUploadForm();
        this.loadDocuments(); // Refresh list
      },
      error: (err) => {
        console.error('❌ Upload error:', err);
        this.uploading.set(false);
        this.uploadProgress.set(0);
        alert('Erreur lors de l\'upload du document');
      }
    });
  }
  
  // Map frontend DocumentType to backend type and category
  mapFrontendTypeToBackend(frontendType: DocumentType): { type: string, category: string } {
    const mapping: Record<DocumentType, { type: string, category: string }> = {
      'CNI': { type: 'PieceIdentite', category: 'Identite' },
      'PASSPORT': { type: 'PieceIdentite', category: 'Identite' },
      'ASSURANCE': { type: 'Assurance', category: 'Justificatifs' },
      'BAIL': { type: 'Bail', category: 'Contrats' },
      'AVENANT': { type: 'Avenant', category: 'Contrats' },
      'ETAT_LIEUX_ENTREE': { type: 'EtatDesLieuxEntree', category: 'EtatsDesLieux' },
      'ETAT_LIEUX_SORTIE': { type: 'EtatDesLieuxSortie', category: 'EtatsDesLieux' },
      'ATTESTATION_EMPLOI': { type: 'Autre', category: 'Justificatifs' },
      'BULLETIN_SALAIRE': { type: 'BulletinSalaire', category: 'Justificatifs' },
      'AVIS_IMPOSITION': { type: 'AvisImposition', category: 'Justificatifs' },
      'OTHER': { type: 'Autre', category: 'Autres' }
    };
    
    return mapping[frontendType] || { type: 'Autre', category: 'Autres' };
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

  /**
   * Vérifie si un type de document unique existe déjà pour le locataire
   */
  hasDocumentType(type: DocumentType): boolean {
    return this.documents().some(doc => doc.type === type);
  }

  /**
   * Vérifie si un type de document peut être uploadé
   * (retourne false si c'est un document unique qui existe déjà)
   */
  canUploadDocumentType(type: DocumentType): boolean {
    if (this.uniqueDocumentTypes.includes(type)) {
      return !this.hasDocumentType(type);
    }
    return true; // Les documents non-uniques peuvent toujours être uploadés
  }

  /**
   * Vérifie si on doit afficher l'avertissement pour document unique
   */
  showUniqueDocumentWarning(): boolean {
    if (!this.uploadForm.type) return false;
    const type = this.uploadForm.type as DocumentType;
    return !this.canUploadDocumentType(type);
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
    // Retourner le premier contrat s'il existe, sinon un objet simulé avec le propertyId
    if (tenant.contracts && tenant.contracts.length > 0) {
      const contract = tenant.contracts[0];
      return {
        propertyId: tenant.propertyId,
        propertyCode: tenant.propertyCode,
        propertyName: contract.propertyName || tenant.propertyCode,
        startDate: contract.startDate,
        endDate: contract.endDate,
        rent: contract.rent,
        deposit: contract.deposit,
        type: contract.type
      };
    }
    return {
      propertyId: tenant.propertyId,
      propertyCode: tenant.propertyCode
    };
  }

  // Ouvrir le modal et pré-remplir les champs depuis l'API
  openContractModal() {
    const tenantId = this.tenantId();
    if (!tenantId) {
      alert('Aucun locataire sélectionné');
      return;
    }

    // Réinitialiser le type par défaut et la checkbox
    this.contractFormType.set('BAIL');
    this.allowEditContractFields.set(false);

    // Charger les contrats depuis l'API
    this.tenantsApi.getTenantContracts(tenantId).subscribe({
      next: (contracts: Contract[]) => {
        // Prendre le premier contrat actif s'il existe
        const activeContract = contracts.find(c => c.status === 'Active') || contracts[0];
        
        if (activeContract) {
          // Pré-remplir les champs
          this.contractForm.startDate = new Date(activeContract.startDate).toISOString().split('T')[0];
          this.contractForm.endDate = new Date(activeContract.endDate).toISOString().split('T')[0];
          this.contractForm.rent = activeContract.rent || 0;
          this.contractForm.deposit = activeContract.deposit || 0;
        } else {
          // Pas de contrat trouvé, réinitialiser
          this.contractForm.startDate = '';
          this.contractForm.endDate = '';
          this.contractForm.rent = 0;
          this.contractForm.deposit = 0;
        }
        
        this.showContractModal.set(true);
      },
      error: (err) => {
        console.error('Erreur lors du chargement des contrats:', err);
        // Ouvrir quand même le modal avec des champs vides
        this.contractForm.startDate = '';
        this.contractForm.endDate = '';
        this.contractForm.rent = 0;
        this.contractForm.deposit = 0;
        this.showContractModal.set(true);
      }
    });
  }

  canGenerateContract(): boolean {
    const basicValidation = !!(
      this.contractFormType() &&
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
      contractType: this.contractFormType(),
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
          
          // Format: Contrat_{Type}_{Nom_du_locataire}_Date_{numero}
          const tenantName = this.tenantInfo()?.fullName.replace(/\s+/g, '_') || 'Locataire';
          const date = new Date().toISOString().split('T')[0];
          const numero = this.documents().length + 1;
          link.download = `Contrat_${this.contractFormType()}_${tenantName}_${date}_${numero}.pdf`;
          
          link.click();
          window.URL.revokeObjectURL(url);
          
          console.log('✅ Contract generated successfully');
          alert('Contrat généré avec succès !');
          this.showContractModal.set(false);
          this.loadDocuments(); // Refresh documents list to show the new contract
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
    if (!doc.id) {
      console.error('❌ Document ID missing');
      return;
    }
    
    this.documentsApi.downloadDocument(doc.id).subscribe({
      next: (blob) => {
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = doc.fileName;
        link.click();
        window.URL.revokeObjectURL(url);
        console.log('✅ Document downloaded:', doc.fileName);
      },
      error: (err) => {
        console.error('❌ Download error:', err);
        alert('Erreur lors du téléchargement du document');
      }
    });
  }

  deleteDocument(doc: TenantDocument) {
    if (!confirm(`Êtes-vous sûr de vouloir dissocier ${doc.fileName} ?\n\nLe document sera archivé mais pas supprimé définitivement.`)) return;
    
    if (!doc.id) {
      console.error('❌ Document ID missing');
      return;
    }

    this.documentsApi.dissociateDocument(doc.id).subscribe({
      next: () => {
        console.log('✅ Document dissociated:', doc.fileName);
        this.loadDocuments(); // Refresh list
      },
      error: (err) => {
        console.error('❌ Dissociate error:', err);
        alert('Erreur lors de la dissociation du document');
      }
    });
  }

  exportAllDocuments() {
    const tenantId = this.tenantId();
    if (!tenantId) return;

    this.isLoading.set(true);
    
    this.documentsApi.exportDocumentsZip(tenantId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Documents_Locataire_${new Date().toISOString().split('T')[0]}.zip`;
        link.click();
        window.URL.revokeObjectURL(url);
        
        this.isLoading.set(false);
        console.log('✅ Documents exported as ZIP');
      },
      error: (err) => {
        console.error('❌ Export ZIP error:', err);
        this.isLoading.set(false);
        alert('Erreur lors de l\'export des documents');
      }
    });
  }
}
