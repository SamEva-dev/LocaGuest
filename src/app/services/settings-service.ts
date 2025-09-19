import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private http = inject(HttpClient);

  profile = signal({
    firstName: 'John',
    lastName: 'Doe',
    email: 'demo@locaguest.com',
    phone: '+33 6 12 34 56 78',
    company: 'LocaGuest SARL',
    role: 'Propriétaire',
    bio: "Gestionnaire immobilier avec 5 ans d'expérience dans la location saisonnière."
  });

  notifications = signal({
    email: true,
    sms: false,
    bookings: true,
    reminders: true,
    reports: true
  });

  preferences = signal({
    darkMode: false,
    language: 'fr',
    timezone: 'Europe/Paris',
    dateFormat: 'DD/MM/YYYY',
    currency: 'EUR'
  });

  load() {
    // Simule un GET API
    setTimeout(() => {
      console.log('Settings loaded depuis backend simulé');
    }, 300);
  }

  save() {
    // Simule un POST API
    console.log('Settings sauvegardés', {
      profile: this.profile(),
      notifications: this.notifications(),
      preferences: this.preferences()
    });
  }
}
