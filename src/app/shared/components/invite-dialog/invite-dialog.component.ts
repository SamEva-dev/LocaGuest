import { Component, EventEmitter, Input, Output, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InvitationsApi } from '../../../core/api/invitations.api';
import { AuthService } from '../../../core/auth/services/auth.service';
import { Permissions } from '../../../core/auth/permissions';

@Component({
  selector: 'invite-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (visible()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden" (click)="$event.stopPropagation()">
          <!-- Header -->
          <div class="bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-4">
            <div class="flex items-center justify-between">
              <h2 class="text-xl font-bold text-white flex items-center gap-2">
                <i class="ph ph-envelope text-2xl"></i>
                Inviter un collaborateur
              </h2>
              <button 
                (click)="close()"
                class="text-white/80 hover:text-white transition">
                <i class="ph ph-x text-2xl"></i>
              </button>
            </div>
          </div>

          <!-- Body -->
          <form (ngSubmit)="onSubmit()" class="p-6 space-y-4">
            <!-- Email -->
            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Email du collaborateur *
              </label>
              <input 
                type="email" 
                [(ngModel)]="email"
                name="email"
                required
                placeholder="collaborateur@example.com"
                class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                [disabled]="isSubmitting()">
            </div>

            <!-- Rôle -->
            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Rôle *
              </label>
              <select 
                [(ngModel)]="selectedRole"
                name="role"
                required
                class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                [disabled]="isSubmitting()">
                <option value="">Sélectionner un rôle...</option>
                @for (role of availableRoles(); track role.value) {
                  <option [value]="role.value">{{ role.label }}</option>
                }
              </select>
              @if (selectedRole) {
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {{ getRoleDescription(selectedRole) }}
                </p>
              }
            </div>

            <!-- Message personnel (optionnel) -->
            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Message personnel (optionnel)
              </label>
              <textarea 
                [(ngModel)]="message"
                name="message"
                rows="3"
                placeholder="Ajouter un message de bienvenue..."
                class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                [disabled]="isSubmitting()"></textarea>
            </div>

            <!-- Info Box -->
            <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <div class="flex gap-2">
                <i class="ph ph-info text-blue-600 dark:text-blue-400 text-lg flex-shrink-0"></i>
                <p class="text-xs text-blue-800 dark:text-blue-300">
                  Le collaborateur recevra un email avec un lien d'invitation valable 7 jours.
                </p>
              </div>
            </div>

            <!-- Error -->
            @if (error()) {
              <div class="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-lg p-3">
                <p class="text-sm text-rose-600 dark:text-rose-400">{{ error() }}</p>
              </div>
            }

            <!-- Actions -->
            <div class="flex gap-3 pt-2">
              <button 
                type="button"
                (click)="close()"
                [disabled]="isSubmitting()"
                class="flex-1 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition disabled:opacity-50">
                Annuler
              </button>
              <button 
                type="submit"
                [disabled]="isSubmitting() || !email || !selectedRole"
                class="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold hover:shadow-lg transition disabled:opacity-50">
                @if (isSubmitting()) {
                  <i class="ph ph-spinner animate-spin mr-2"></i>
                }
                Envoyer l'invitation
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
  styles: []
})
export class InviteDialogComponent {
  @Input() visible = signal(false);
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() invitationSent = new EventEmitter<void>();

  private invitationsApi = inject(InvitationsApi);
  private auth = inject(AuthService);

  email = '';
  selectedRole = '';
  message = '';
  isSubmitting = signal(false);
  error = signal('');

  private allRoles = [
    { value: 'TenantAdmin', label: 'Administrateur', description: 'Accès complet, peut gérer l\'équipe' },
    { value: 'TenantManager', label: 'Manager', description: 'Peut créer et modifier des données' },
    { value: 'TenantUser', label: 'Utilisateur', description: 'Peut consulter et créer des données' },
    { value: 'ReadOnly', label: 'Lecture seule', description: 'Consultation uniquement' }
  ];

  canInvite(): boolean {
    return this.auth.hasPermission(Permissions.UsersInvite);
  }

  canAssignRoles(): boolean {
    return this.auth.hasPermission(Permissions.RolesAssign);
  }

  availableRoles() {
    if (this.canAssignRoles()) return this.allRoles;
    return this.allRoles.filter(r => r.value !== 'TenantAdmin');
  }

  getRoleDescription(role: string): string {
    return this.allRoles.find(r => r.value === role)?.description || '';
  }

  onBackdropClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('backdrop-blur-sm')) {
      this.close();
    }
  }

  close() {
    this.visible.set(false);
    this.visibleChange.emit(false);
    this.resetForm();
  }

  resetForm() {
    this.email = '';
    this.selectedRole = '';
    this.message = '';
    this.error.set('');
  }

  onSubmit() {
    if (this.isSubmitting()) return;

    if (!this.canInvite()) {
      this.error.set('Accès refusé');
      return;
    }

    if (!this.canAssignRoles() && this.selectedRole === 'TenantAdmin') {
      this.selectedRole = '';
      this.error.set('Accès refusé');
      return;
    }

    this.error.set('');
    this.isSubmitting.set(true);

    this.invitationsApi.inviteCollaborator({
      email: this.email,
      role: this.selectedRole,
      message: this.message || undefined
    }).subscribe({
      next: (response: any) => {
        void response;
        this.isSubmitting.set(false);
        this.invitationSent.emit();
        this.close();
        
        // Show success message (you can use a toast service)
        alert(`✅ Invitation envoyée à ${this.email}`);
      },
      error: (err: any) => {
        console.error('Failed to send invitation:', err);
        this.error.set(err.error?.error || 'Erreur lors de l\'envoi de l\'invitation');
        this.isSubmitting.set(false);
      }
    });
  }
}
