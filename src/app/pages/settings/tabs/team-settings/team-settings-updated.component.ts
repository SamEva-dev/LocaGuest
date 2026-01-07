import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TeamService } from '../../../../core/services/team.service';
import { TeamMemberDto } from '../../../../core/api/team.api';

@Component({
  selector: 'team-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-6 space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-2xl font-bold text-slate-800 dark:text-white">Équipe</h2>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Gérez les membres de votre équipe et leurs permissions
          </p>
        </div>
        <button 
          (click)="showInviteDialog.set(true)"
          class="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold hover:shadow-lg transition">
          <i class="ph ph-plus mr-2"></i>
          Inviter un collaborateur
        </button>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <i class="ph ph-users-three text-2xl text-emerald-600 dark:text-emerald-400"></i>
            </div>
            <div>
              <p class="text-sm text-slate-500 dark:text-slate-400">Membres actifs</p>
              <p class="text-2xl font-bold text-slate-800 dark:text-white">{{ teamService.teamMembers().length }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <i class="ph ph-shield-check text-2xl text-blue-600 dark:text-blue-400"></i>
            </div>
            <div>
              <p class="text-sm text-slate-500 dark:text-slate-400">Administrateurs</p>
              <p class="text-2xl font-bold text-slate-800 dark:text-white">
                {{ getAdminCount() }}
              </p>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <i class="ph ph-crown text-2xl text-purple-600 dark:text-purple-400"></i>
            </div>
            <div>
              <p class="text-sm text-slate-500 dark:text-slate-400">Propriétaires</p>
              <p class="text-2xl font-bold text-slate-800 dark:text-white">
                {{ getOwnerCount() }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Team Members List -->
      <div class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
        <div class="p-6">
          <h3 class="text-lg font-semibold text-slate-800 dark:text-white mb-4">
            <i class="ph ph-users-three mr-2"></i>
            Membres de l'équipe ({{ teamService.teamMembers().length }})
          </h3>

          @if (teamService.loading()) {
            <div class="flex items-center justify-center py-12">
              <i class="ph ph-spinner text-4xl animate-spin text-slate-400"></i>
            </div>
          } @else {
            @if (teamService.teamMembers().length > 0) {
              <div class="space-y-3">
                @for (member of teamService.teamMembers(); track member.id) {
                  <div class="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition">
                    <div class="flex items-center gap-4">
                      <div class="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-lg">
                        {{ getInitials(member.userEmail) }}
                      </div>
                      <div>
                        <h4 class="font-semibold text-slate-800 dark:text-white">
                          {{ member.userFirstName || member.userLastName ? (member.userFirstName + ' ' + member.userLastName) : member.userEmail }}
                        </h4>
                        <p class="text-sm text-slate-500 dark:text-slate-400">{{ member.userEmail }}</p>
                        @if (!member.acceptedAt) {
                          <span class="text-xs text-orange-600 dark:text-orange-400">
                            <i class="ph ph-clock mr-1"></i>
                            Invitation en attente
                          </span>
                        }
                      </div>
                    </div>

                    <div class="flex items-center gap-3">
                      <!-- Role Badge -->
                      <span [class]="getRoleBadgeClass(member.role)">
                        {{ teamService.getRoleLabel(member.role) }}
                      </span>
                      
                      <!-- Status Badge -->
                      @if (member.isActive) {
                        <span class="text-xs px-2 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                          Actif
                        </span>
                      } @else {
                        <span class="text-xs px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
                          Inactif
                        </span>
                      }

                      <!-- Actions Dropdown -->
                      @if (member.role !== 'Owner') {
                        <div class="relative">
                          <button 
                            (click)="toggleMemberMenu(member.id)"
                            class="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition">
                            <i class="ph ph-dots-three-vertical text-lg text-slate-600 dark:text-slate-400"></i>
                          </button>

                          @if (selectedMemberId() === member.id) {
                            <div class="absolute right-0 mt-2 w-48 rounded-lg bg-white dark:bg-slate-800 shadow-lg border border-slate-200 dark:border-slate-700 z-10">
                              <button
                                (click)="openChangeRoleDialog(member)"
                                class="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition">
                                <i class="ph ph-shield mr-2"></i>
                                Changer le rôle
                              </button>
                              <button
                                (click)="removeMember(member)"
                                class="w-full px-4 py-2 text-left text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition">
                                <i class="ph ph-trash mr-2"></i>
                                Retirer
                              </button>
                            </div>
                          }
                        </div>
                      }
                    </div>
                  </div>
                }
              </div>
            } @else {
              <div class="text-center py-12">
                <i class="ph ph-users-three text-6xl text-slate-300 dark:text-slate-600 mb-4"></i>
                <p class="text-slate-600 dark:text-slate-400">Aucun membre dans l'équipe</p>
                <button 
                  (click)="showInviteDialog.set(true)"
                  class="mt-4 px-4 py-2 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition">
                  <i class="ph ph-plus mr-2"></i>
                  Inviter le premier membre
                </button>
              </div>
            }
          }
        </div>
      </div>
    </div>

    <!-- Invite Dialog -->
    @if (showInviteDialog()) {
      <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div class="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md" (click)="$event.stopPropagation()">
          <h3 class="text-xl font-bold text-slate-800 dark:text-white mb-4">
            Inviter un collaborateur
          </h3>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Adresse email
              </label>
              <input
                type="email"
                [(ngModel)]="inviteEmail"
                placeholder="nom@exemple.com"
                class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white">
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Rôle
              </label>
              <select
                [(ngModel)]="inviteRole"
                class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white">
                <option value="Admin">Administrateur</option>
                <option value="Manager">Gestionnaire</option>
                <option value="Accountant">Comptable</option>
                <option value="Viewer">Lecture seule</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Message (optionnel)
              </label>
              <textarea
                [(ngModel)]="inviteMessage"
                rows="3"
                placeholder="Ajouter un message..."
                class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white"></textarea>
            </div>
          </div>

          <div class="flex gap-3 mt-6">
            <button
              (click)="showInviteDialog.set(false)"
              class="flex-1 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition">
              Annuler
            </button>
            <button
              (click)="sendInvitation()"
              [disabled]="!inviteEmail"
              class="flex-1 px-4 py-2 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition">
              Envoyer l'invitation
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Change Role Dialog -->
    @if (showChangeRoleDialog()) {
      <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" (click)="showChangeRoleDialog.set(false)">
        <div class="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md" (click)="$event.stopPropagation()">
          <h3 class="text-xl font-bold text-slate-800 dark:text-white mb-4">
            Modifier le rôle
          </h3>

          <div class="mb-4">
            <p class="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Changer le rôle de <strong>{{ selectedMemberForRoleChange()?.userEmail }}</strong>
            </p>

            <select
              [(ngModel)]="newRole"
              class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white">
              <option value="Admin">Administrateur</option>
              <option value="Manager">Gestionnaire</option>
              <option value="Accountant">Comptable</option>
              <option value="Viewer">Lecture seule</option>
            </select>
          </div>

          <div class="flex gap-3">
            <button
              (click)="showChangeRoleDialog.set(false)"
              class="flex-1 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition">
              Annuler
            </button>
            <button
              (click)="updateRole()"
              class="flex-1 px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition">
              Mettre à jour
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: []
})
export class TeamSettingsComponent implements OnInit {
  teamService = inject(TeamService);

  showInviteDialog = signal(false);
  showChangeRoleDialog = signal(false);
  selectedMemberId = signal<string | null>(null);
  selectedMemberForRoleChange = signal<TeamMemberDto | null>(null);

  inviteEmail = '';
  inviteRole = 'Viewer';
  inviteMessage = '';
  newRole = '';

  ngOnInit() {
    this.teamService.loadTeamMembers().subscribe();
  }

  getAdminCount(): number {
    return this.teamService.teamMembers().filter(m => m.role === 'Admin').length;
  }

  getOwnerCount(): number {
    return this.teamService.teamMembers().filter(m => m.role === 'Owner').length;
  }

  getInitials(email: string): string {
    return email.substring(0, 2).toUpperCase();
  }

  getRoleBadgeClass(role: string): string {
    const baseClass = 'text-xs px-2 py-1 rounded-full font-medium';
    const roleColors: Record<string, string> = {
      'Owner': 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
      'Admin': 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
      'Manager': 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
      'Accountant': 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
      'Viewer': 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
    };
    return `${baseClass} ${roleColors[role] || roleColors['Viewer']}`;
  }

  toggleMemberMenu(memberId: string) {
    if (this.selectedMemberId() === memberId) {
      this.selectedMemberId.set(null);
    } else {
      this.selectedMemberId.set(memberId);
    }
  }

  sendInvitation() {
    if (!this.inviteEmail) return;

    this.teamService.inviteTeamMember({ 
      email: this.inviteEmail, 
      role: this.inviteRole,
      message: this.inviteMessage || undefined
    }).subscribe({
      next: () => {
        alert('✅ Invitation envoyée avec succès');
        this.showInviteDialog.set(false);
        this.inviteEmail = '';
        this.inviteRole = 'Viewer';
        this.inviteMessage = '';
      },
      error: (err) => {
        console.error('Failed to send invitation:', err);
        alert('❌ Erreur lors de l\'envoi de l\'invitation');
      }
    });
  }

  openChangeRoleDialog(member: TeamMemberDto) {
    this.selectedMemberForRoleChange.set(member);
    this.newRole = member.role;
    this.showChangeRoleDialog.set(true);
    this.selectedMemberId.set(null);
  }

  updateRole() {
    const member = this.selectedMemberForRoleChange();
    if (!member) return;

    this.teamService.updateTeamMemberRole(member.id, this.newRole).subscribe({
      next: () => {
        alert('✅ Rôle modifié avec succès');
        this.showChangeRoleDialog.set(false);
        this.selectedMemberForRoleChange.set(null);
      },
      error: (err) => {
        console.error('Failed to update role:', err);
        alert('❌ Erreur lors de la modification du rôle');
      }
    });
  }

  removeMember(member: TeamMemberDto) {
    if (!confirm(`Êtes-vous sûr de vouloir retirer ${member.userEmail} de l'équipe?`)) return;

    this.teamService.removeTeamMember(member.id).subscribe({
      next: () => {
        alert('✅ Membre retiré avec succès');
        this.selectedMemberId.set(null);
      },
      error: (err) => {
        console.error('Failed to remove member:', err);
        alert('❌ Erreur lors du retrait du membre');
      }
    });
  }
}
