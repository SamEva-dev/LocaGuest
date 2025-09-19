import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';


type Tab = 'profile' | 'notifications' | 'security' | 'billing' | 'preferences';


@Component({
  selector: 'app-settings',
  imports: [],
  templateUrl: './settings.html',
  styleUrl: './settings.scss'
})
export class Settings {
private router = inject(Router);

 activeTab = signal<Tab>('profile');

  // Profil
  user = signal({
    firstName: 'John',
    lastName: 'Doe',
    email: 'demo@locaguest.com',
    phone: '+33 6 12 34 56 78',
    company: 'LocaGuest SARL',
    role: 'Propriétaire',
    bio: "Gestionnaire immobilier avec 5 ans d'expérience dans la location saisonnière."
  });

  // Notifications
  emailNotif = signal(true);
  smsNotif = signal(false);
  bookingsNotif = signal(true);
  paymentNotif = signal(true);
  reportNotif = signal(true);

  // Sécurité
  showPassword = signal(false);
  sessions = signal([
    { device: 'Chrome sur Windows', location: 'Paris, France • Actuelle session', current: true },
    { device: 'Safari sur iPhone', location: 'Paris, France • Il y a 2 heures', current: false }
  ]);

  // Facturation
  invoices = signal([
    { date: '15 Mar 2024', amount: '49€', status: 'Payé' },
    { date: '15 Fév 2024', amount: '49€', status: 'Payé' },
    { date: '15 Jan 2024', amount: '49€', status: 'Payé' }
  ]);

  // Préférences
  darkMode = signal(false);
  language = signal('fr');
  timezone = signal('Europe/Paris (GMT+1)');
  dateFormat = signal('DD/MM/YYYY');
  currency = signal('EUR');

  save() {
    console.log('✅ Paramètres sauvegardés', {
      user: this.user(),
      notif: {
        email: this.emailNotif(),
        sms: this.smsNotif(),
        bookings: this.bookingsNotif(),
        payments: this.paymentNotif(),
        reports: this.reportNotif()
      },
      prefs: {
        dark: this.darkMode(),
        lang: this.language(),
        tz: this.timezone(),
        dateFmt: this.dateFormat(),
        currency: this.currency()
      }
    });
  }

  reset() {
    window.location.reload();
  }

  deleteAccount() {
    if (confirm('Êtes-vous sûr de vouloir supprimer votre compte ?')) {
      console.log('Compte supprimé');
      this.router.navigate(['/']);
    }
  }
}
