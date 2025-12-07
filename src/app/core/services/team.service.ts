import { Injectable, inject, signal } from '@angular/core';
import { TeamApi, TeamMemberDto, InviteTeamMemberRequest } from '../api/team.api';
import { Observable, tap, catchError, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TeamService {
  private teamApi = inject(TeamApi);

  // Signals pour état réactif
  teamMembers = signal<TeamMemberDto[]>([]);
  loading = signal(false);

  loadTeamMembers(activeOnly: boolean = true): Observable<TeamMemberDto[]> {
    this.loading.set(true);
    return this.teamApi.getTeamMembers(activeOnly).pipe(
      tap(members => {
        this.teamMembers.set(members);
        this.loading.set(false);
      }),
      catchError((err: unknown) => {
        console.error('Error loading team members:', err);
        this.loading.set(false);
        throw err;
      })
    );
  }

  inviteTeamMember(request: InviteTeamMemberRequest): Observable<any> {
    this.loading.set(true);
    return this.teamApi.inviteTeamMember(request).pipe(
      tap(() => {
        this.loading.set(false);
        // Recharger la liste après invitation
        this.loadTeamMembers().subscribe();
      }),
      catchError((err: unknown) => {
        console.error('Error inviting team member:', err);
        this.loading.set(false);
        throw err;
      })
    );
  }

  updateTeamMemberRole(teamMemberId: string, newRole: string): Observable<void> {
    this.loading.set(true);
    return this.teamApi.updateTeamMemberRole(teamMemberId, { newRole }).pipe(
      tap(() => {
        this.loading.set(false);
        // Recharger la liste après modification
        this.loadTeamMembers().subscribe();
      }),
      catchError((err: unknown) => {
        console.error('Error updating team member role:', err);
        this.loading.set(false);
        throw err;
      })
    );
  }

  removeTeamMember(teamMemberId: string): Observable<void> {
    this.loading.set(true);
    return this.teamApi.removeTeamMember(teamMemberId).pipe(
      tap(() => {
        this.loading.set(false);
        // Recharger la liste après suppression
        this.loadTeamMembers().subscribe();
      }),
      catchError((err: unknown) => {
        console.error('Error removing team member:', err);
        this.loading.set(false);
        throw err;
      })
    );
  }

  // Utilitaire pour obtenir le label d'un rôle
  getRoleLabel(role: string): string {
    switch (role) {
      case 'Owner': return 'Propriétaire';
      case 'Admin': return 'Administrateur';
      case 'Manager': return 'Gestionnaire';
      case 'Accountant': return 'Comptable';
      case 'Viewer': return 'Lecture seule';
      default: return role;
    }
  }

  // Clear all data
  clear(): void {
    this.teamMembers.set([]);
  }
}
