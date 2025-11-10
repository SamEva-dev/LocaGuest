import { Injectable, inject, signal } from '@angular/core';
import { SettingsApi, UserSettings, UpdateUserSettingsRequest } from '../api/settings.api';
import { Observable, catchError, of, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private settingsApi = inject(SettingsApi);

  // Signals for reactive state
  userSettings = signal<UserSettings | null>(null);
  loading = signal(false);

  getUserSettings(): Observable<UserSettings> {
    this.loading.set(true);
    return this.settingsApi.getUserSettings().pipe(
      tap(settings => {
        this.userSettings.set(settings);
        this.loading.set(false);
      }),
      catchError((err: unknown) => {
        console.error('Error loading user settings:', err);
        this.loading.set(false);
        throw err;
      })
    );
  }

  updateUserSettings(settings: UpdateUserSettingsRequest): Observable<UserSettings> {
    this.loading.set(true);
    return this.settingsApi.updateUserSettings(settings).pipe(
      tap(updatedSettings => {
        this.userSettings.set(updatedSettings);
        this.loading.set(false);
      }),
      catchError((err: unknown) => {
        console.error('Error updating user settings:', err);
        this.loading.set(false);
        throw err;
      })
    );
  }

  // Clear all data
  clear(): void {
    this.userSettings.set(null);
  }
}
