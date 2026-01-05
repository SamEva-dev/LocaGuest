import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environnements/environment';

export interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  role?: string;
  bio?: string;
  photoUrl?: string;
}

export interface NotificationSettings {
  emailAlerts: boolean;
  smsAlerts: boolean;
  newReservations: boolean;
  paymentReminders: boolean;
  monthlyReports: boolean;
}

export interface Preferences {
  darkMode: boolean;
  language: string;
  timezone: string;
  dateFormat: string;
  currency: string;
}

export interface InterfaceSettings {
  sidebarNavigation: boolean;
  headerNavigation: boolean;
}

export interface UserSettings {
  profile: UserProfile;
  notifications: NotificationSettings;
  preferences: Preferences;
  interface: InterfaceSettings;
}

export interface UpdateUserSettingsRequest {
  profile?: UserProfile;
  notifications?: NotificationSettings;
  preferences?: Preferences;
  interface?: InterfaceSettings;
}

@Injectable({ providedIn: 'root' })
export class SettingsApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.BASE_LOCAGUEST_API}/api/Settings`;

  getUserSettings(): Observable<UserSettings> {
    return this.http.get<UserSettings>(this.baseUrl);
  }

  updateUserSettings(settings: UpdateUserSettingsRequest): Observable<UserSettings> {
    return this.http.put<UserSettings>(this.baseUrl, settings);
  }
}
