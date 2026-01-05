import { Component, computed, inject, signal, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  InventoriesApiService, 
  InventoryItemDto, 
  InventoryCondition,
  CreateInventoryEntryRequest 
} from '../../../../../core/api/inventories.api';
import { ToastService } from '../../../../../core/ui/toast.service';
import { ConfirmService } from '../../../../../core/ui/confirm.service';
import { InventoryPhotoUploaderComponent } from '../../../components/inventory-photo-uploader/inventory-photo-uploader';

/**
 * Données passées au wizard
 */
export interface InventoryEntryWizardData {
  contractId: string;
  propertyId: string;
  propertyName: string;
  roomId?: string;
  roomName?: string;
  tenantName: string;
}

/**
 * Wizard simplifié pour l'état des lieux d'entrée
 * Version sans Angular Material
 */
@Component({
  selector: 'app-inventory-entry-wizard',
  standalone: true,
  imports: [CommonModule, FormsModule, InventoryPhotoUploaderComponent],
  template: `
    <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        
        <!-- Header -->
        <div class="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-2xl font-bold">État des Lieux d'Entrée</h2>
              <p class="text-blue-100 mt-1">{{data().propertyName}} - {{data().tenantName}}</p>
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
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Nom de l'agent *
                </label>
                <input 
                  type="text" 
                  [(ngModel)]="form().agentName"
                  placeholder="Votre nom complet"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              </div>

              <div class="flex items-center gap-3">
                <input 
                  type="checkbox" 
                  id="tenantPresent"
                  [(ngModel)]="form().tenantPresent"
                  class="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500">
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
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                </div>
              }
            </div>
          }

          <!-- Étape 2: Items -->
          @if (currentStep() === 1) {
            <div class="space-y-6">
              <h3 class="text-xl font-semibold text-gray-800 mb-4">Éléments inspectés</h3>
              
              <!-- Formulaire ajout item -->
              <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
                <h4 class="font-semibold text-blue-900">Ajouter un élément</h4>
                
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Pièce *</label>
                    <select 
                      [(ngModel)]="newItem().roomName"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                      <option value="">Sélectionner...</option>
                      @for (room of rooms; track room) {
                        <option [value]="room">{{room}}</option>
                      }
                    </select>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Catégorie *</label>
                    <select 
                      [(ngModel)]="newItem().category"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                      <option value="">Sélectionner...</option>
                      @for (cat of categories; track cat.value) {
                        <option [value]="cat.value">{{cat.value}}</option>
                      }
                    </select>
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Élément *</label>
                    @if (availableElements().length > 0) {
                      <select 
                        [(ngModel)]="newItem().elementName"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                        <option value="">Sélectionner...</option>
                        @for (el of availableElements(); track el) {
                          <option [value]="el">{{el}}</option>
                        }
                      </select>
                    } @else {
                      <input 
                        type="text" 
                        [(ngModel)]="newItem().elementName"
                        placeholder="Nom de l'élément"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    }
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">État *</label>
                    <select 
                      [(ngModel)]="newItem().condition"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                      @for (cond of conditions; track cond.value) {
                        <option [value]="cond.value">{{cond.label}}</option>
                      }
                    </select>
                  </div>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Commentaire</label>
                  <textarea 
                    [(ngModel)]="newItem().comment"
                    rows="2"
                    placeholder="Observations complémentaires..."
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"></textarea>
                </div>

                <!-- Photos pour la pièce (optionnel) -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Photos de la pièce (optionnel)
                    <span class="text-xs text-gray-500 font-normal ml-1">- Documenter l'état actuel</span>
                  </label>
                  <app-inventory-photo-uploader 
                    [photos]="newItem().photoUrls || []"
                    (photosChange)="updateNewItemPhotos($event)" />
                </div>

                <button 
                  (click)="addItem()"
                  [disabled]="!canAddItem()"
                  class="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium">
                  + Ajouter l'élément
                </button>
              </div>

              <!-- Liste des items -->
              @if (itemsByRoom().length > 0) {
                <div class="space-y-4">
                  @for (group of itemsByRoom(); track group.roomName) {
                    <div class="border border-gray-200 rounded-lg p-4">
                      <h5 class="font-semibold text-gray-800 mb-3 flex items-center justify-between">
                        <span>{{group.roomName}}</span>
                        <span class="text-sm text-gray-500 font-normal">{{group.count}} élément(s)</span>
                      </h5>
                      <div class="space-y-2">
                        @for (item of group.items; track $index) {
                          <div class="flex items-center justify-between bg-gray-50 p-3 rounded">
                            <div class="flex-1">
                              <p class="font-medium text-gray-800">{{item.elementName}}</p>
                              <p class="text-sm text-gray-600">{{item.category}} - <span [class]="getConditionColor(item.condition)">{{getConditionLabel(item.condition)}}</span></p>
                              @if (item.comment) {
                                <p class="text-sm text-gray-500 mt-1">{{item.comment}}</p>
                              }
                            </div>
                            <button 
                              (click)="removeItemByIndex(group.roomName, $index)"
                              class="ml-4 text-red-600 hover:text-red-800 transition-colors">
                              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                              </svg>
                            </button>
                          </div>
                        }
                      </div>
                    </div>
                  }
                </div>
              } @else {
                <div class="text-center py-8 text-gray-500">
                  <svg class="w-16 h-16 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                  </svg>
                  <p>Aucun élément ajouté</p>
                </div>
              }
            </div>
          }

          <!-- Étape 3: Observations -->
          @if (currentStep() === 2) {
            <div class="space-y-6">
              <h3 class="text-xl font-semibold text-gray-800 mb-4">Observations finales</h3>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Observations générales (optionnel)
                </label>
                <textarea 
                  [(ngModel)]="form().generalObservations"
                  rows="8"
                  placeholder="Remarques générales sur l'état du logement, points importants à noter..."
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"></textarea>
              </div>

              <!-- Photos -->
              <app-inventory-photo-uploader 
                [photos]="form().photoUrls"
                (photosChange)="updatePhotos($event)" />

              <!-- Récapitulatif -->
              <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 class="font-semibold text-blue-900 mb-3">Récapitulatif</h4>
                <div class="space-y-2 text-sm">
                  <p><span class="font-medium">Date:</span> {{form().inspectionDateStr}}</p>
                  <p><span class="font-medium">Agent:</span> {{form().agentName}}</p>
                  <p><span class="font-medium">Locataire présent:</span> {{form().tenantPresent ? 'Oui' : 'Non'}}</p>
                  <p><span class="font-medium">Éléments inspectés:</span> {{form().items.length}}</p>
                </div>
              </div>

              @if (submitError()) {
                <div class="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
                  {{submitError()}}
                </div>
              }
            </div>
          }
        </div>

        <!-- Footer -->
        <div class="border-t border-gray-200 p-6 bg-gray-50 flex items-center justify-between">
          <button 
            *ngIf="currentStep() > 0"
            (click)="previousStep()"
            class="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-medium text-gray-700">
            Précédent
          </button>
          <div *ngIf="currentStep() === 0"></div>

          @if (currentStep() < 2) {
            <button 
              (click)="nextStep()"
              [disabled]="!canGoNext()"
              class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium">
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
                    <span>Créer l'état des lieux</span>
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
export class InventoryEntryWizardSimpleComponent {
  private inventoriesApi = inject(InventoriesApiService);
  
  // ✅ Services UI
  private toasts = inject(ToastService);
  private confirmService = inject(ConfirmService);
  
  // Props passées
  wizardData = input.required<InventoryEntryWizardData>();
  onClose = output<any>();
  
  // Computed pour compatibilité avec le template
  data = computed(() => this.wizardData());

  // État
  currentStep = signal(0);
  isSubmitting = signal(false);
  submitError = signal<string | null>(null);
  createdInventoryId = signal<string | null>(null);

  readonly steps = ['Informations', 'Inspection', 'Validation'];
  
  // Données de référence
  readonly categories = [
    { value: 'Murs', elements: ['Murs', 'Peinture', 'Papier peint', 'Carrelage mural'] },
    { value: 'Sols', elements: ['Parquet', 'Carrelage', 'Moquette', 'Vinyle'] },
    { value: 'Plafond', elements: ['Plafond', 'Faux-plafond', 'Moulures'] },
    { value: 'Menuiseries', elements: ['Porte', 'Fenêtre', 'Placard', 'Volets'] },
    { value: 'Électricité', elements: ['Prises', 'Interrupteurs', 'Luminaires'] },
    { value: 'Plomberie', elements: ['Robinetterie', 'Sanitaires', 'Éviers'] },
    { value: 'Équipements', elements: ['Cuisine équipée', 'Four', 'Plaques', 'Réfrigérateur'] },
    { value: 'Chauffage', elements: ['Radiateurs', 'Chaudière'] },
    { value: 'Autres', elements: ['Autres'] }
  ];

  readonly rooms = [
    'Entrée', 'Salon', 'Cuisine', 'Chambre 1', 'Chambre 2', 'Chambre 3',
    'Salle de bain', 'Salle d\'eau', 'WC', 'Dégagement', 'Cave', 'Balcon/Terrasse'
  ];

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
    items: InventoryItemDto[];
    generalObservations?: string;
    photoUrls: string[];
  }>({
    inspectionDateStr: new Date().toISOString().split('T')[0],
    agentName: '',
    tenantPresent: true,
    items: [],
    photoUrls: []
  });

  // Nouvel item
  newItem = signal<Partial<InventoryItemDto>>({
    roomName: '',
    category: '',
    elementName: '',
    condition: 'Good',
    comment: '',
    photoUrls: []
  });

  availableElements = computed(() => {
    const category = this.newItem().category;
    return this.categories.find(c => c.value === category)?.elements || [];
  });

  itemsByRoom = computed(() => {
    const items = this.form().items;
    const grouped = new Map<string, InventoryItemDto[]>();
    
    items.forEach(item => {
      if (!grouped.has(item.roomName)) {
        grouped.set(item.roomName, []);
      }
      grouped.get(item.roomName)!.push(item);
    });
    
    return Array.from(grouped.entries()).map(([roomName, items]) => ({
      roomName,
      items,
      count: items.length
    }));
  });

  canAddItem() {
    const item = this.newItem();
    return item.roomName && item.elementName && item.condition;
  }

  canGoNext() {
    const step = this.currentStep();
    if (step === 0) {
      return this.form().agentName.trim().length > 0;
    }
    if (step === 1) {
      return this.form().items.length > 0;
    }
    return true;
  }

  canSubmit = computed(() => {
    return this.form().items.length > 0 && !this.isSubmitting();
  });

  addItem() {
    const item = this.newItem();
    if (!this.canAddItem()) return;

    const fullItem: InventoryItemDto = {
      roomName: item.roomName!,
      elementName: item.elementName!,
      category: item.category || 'Autres',
      condition: item.condition!,
      comment: item.comment,
      photoUrls: item.photoUrls || []
    };

    this.form.update(f => ({
      ...f,
      items: [...f.items, fullItem]
    }));

    this.newItem.update(n => ({
      ...n,
      elementName: '',
      condition: 'Good',
      comment: '',
      photoUrls: []
    }));
  }

  removeItemByIndex(roomName: string, index: number) {
    const group = this.itemsByRoom().find(g => g.roomName === roomName);
    if (!group) return;
    
    const itemToRemove = group.items[index];
    this.form.update(f => ({
      ...f,
      items: f.items.filter(i => i !== itemToRemove)
    }));
  }

  updatePhotos(photos: string[]) {
    this.form.update(f => ({
      ...f,
      photoUrls: photos
    }));
  }

  updateNewItemPhotos(photos: string[]) {
    this.newItem.update(item => ({
      ...item,
      photoUrls: photos
    }));
  }

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
      const request: CreateInventoryEntryRequest = {
        propertyId: d.propertyId,
        roomId: d.roomId,
        contractId: d.contractId,
        inspectionDate: new Date(f.inspectionDateStr).toISOString(),
        agentName: f.agentName,
        tenantPresent: f.tenantPresent,
        representativeName: f.representativeName,
        generalObservations: f.generalObservations,
        items: f.items,
        photoUrls: f.photoUrls
      };
      const result = await this.inventoriesApi.createEntry(request).toPromise();
      
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
      const blob = await this.inventoriesApi.generatePdf(id, 'entry').toPromise();
      if (blob) {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `EDL_Entree_${new Date().toISOString().split('T')[0]}.pdf`;
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
        inventoryType: 'Entry',
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
        inventoryType: 'Entry',
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
