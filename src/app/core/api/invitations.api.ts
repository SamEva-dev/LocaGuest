import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environnements/environment';

export interface InviteCollaboratorDto {
  email: string;
  role: string;
  message?: string;
}

export interface InvitationResponse {
  invitationId: string;
  email: string;
  role: string;
  invitationUrl: string;
  expiresAt: Date;
}

export interface UserInvitation {
  id: string;
  email: string;
  role: string;
  status: 'Pending' | 'Accepted' | 'Expired' | 'Revoked';
  invitedBy: string;
  inviterName?: string;
  expiresAt: Date;
  createdAt: Date;
  acceptedAt?: Date;
}

export interface TeamMember {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: string;
  status: 'Active' | 'Inactive';
  lastLogin?: Date;
  createdAt: Date;
}

@Injectable({ providedIn: 'root' })
export class InvitationsApi {
  private http = inject(HttpClient);
  private baseUrl = `${environment.BASE_AUTH_API}/api/auth`;

  /**
   * Invite a new collaborator
   */
  inviteCollaborator(dto: InviteCollaboratorDto): Observable<InvitationResponse> {
    return this.http.post<InvitationResponse>(`${this.baseUrl}/invite`, dto);
  }

  /**
   * Get all pending invitations for current tenant
   */
  getPendingInvitations(): Observable<UserInvitation[]> {
    return this.http.get<UserInvitation[]>(`${this.baseUrl}/invitations/pending`);
  }

  /**
   * Get invitation info by token (public)
   */
  getInvitationByToken(token: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/invitation/${token}`);
  }

  /**
   * Accept an invitation (public)
   */
  acceptInvitation(data: {
    token: string;
    password: string;
    firstName: string;
    lastName: string;
  }): Observable<any> {
    return this.http.post(`${this.baseUrl}/accept-invitation`, data);
  }

  /**
   * Revoke an invitation
   */
  revokeInvitation(invitationId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/invitations/${invitationId}`);
  }

  /**
   * Resend invitation email
   */
  resendInvitation(invitationId: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/invitations/${invitationId}/resend`, {});
  }

  /**
   * Get all team members
   */
  getTeamMembers(): Observable<TeamMember[]> {
    return this.http.get<TeamMember[]>(`${this.baseUrl}/team/members`);
  }

  /**
   * Update user role
   */
  updateUserRole(userId: string, role: string): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/team/members/${userId}/role`, { role });
  }

  /**
   * Deactivate user
   */
  deactivateUser(userId: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/team/members/${userId}/deactivate`, {});
  }
}
