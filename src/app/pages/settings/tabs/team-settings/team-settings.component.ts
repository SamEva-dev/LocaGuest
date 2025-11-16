import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InvitationsApi, TeamMember, UserInvitation } from '../../../../core/api/invitations.api';
import { InviteDialogComponent } from '../../../../shared/components/invite-dialog/invite-dialog.component';

@Component({
  selector: 'team-settings',
  standalone: true,
  imports: [CommonModule, InviteDialogComponent],
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
          (click)="openInviteDialog()"
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
              <p class="text-2xl font-bold text-slate-800 dark:text-white">{{ teamMembers().length }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <i class="ph ph-clock text-2xl text-orange-600 dark:text-orange-400"></i>
            </div>
            <div>
              <p class="text-sm text-slate-500 dark:text-slate-400">Invitations en attente</p>
              <p class="text-2xl font-bold text-slate-800 dark:text-white">{{ pendingInvitations().length }}</p>
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
      </div>

      <!-- Tabs -->
      <div class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
        <div class="flex border-b border-slate-200 dark:border-slate-700 px-4">
          <button
            (click)="activeTab.set('members')"
            [class.border-b-2]="activeTab() === 'members'"
            [class.border-emerald-500]="activeTab() === 'members'"
            [class.text-emerald-600]="activeTab() === 'members'"
            class="px-4 py-3 text-sm font-medium transition">
            <i class="ph ph-users-three mr-2"></i>
            Membres ({{ teamMembers().length }})
          </button>
          <button
            (click)="activeTab.set('invitations')"
            [class.border-b-2]="activeTab() === 'invitations'"
            [class.border-emerald-500]="activeTab() === 'invitations'"
            [class.text-emerald-600]="activeTab() === 'invitations'"
            class="px-4 py-3 text-sm font-medium transition">
            <i class="ph ph-envelope mr-2"></i>
            Invitations ({{ pendingInvitations().length }})
          </button>
        </div>

        <div class="p-6">
          @if (isLoading()) {
            <div class="flex items-center justify-center py-12">
              <i class="ph ph-spinner text-4xl animate-spin text-slate-400"></i>
            </div>
          } @else {
            @if (activeTab() === 'members') {
              <!-- Team Members List -->
              @if (teamMembers().length > 0) {
                <div class="space-y-3">
                  @for (member of teamMembers(); track member.id) {
                    <div class="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition">
                      <div class="flex items-center gap-4">
                        <div class="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-lg">
                          {{ getInitials(member.fullName) }}
                        </div>
                        <div>
                          <h4 class="font-semibold text-slate-800 dark:text-white">{{ member.fullName }}</h4>
                          <p class="text-sm text-slate-500 dark:text-slate-400">{{ member.email }}</p>
                        </div>
                      </div>

                      <div class="flex items-center gap-3">
                        <span [class]="getRoleBadgeClass(member.role)">
                          {{ getRoleLabel(member.role) }}
                        </span>
                        
                        @if (member.status === 'Active') {
                          <span class="text-xs px-2 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                            Actif
                          </span>
                        } @else {
                          <span class="text-xs px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
                            Inactif
                          </span>
                        }

                        <button class="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition">
                          <i class="ph ph-dots-three-vertical text-lg text-slate-600 dark:text-slate-400"></i>
                        </button>
                      </div>
                    </div>
                  }
                </div>
              } @else {
                <div class="text-center py-12">
                  <i class="ph ph-users-three text-6xl text-slate-300 dark:text-slate-600 mb-4"></i>
                  <p class="text-slate-600 dark:text-slate-400">Aucun membre dans l'équipe</p>
                </div>
              }
            } @else {
              <!-- Pending Invitations List -->
              @if (pendingInvitations().length > 0) {
                <div class="space-y-3">
                  @for (invitation of pendingInvitations(); track invitation.id) {
                    <div class="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition">
                      <div class="flex items-center gap-4">
                        <div class="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                          <i class="ph ph-envelope text-2xl text-orange-600 dark:text-orange-400"></i>
                        </div>
                        <div>
                          <h4 class="font-semibold text-slate-800 dark:text-white">{{ invitation.email }}</h4>
                          <p class="text-xs text-slate-500 dark:text-slate-400">
                            Invité par {{ invitation.inviterName || 'Administrateur' }} • {{ getTimeAgo(invitation.createdAt) }}
                          </p>
                        </div>
                      </div>

                      <div class="flex items-center gap-3">
                        <span [class]="getRoleBadgeClass(invitation.role)">
                          {{ getRoleLabel(invitation.role) }}
                        </span>

                        <span class="text-xs px-2 py-1 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400">
                          En attente
                        </span>

                        <button 
                          (click)="resendInvitation(invitation.id)"
                          class="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
                          title="Renvoyer l'invitation">
                          <i class="ph ph-paper-plane-tilt text-lg text-slate-600 dark:text-slate-400"></i>
                        </button>

                        <button 
                          (click)="revokeInvitation(invitation.id)"
                          class="p-2 hover:bg-rose-100 dark:hover:bg-rose-900/30 rounded-lg transition"
                          title="Révoquer l'invitation">
                          <i class="ph ph-x text-lg text-rose-600 dark:text-rose-400"></i>
                        </button>
                      </div>
                    </div>
                  }
                </div>
              } @else {
                <div class="text-center py-12">
                  <i class="ph ph-envelope text-6xl text-slate-300 dark:text-slate-600 mb-4"></i>
                  <p class="text-slate-600 dark:text-slate-400">Aucune invitation en attente</p>
                </div>
              }
            }
          }
        </div>
      </div>
    </div>

    <!-- Invite Dialog -->
    <invite-dialog 
      [visible]="showInviteDialog"
      (visibleChange)="showInviteDialog.set($event)"
      (invitationSent)="onInvitationSent()"
    />
  `,
  styles: []
})
export class TeamSettingsComponent implements OnInit {
  private invitationsApi = inject(InvitationsApi);

  activeTab = signal<'members' | 'invitations'>('members');
  isLoading = signal(false);
  teamMembers = signal<TeamMember[]>([]);
  pendingInvitations = signal<UserInvitation[]>([]);
  showInviteDialog = signal(false);

  ngOnInit() {
    this.loadData();
  }

  getAdminCount(): number {
    return this.teamMembers().filter(m => 
      m.role === 'TenantAdmin' || m.role === 'TenantOwner'
    ).length;
  }

  loadData() {
    this.isLoading.set(true);
    
    // Load team members
    this.invitationsApi.getTeamMembers().subscribe({
      next: (members) => {
        this.teamMembers.set(members);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load team members:', err);
        this.isLoading.set(false);
      }
    });

    // Load pending invitations
    this.invitationsApi.getPendingInvitations().subscribe({
      next: (invitations) => {
        this.pendingInvitations.set(invitations);
      },
      error: (err) => {
        console.error('Failed to load invitations:', err);
      }
    });
  }

  openInviteDialog() {
    this.showInviteDialog.set(true);
  }

  onInvitationSent() {
    // Reload data
    this.loadData();
  }

  getInitials(fullName: string): string {
    return fullName
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  getRoleLabel(role: string): string {
    const labels: Record<string, string> = {
      'TenantOwner': 'Propriétaire',
      'TenantAdmin': 'Administrateur',
      'TenantManager': 'Manager',
      'TenantUser': 'Utilisateur',
      'ReadOnly': 'Lecture seule'
    };
    return labels[role] || role;
  }

  getRoleBadgeClass(role: string): string {
    const baseClass = 'text-xs px-2 py-1 rounded-full font-medium';
    const roleColors: Record<string, string> = {
      'TenantOwner': 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
      'TenantAdmin': 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
      'TenantManager': 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
      'TenantUser': 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300',
      'ReadOnly': 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
    };
    return `${baseClass} ${roleColors[role] || roleColors['TenantUser']}`;
  }

  getTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Aujourd\'hui';
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    return new Date(date).toLocaleDateString('fr-FR');
  }

  resendInvitation(invitationId: string) {
    if (!confirm('Renvoyer l\'invitation?')) return;

    this.invitationsApi.resendInvitation(invitationId).subscribe({
      next: () => {
        alert('✅ Invitation renvoyée');
      },
      error: (err) => {
        console.error('Failed to resend invitation:', err);
        alert('❌ Erreur lors du renvoi de l\'invitation');
      }
    });
  }

  revokeInvitation(invitationId: string) {
    if (!confirm('Êtes-vous sûr de vouloir révoquer cette invitation?')) return;

    this.invitationsApi.revokeInvitation(invitationId).subscribe({
      next: () => {
        alert('✅ Invitation révoquée');
        this.loadData();
      },
      error: (err) => {
        console.error('Failed to revoke invitation:', err);
        alert('❌ Erreur lors de la révocation');
      }
    });
  }
}
