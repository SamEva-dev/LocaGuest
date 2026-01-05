import { Component, inject, signal, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';

interface ScenarioShare {
  id: string;
  sharedWithUserId: string;
  sharedWithUserEmail: string;
  permission: 'view' | 'edit';
  expiresAt: string | null;
  createdAt: string;
}

interface User {
  id: string;
  email: string;
  fullName: string;
}

@Component({
  selector: 'app-share-scenario-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  template: `
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" (click)="onClose()">
      <div class="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden"
           (click)="$event.stopPropagation()">
        
        <!-- Header -->
        <div class="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h3 class="text-xl font-semibold text-slate-900 dark:text-white">
            <i class="ph ph-share-network mr-2"></i>
            {{ 'SCENARIOS.SHARE_TITLE' | translate }}
          </h3>
          <button (click)="onClose()" 
                  class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
            <i class="ph ph-x text-2xl"></i>
          </button>
        </div>

        <!-- Body -->
        <div class="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          
          <!-- Add Share Form -->
          <div class="mb-6 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
            <h4 class="font-medium text-slate-900 dark:text-white mb-4">
              {{ 'SCENARIOS.ADD_SHARE' | translate }}
            </h4>
            
            <div class="space-y-4">
              <!-- User Selection -->
              <div>
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  {{ 'SCENARIOS.SELECT_USER' | translate }}
                </label>
                <select [(ngModel)]="selectedUserId" 
                        class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg
                               bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                  <option value="">{{ 'SCENARIOS.SELECT_USER_PLACEHOLDER' | translate }}</option>
                  @for (user of availableUsers(); track user.id) {
                    <option [value]="user.id">{{ user.fullName }} ({{ user.email }})</option>
                  }
                </select>
              </div>

              <!-- Permission -->
              <div>
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  {{ 'SCENARIOS.PERMISSION' | translate }}
                </label>
                <div class="flex gap-4">
                  <label class="flex items-center">
                    <input type="radio" [(ngModel)]="selectedPermission" value="view" name="permission"
                           class="mr-2">
                    <i class="ph ph-eye mr-1"></i>
                    {{ 'SCENARIOS.VIEW_ONLY' | translate }}
                  </label>
                  <label class="flex items-center">
                    <input type="radio" [(ngModel)]="selectedPermission" value="edit" name="permission"
                           class="mr-2">
                    <i class="ph ph-pencil mr-1"></i>
                    {{ 'SCENARIOS.CAN_EDIT' | translate }}
                  </label>
                </div>
              </div>

              <!-- Expiration -->
              <div>
                <label class="flex items-center mb-2">
                  <input type="checkbox" [(ngModel)]="hasExpiration" class="mr-2">
                  <span class="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {{ 'SCENARIOS.SET_EXPIRATION' | translate }}
                  </span>
                </label>
                @if (hasExpiration) {
                  <input type="datetime-local" [(ngModel)]="expirationDate"
                         class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg
                                bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                }
              </div>

              <!-- Add Button -->
              <button (click)="addShare()"
                      [disabled]="!selectedUserId"
                      class="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700
                             disabled:opacity-50 disabled:cursor-not-allowed">
                <i class="ph ph-plus mr-2"></i>
                {{ 'SCENARIOS.ADD_SHARE_BTN' | translate }}
              </button>
            </div>
          </div>

          <!-- Current Shares List -->
          <div>
            <h4 class="font-medium text-slate-900 dark:text-white mb-4">
              {{ 'SCENARIOS.CURRENT_SHARES' | translate }} ({{ shares().length }})
            </h4>

            @if (shares().length === 0) {
              <div class="text-center py-8 text-slate-500 dark:text-slate-400">
                <i class="ph ph-users-three text-4xl mb-2"></i>
                <p>{{ 'SCENARIOS.NO_SHARES' | translate }}</p>
              </div>
            } @else {
              <div class="space-y-3">
                @for (share of shares(); track share.id) {
                  <div class="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                    <div class="flex-1">
                      <div class="flex items-center gap-2 mb-1">
                        <span class="font-medium text-slate-900 dark:text-white">
                          {{ share.sharedWithUserEmail }}
                        </span>
                        @if (share.permission === 'edit') {
                          <span class="px-2 py-1 text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded">
                            <i class="ph ph-pencil"></i> Edit
                          </span>
                        } @else {
                          <span class="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                            <i class="ph ph-eye"></i> View
                          </span>
                        }
                      </div>
                      <div class="text-sm text-slate-500 dark:text-slate-400">
                        @if (share.expiresAt) {
                          <i class="ph ph-clock"></i>
                          {{ 'SCENARIOS.EXPIRES' | translate }}: {{ share.expiresAt | date:'short' }}
                        } @else {
                          <i class="ph ph-infinity"></i>
                          {{ 'SCENARIOS.NO_EXPIRATION' | translate }}
                        }
                      </div>
                    </div>
                    <button (click)="revokeShare(share.id)"
                            class="px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded">
                      <i class="ph ph-trash"></i>
                    </button>
                  </div>
                }
              </div>
            }
          </div>
        </div>

        <!-- Footer -->
        <div class="flex justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-700">
          <button (click)="onClose()"
                  class="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg
                         hover:bg-slate-50 dark:hover:bg-slate-700">
            {{ 'COMMON.CLOSE' | translate }}
          </button>
        </div>
      </div>
    </div>
  `
})
export class ShareScenarioModalComponent {
  scenarioId = input.required<string>();
  close = output<void>();
  
  shares = signal<ScenarioShare[]>([]);
  availableUsers = signal<User[]>([]);
  
  selectedUserId = '';
  selectedPermission: 'view' | 'edit' = 'view';
  hasExpiration = false;
  expirationDate = '';

  ngOnInit() {
    this.loadShares();
    this.loadAvailableUsers();
  }

  loadShares() {
    this.shares.set([]);
  }

  loadAvailableUsers() {
    // Mock data - à remplacer par un vrai endpoint
    this.availableUsers.set([
      { id: 'user1', email: 'alice@example.com', fullName: 'Alice Dupont' },
      { id: 'user2', email: 'bob@example.com', fullName: 'Bob Martin' },
      { id: 'user3', email: 'carol@example.com', fullName: 'Carol Bernard' }
    ]);
  }

  addShare() {
    if (!this.selectedUserId) return;

    const payload = {
      userId: this.selectedUserId,
      permission: this.selectedPermission,
      expiresAt: this.hasExpiration ? this.expirationDate : null
    };

    this.selectedUserId = '';
    this.selectedPermission = 'view';
    this.hasExpiration = false;
    this.expirationDate = '';
  }

  revokeShare(shareId: string) {
    if (confirm('Révoquer ce partage ?')) {
      this.loadShares();
    }
  }

  onClose() {
    this.close.emit();
  }
}
