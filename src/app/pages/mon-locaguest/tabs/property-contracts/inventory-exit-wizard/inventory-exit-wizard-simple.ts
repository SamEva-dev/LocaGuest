import { Component, computed, inject, signal, OnInit, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  InventoriesApiService, 
  InventoryItemDto, 
  InventoryCondition,
  CreateInventoryExitRequest,
  InventoryEntryDto,
  InventoryComparisonDto,
  DegradationDto
} from '../../../../../core/api/inventories.api';
import { ToastService } from '../../../../../core/ui/toast.service';
import { ConfirmService } from '../../../../../core/ui/confirm.service';
import { InventoryPhotoUploaderComponent } from '../../../components/inventory-photo-uploader/inventory-photo-uploader';

/**
 * Données passées au wizard
 */
export interface InventoryExitWizardData {
  contractId: string;
  propertyId: string;
  propertyName: string;
  roomId?: string;
  roomName?: string;
  tenantName: string;
  inventoryEntryId: string;
}

@Component({
  selector: 'app-inventory-exit-wizard',
  standalone: true,
  imports: [CommonModule, FormsModule, InventoryPhotoUploaderComponent],
  template: `
    <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        
        <!-- Header -->
        <div class="bg-gradient-to-r from-red-600 to-red-700 text-white p-6">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-2xl font-bold">État des Lieux de Sortie</h2>
              <p class="text-red-100 mt-1">{{data().propertyName}} - {{data().tenantName}}</p>
            </div>
            <button 
              (click)="cancel()" 
              class="text-white/80 hover:text-white transition-colors">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
          
          <!-- Progress -->
          <div class="mt-6 flex items-center gap-2">
            @for (step of steps; track $index) {
              <div class="flex-1">
                <div 
                  class="h-2 rounded-full transition-all"
                  [class.bg-white]="$index <= currentStep()"
                  [class.bg-white/30]="$index > currentStep()">
                </div>
                <p class="text-xs text-white/80 mt-1">{{step}}</p>
              </div>
            }
          </div>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto p-6">
          
          @if (isLoading()) {
            <div class="flex items-center justify-center py-12">
              <svg class="animate-spin h-12 w-12 text-red-600" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          } @else {
            
            <!-- Étape 1: Informations générales -->
            @if (currentStep() === 0) {
              <div class="space-y-6">
                <h3 class="text-xl font-semibold text-gray-800 mb-4">Informations générales</h3>
                
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Date d'inspection *
                  </label>
                  <input 
                    type="date" 
                    [(ngModel)]="form().inspectionDateStr"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent">
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Nom de l'agent *
                  </label>
                  <input 
                    type="text" 
                    [(ngModel)]="form().agentName"
                    placeholder="Votre nom complet"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent">
                </div>

                <div class="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    id="tenantPresent"
                    [(ngModel)]="form().tenantPresent"
                    class="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500">
                  <label for="tenantPresent" class="text-sm font-medium text-gray-700">
                    Locataire présent
                  </label>
                </div>

                @if (!form().tenantPresent) {
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Nom du représentant
                    </label>
                    <input 
                      type="text" 
                      [(ngModel)]="form().representativeName"
                      placeholder="Nom du représentant du locataire"
                      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent">
                  </div>
                }
              </div>
            }

            <!-- Étape 2: Comparaisons -->
            @if (currentStep() === 1) {
              <div class="space-y-6">
                <h3 class="text-xl font-semibold text-gray-800 mb-4">Comparaison avec l'état d'entrée</h3>
                
                @if (entryItems().length > 0) {
                  <div class="space-y-4">
                    @for (item of entryItems(); track $index) {
                      <div class="border border-gray-200 rounded-lg p-4 hover:border-red-300 transition-colors">
                        <div class="flex items-start justify-between mb-3">
                          <div>
                            <h4 class="font-semibold text-gray-800">{{item.elementName}}</h4>
                            <p class="text-sm text-gray-600">{{item.roomName}} - {{item.category}}</p>
                            <p class="text-sm">
                              État d'entrée: <span [class]="getConditionColor(item.condition)">{{getConditionLabel(item.condition)}}</span>
                            </p>
                          </div>
                        </div>

                        <div class="grid grid-cols-2 gap-4">
                          <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">État actuel *</label>
                            <select 
                              [(ngModel)]="getComparison($index).exitCondition"
                              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500">
                              @for (cond of conditions; track cond.value) {
                                <option [value]="cond.value">{{cond.label}}</option>
                              }
                            </select>
                          </div>

                          <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Dégradation?</label>
                            <div class="flex items-center h-full">
                              <input 
                                type="checkbox"
                                [checked]="hasDegradation($index)"
                                (change)="toggleDegradation($index)"
                                class="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500">
                              <span class="ml-2 text-sm text-gray-700">Oui</span>
                            </div>
                          </div>
                        </div>

                        <div class="mt-3">
                          <label class="block text-sm font-medium text-gray-700 mb-1">Commentaire</label>
                          <textarea 
                            [(ngModel)]="getComparison($index).comment"
                            rows="2"
                            placeholder="Observations..."
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"></textarea>
                        </div>

                        @if (hasDegradation($index)) {
                          <div class="mt-3 bg-red-50 border border-red-200 rounded-lg p-3">
                            <h5 class="font-semibold text-red-900 mb-2">Détails de la dégradation</h5>
                            <div class="space-y-2">
                              <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea 
                                  [(ngModel)]="getDegradation($index).description"
                                  rows="2"
                                  placeholder="Décrire la dégradation..."
                                  class="w-full px-3 py-2 border border-gray-300 rounded-lg"></textarea>
                              </div>
                              <div class="grid grid-cols-2 gap-3">
                                <div>
                                  <label class="block text-sm font-medium text-gray-700 mb-1">Coût estimé (€)</label>
                                  <input 
                                    type="number" 
                                    [(ngModel)]="getDegradation($index).estimatedCost"
                                    min="0"
                                    step="0.01"
                                    placeholder="0.00"
                                    class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                                </div>
                                <div class="flex items-end">
                                  <label class="flex items-center gap-2">
                                    <input 
                                      type="checkbox"
                                      [(ngModel)]="getDegradation($index).isImputedToTenant"
                                      class="w-4 h-4 text-red-600 border-gray-300 rounded">
                                    <span class="text-sm text-gray-700">Imputable au locataire</span>
                                  </label>
                                </div>
                              </div>
                              
                              <!-- Photos de la dégradation (optionnel) -->
                              <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">
                                  Photos de la dégradation (optionnel)
                                </label>
                                <app-inventory-photo-uploader 
                                  [photos]="getDegradation($index).photoUrls || []"
                                  (photosChange)="updateDegradationPhotos($index, $event)" />
                              </div>
                            </div>
                          </div>
                        }
                      </div>
                    }
                  </div>
                } @else {
                  <div class="text-center py-8 text-gray-500">
                    <p>Aucun élément dans l'EDL d'entrée</p>
                  </div>
                }
              </div>
            }

            <!-- Étape 3: Synthèse financière -->
            @if (currentStep() === 2) {
              <div class="space-y-6">
                <h3 class="text-xl font-semibold text-gray-800 mb-4">Synthèse financière</h3>
                
                <!-- Dégradations -->
                @if (form().degradations.length > 0) {
                  <div class="space-y-3">
                    <h4 class="font-semibold text-gray-700">Dégradations constatées</h4>
                    @for (deg of form().degradations; track $index) {
                      <div class="border border-gray-200 rounded-lg p-4">
                        <div class="flex items-start justify-between">
                          <div class="flex-1">
                            <h5 class="font-medium text-gray-800">{{deg.elementName}}</h5>
                            <p class="text-sm text-gray-600">{{deg.roomName}}</p>
                            <p class="text-sm text-gray-700 mt-1">{{deg.description}}</p>
                          </div>
                          <div class="text-right">
                            <p class="font-semibold text-lg">{{deg.estimatedCost}}€</p>
                            @if (deg.isImputedToTenant) {
                              <span class="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Locataire</span>
                            } @else {
                              <span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Propriétaire</span>
                            }
                          </div>
                        </div>
                      </div>
                    }
                  </div>
                } @else {
                  <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p class="text-green-800">✓ Aucune dégradation constatée</p>
                  </div>
                }

                <!-- Calcul total -->
                <div class="bg-gray-50 border border-gray-300 rounded-lg p-4">
                  <div class="space-y-2">
                    <div class="flex justify-between text-sm">
                      <span class="text-gray-600">Total dégradations:</span>
                      <span class="font-semibold">{{totalDegradations()}}€</span>
                    </div>
                    <div class="flex justify-between text-sm">
                      <span class="text-gray-600">Part propriétaire:</span>
                      <span class="font-semibold">{{ownerPart()}}€</span>
                    </div>
                    <div class="border-t border-gray-300 pt-2 flex justify-between">
                      <span class="font-semibold text-gray-800">Déduction DG:</span>
                      <span class="font-bold text-xl text-red-600">{{tenantDeduction()}}€</span>
                    </div>
                  </div>
                </div>

                <!-- Notes financières -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Notes financières complémentaires
                  </label>
                  <textarea 
                    [(ngModel)]="form().financialNotes"
                    rows="4"
                    placeholder="Précisions sur les déductions, accords particuliers..."
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"></textarea>
                </div>

                <!-- Observations générales -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Observations générales
                  </label>
                  <textarea 
                    [(ngModel)]="form().generalObservations"
                    rows="4"
                    placeholder="Remarques générales sur la restitution..."
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"></textarea>
                </div>

                <!-- Photos -->
                <app-inventory-photo-uploader 
                  [photos]="form().photoUrls"
                  (photosChange)="updatePhotos($event)" />

                @if (submitError()) {
                  <div class="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
                    {{submitError()}}
                  </div>
                }
              </div>
            }
          }
        </div>

        <!-- Footer -->
        <div class="border-t border-gray-200 p-6 bg-gray-50 flex items-center justify-between">
          <button 
            *ngIf="currentStep() > 0"
            (click)="previousStep()"
            [disabled]="isLoading()"
            class="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-medium text-gray-700 disabled:opacity-50">
            Précédent
          </button>
          <div *ngIf="currentStep() === 0"></div>

          @if (currentStep() < 2) {
            <button 
              (click)="nextStep()"
              [disabled]="!canGoNext() || isLoading()"
              class="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium">
              Suivant
            </button>
          } @else {
            <div class="flex items-center gap-3">
              @if (!createdInventoryId()) {
                <button 
                  (click)="submit()"
                  [disabled]="!canSubmit() || isSubmitting()"
                  class="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2">
                  @if (isSubmitting()) {
                    <svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Création...</span>
                  } @else {
                    <span>Finaliser l'état des lieux</span>
                  }
                </button>
              } @else {
                <button 
                  (click)="downloadPdf()"
                  class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                  </svg>
                  <span>PDF</span>
                </button>
                <button 
                  (click)="sendEmailToTenant()"
                  class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                  </svg>
                  <span>Email</span>
                </button>
                <button 
                  (click)="signInventory()"
                  class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center gap-2">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
                  </svg>
                  <span>Signer</span>
                </button>
                <button 
                  (click)="cancel()"
                  class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium">
                  Fermer
                </button>
              }
            </div>
          }
        </div>
      </div>
    </div>
  `
})
export class InventoryExitWizardSimpleComponent implements OnInit {
  private inventoriesApi = inject(InventoriesApiService);
  
  // ✅ Services UI
  private toasts = inject(ToastService);
  private confirmService = inject(ConfirmService);
  
  // Props
  wizardData = input.required<InventoryExitWizardData>();
  onClose = output<any>();
  
  // Computed pour compatibilité avec le template
  data = computed(() => this.wizardData());

  // État
  currentStep = signal(0);
  isLoading = signal(true);
  isSubmitting = signal(false);
  submitError = signal<string | null>(null);
  createdInventoryId = signal<string | null>(null);

  readonly steps = ['Informations', 'Comparaison', 'Synthèse'];
  
  // Données EDL entrée
  entryData = signal<InventoryEntryDto | null>(null);
  entryItems = computed(() => this.entryData()?.items || []);

  readonly conditions: { value: InventoryCondition; label: string; color: string }[] = [
    { value: 'New', label: 'Neuf', color: 'text-green-600' },
    { value: 'Good', label: 'Bon état', color: 'text-blue-600' },
    { value: 'Fair', label: 'État moyen', color: 'text-yellow-600' },
    { value: 'Poor', label: 'Mauvais état', color: 'text-orange-600' },
    { value: 'Damaged', label: 'Endommagé', color: 'text-red-600' }
  ];

  // Formulaire
  form = signal<{
    inspectionDateStr: string;
    agentName: string;
    tenantPresent: boolean;
    representativeName?: string;
    comparisons: InventoryComparisonDto[];
    degradations: DegradationDto[];
    generalObservations?: string;
    financialNotes?: string;
    photoUrls: string[];
  }>({
    inspectionDateStr: new Date().toISOString().split('T')[0],
    agentName: '',
    tenantPresent: true,
    comparisons: [],
    degradations: [],
    photoUrls: []
  });

  totalDegradations = computed(() => {
    return this.form().degradations.reduce((sum, deg) => sum + (deg.estimatedCost || 0), 0);
  });

  ownerPart = computed(() => {
    return this.form().degradations
      .filter(d => !d.isImputedToTenant)
      .reduce((sum, deg) => sum + (deg.estimatedCost || 0), 0);
  });

  tenantDeduction = computed(() => {
    return this.form().degradations
      .filter(d => d.isImputedToTenant)
      .reduce((sum, deg) => sum + (deg.estimatedCost || 0), 0);
  });

  async ngOnInit() {
    await this.loadEntryInventory();
  }

  async loadEntryInventory() {
    try {
      const d = this.data();
      const entry = await this.inventoriesApi.getEntry(d.inventoryEntryId).toPromise();
      this.entryData.set(entry || null);
      
      // Initialiser les comparaisons
      const comparisons: InventoryComparisonDto[] = entry!.items.map(item => ({
        roomName: item.roomName,
        elementName: item.elementName,
        entryCondition: item.condition,
        exitCondition: item.condition, // Par défaut, même état
        hasDegradation: false,
        photoUrls: []
      }));
      
      this.form.update(f => ({ ...f, comparisons }));
    } catch (error) {
      console.error('❌ Erreur chargement EDL entrée', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  getComparison(index: number): InventoryComparisonDto {
    return this.form().comparisons[index];
  }

  getDegradation(index: number): DegradationDto {
    let deg = this.form().degradations.find((d, i) => {
      const item = this.entryItems()[index];
      return d.roomName === item.roomName && d.elementName === item.elementName;
    });
    
    if (!deg) {
      const item = this.entryItems()[index];
      deg = {
        roomName: item.roomName,
        elementName: item.elementName,
        description: '',
        isImputedToTenant: true,
        estimatedCost: 0,
        photoUrls: []
      };
      this.form.update(f => ({
        ...f,
        degradations: [...f.degradations, deg!]
      }));
    }
    
    return deg;
  }

  hasDegradation(index: number): boolean {
    const item = this.entryItems()[index];
    return this.form().degradations.some(d => 
      d.roomName === item.roomName && d.elementName === item.elementName
    );
  }

  toggleDegradation(index: number) {
    const item = this.entryItems()[index];
    const exists = this.hasDegradation(index);
    
    if (exists) {
      // Supprimer
      this.form.update(f => ({
        ...f,
        degradations: f.degradations.filter(d => 
          !(d.roomName === item.roomName && d.elementName === item.elementName)
        )
      }));
      this.form.update(f => ({
        ...f,
        comparisons: f.comparisons.map((c, i) => 
          i === index ? { ...c, hasDegradation: false } : c
        )
      }));
    } else {
      // Ajouter
      this.getDegradation(index);
      this.form.update(f => ({
        ...f,
        comparisons: f.comparisons.map((c, i) => 
          i === index ? { ...c, hasDegradation: true } : c
        )
      }));
    }
  }

  updatePhotos(photos: string[]) {
    this.form.update(f => ({
      ...f,
      photoUrls: photos
    }));
  }

  updateDegradationPhotos(index: number, photos: string[]) {
    const item = this.entryItems()[index];
    this.form.update(f => ({
      ...f,
      degradations: f.degradations.map(d => 
        d.roomName === item.roomName && d.elementName === item.elementName
          ? { ...d, photoUrls: photos }
          : d
      )
    }));
  }

  canGoNext() {
    if (this.currentStep() === 0) {
      return this.form().agentName.trim().length > 0;
    }
    return true;
  }

  canSubmit = computed(() => {
    return !this.isSubmitting() && !this.isLoading();
  });

  nextStep() {
    if (this.canGoNext() && this.currentStep() < 2) {
      this.currentStep.update(s => s + 1);
    }
  }

  previousStep() {
    if (this.currentStep() > 0) {
      this.currentStep.update(s => s - 1);
    }
  }

  async submit() {
    if (!this.canSubmit()) return;

    this.isSubmitting.set(true);
    this.submitError.set(null);

    try {
      const f = this.form();
      const d = this.data();
      const request: CreateInventoryExitRequest = {
        propertyId: d.propertyId,
        roomId: d.roomId,
        contractId: d.contractId,
        inventoryEntryId: d.inventoryEntryId,
        inspectionDate: new Date(f.inspectionDateStr).toISOString(),
        agentName: f.agentName,
        tenantPresent: f.tenantPresent,
        representativeName: f.representativeName,
        generalObservations: f.generalObservations,
        comparisons: f.comparisons,
        degradations: f.degradations,
        photoUrls: f.photoUrls,
        ownerCoveredAmount: this.ownerPart(),
        financialNotes: f.financialNotes
      };
      const result = await this.inventoriesApi.createExit(request).toPromise();
      
      this.createdInventoryId.set(result!.id);
      this.onClose.emit(result);
    } catch (error: any) {
      console.error('❌ Erreur', error);
      this.submitError.set(error?.error?.error || 'Erreur lors de la création');
      this.isSubmitting.set(false);
    }
  }

  cancel() {
    this.onClose.emit(undefined);
  }

  getConditionLabel(condition: InventoryCondition): string {
    return this.conditions.find(c => c.value === condition)?.label || condition;
  }

  getConditionColor(condition: InventoryCondition): string {
    return this.conditions.find(c => c.value === condition)?.color || 'text-gray-600';
  }

  async downloadPdf() {
    const id = this.createdInventoryId();
    if (!id) return;
    
    try {
      const blob = await this.inventoriesApi.generatePdf(id, 'exit').toPromise();
      if (blob) {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `EDL_Sortie_${new Date().toISOString().split('T')[0]}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('❌ Erreur PDF', error);
      this.toasts.errorDirect('Erreur lors de la génération du PDF');
    }
  }

  async sendEmailToTenant() {
    const id = this.createdInventoryId();
    if (!id) return;
    
    const tenantEmail = prompt('Email du locataire:');
    if (!tenantEmail) return;
    
    try {
      await this.inventoriesApi.sendEmail({
        inventoryId: id,
        inventoryType: 'Exit',
        recipientEmail: tenantEmail,
        recipientName: this.data().tenantName
      }).toPromise();
      this.toasts.successDirect('Email envoyé avec succès!');
    } catch (error) {
      console.error('❌ Erreur Email', error);
      this.toasts.errorDirect('Erreur lors de l\'envoi de l\'email');
    }
  }

  async signInventory() {
    const id = this.createdInventoryId();
    if (!id) return;
    
    const signerName = prompt('Nom du signataire:');
    if (!signerName) return;
    
    const isAgent = await this.confirmService.info(
      'Rôle du signataire',
      'Qui signe ?\n\nCliquez Confirmer pour Agent, Annuler pour Locataire'
    );
    const role = isAgent ? 'Agent' : 'Tenant';
    
    try {
      await this.inventoriesApi.signInventory({
        inventoryId: id,
        inventoryType: 'Exit',
        signerRole: role,
        signerName: signerName,
        signatureData: 'signature-base64-placeholder'
      }).toPromise();
      this.toasts.successDirect('Signature enregistrée!');
    } catch (error) {
      console.error('❌ Erreur Signature', error);
      this.toasts.errorDirect('Erreur lors de la signature');
    }
  }
}
