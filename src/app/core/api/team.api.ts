import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environnements/environment';

export interface TeamMemberDto {
  id: string;
  userId: string;
  userEmail: string;
  userFirstName: string;
  userLastName: string;
  role: string;
  invitedAt: string;
  acceptedAt?: string;
  isActive: boolean;
}

export interface InviteTeamMemberRequest {
  email: string;
  role: string;
}

export interface InviteTeamMemberResponse {
  teamMemberId: string;
  email: string;
  role: string;
  invitedAt: string;
}

export interface UpdateTeamMemberRoleRequest {
  newRole: string;
}

export interface AcceptInvitationRequest {
  token: string;
}

export interface AcceptInvitationResponse {
  teamMemberId: string;
  organizationId: string;
  organizationName: string;
  role: string;
  email: string;
}

@Injectable({ providedIn: 'root' })
export class TeamApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.BASE_LOCAGUEST_API}/api/Team`;

  getTeamMembers(activeOnly: boolean = true): Observable<TeamMemberDto[]> {
    return this.http.get<TeamMemberDto[]>(`${this.baseUrl}?activeOnly=${activeOnly}`);
  }

  inviteTeamMember(request: InviteTeamMemberRequest): Observable<InviteTeamMemberResponse> {
    return this.http.post<InviteTeamMemberResponse>(`${this.baseUrl}/invite`, request);
  }

  updateTeamMemberRole(teamMemberId: string, request: UpdateTeamMemberRoleRequest): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${teamMemberId}/role`, request);
  }

  removeTeamMember(teamMemberId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${teamMemberId}`);
  }

  acceptInvitation(request: AcceptInvitationRequest): Observable<AcceptInvitationResponse> {
    return this.http.post<AcceptInvitationResponse>(`${this.baseUrl}/accept-invitation`, request);
  }
}
