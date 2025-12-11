import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environnements/environment';

export interface UserProfile {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  role?: string;
  bio?: string;
  photoUrl?: string;
}

export interface UpdateUserProfileRequest {
  firstName: string;
  lastName: string;
  phone?: string;
  company?: string;
  role?: string;
  bio?: string;
}

export interface UserPreferences {
  darkMode: boolean;
  language: string;
  timezone: string;
  dateFormat: string;
  currency: string;
  sidebarNavigation: boolean;
  headerNavigation: boolean;
}

export interface NotificationSettings {
  paymentReceived: boolean;
  paymentOverdue: boolean;
  paymentReminder: boolean;
  contractSigned: boolean;
  contractExpiring: boolean;
  contractRenewal: boolean;
  newTenantRequest: boolean;
  tenantCheckout: boolean;
  maintenanceRequest: boolean;
  maintenanceCompleted: boolean;
  systemUpdates: boolean;
  marketingEmails: boolean;
}

@Injectable({ providedIn: 'root' })
export class UsersApi {
  private http = inject(HttpClient);
  private baseUrl = `${environment.BASE_LOCAGUEST_API}/api/users`;

  // Profile
  getUserProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.baseUrl}/profile`);
  }

  updateUserProfile(profile: UpdateUserProfileRequest): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${this.baseUrl}/profile`, profile);
  }

  // Preferences
  getUserPreferences(): Observable<UserPreferences> {
    return this.http.get<UserPreferences>(`${this.baseUrl}/preferences`);
  }

  updateUserPreferences(prefs: UserPreferences): Observable<UserPreferences> {
    return this.http.put<UserPreferences>(`${this.baseUrl}/preferences`, prefs);
  }

  // Notifications
  getNotificationSettings(): Observable<NotificationSettings> {
    return this.http.get<NotificationSettings>(`${this.baseUrl}/notifications`);
  }

  updateNotificationSettings(settings: NotificationSettings): Observable<NotificationSettings> {
    return this.http.put<NotificationSettings>(`${this.baseUrl}/notifications`, settings);
  }

  // Photo upload
  uploadProfilePhoto(file: File): Observable<UserProfile> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<UserProfile>(`${this.baseUrl}/profile/photo`, formData);
  }
}
