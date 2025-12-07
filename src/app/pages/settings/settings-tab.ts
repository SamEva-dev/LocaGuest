import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { SettingsService } from '../../core/services/settings.service';
import { ThemeService } from '../../core/services/theme.service';
import { UserProfile, NotificationSettings, Preferences, InterfaceSettings } from '../../core/api/settings.api';
import { TeamSettingsComponent } from './tabs/team-settings/team-settings-updated.component';

@Component({
  selector: 'settings-tab',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe, TeamSettingsComponent],
  templateUrl: './settings-tab.html'
})
export class SettingsTab implements OnInit {
  private settingsService = inject(SettingsService);
  private themeService = inject(ThemeService);
  private translate = inject(TranslateService);
  
  activeSubTab = signal('profile');

  // Profile settings
  profileData = signal<UserProfile>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    role: '',
    bio: ''
  });

  // Notification settings
  notifications = signal<NotificationSettings>({
    emailAlerts: false,
    smsAlerts: false,
    newReservations: false,
    paymentReminders: false,
    monthlyReports: false
  });

  // Preferences
  preferences = signal<Preferences>({
    darkMode: false,
    language: 'fr',
    timezone: 'Europe/Paris',
    dateFormat: 'DD/MM/YYYY',
    currency: 'EUR'
  });

  // Interface settings
  interface = signal<InterfaceSettings>({
    sidebarNavigation: true,
    headerNavigation: false
  });

  // Billing
  billingInfo = signal({
    plan: 'Professionnel',
    price: 49,
    renewalDate: '15/04/2024',
    paymentMethod: '**** **** **** 4242',
    cardExpiry: '12/26'
  });

  invoices = signal([
    { date: '15 Mar 2024', type: 'Abonnement mensuel', amount: 49, status: 'Payé' },
    { date: '15 Fev 2024', type: 'Abonnement mensuel', amount: 49, status: 'Payé' },
    { date: '15 Jan 2024', type: 'Abonnement mensuel', amount: 49, status: 'Payé' }
  ]);

  // Security
  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  activeSessions = [
    { id: '1', device: 'Chrome sur Windows', location: 'Paris, France', time: 'Actuelle session', current: true },
    { id: '2', device: 'Safari sur iPhone', location: 'Paris, France', time: 'il y a 2 heures', current: false }
  ];

  notificationsList = [
    { key: 'emailAlerts', label: 'SETTINGS.NOTIFICATIONS.EMAIL_ALERTS', desc: 'SETTINGS.NOTIFICATIONS.EMAIL_ALERTS_DESC' },
    { key: 'smsAlerts', label: 'SETTINGS.NOTIFICATIONS.SMS_ALERTS', desc: 'SETTINGS.NOTIFICATIONS.SMS_ALERTS_DESC' },
    { key: 'newReservations', label: 'SETTINGS.NOTIFICATIONS.NEW_RESERVATIONS', desc: 'SETTINGS.NOTIFICATIONS.NEW_RESERVATIONS_DESC' },
    { key: 'paymentReminders', label: 'SETTINGS.NOTIFICATIONS.PAYMENT_REMINDERS', desc: 'SETTINGS.NOTIFICATIONS.PAYMENT_REMINDERS_DESC' },
    { key: 'monthlyReports', label: 'SETTINGS.NOTIFICATIONS.MONTHLY_REPORTS', desc: 'SETTINGS.NOTIFICATIONS.MONTHLY_REPORTS_DESC' }
  ];

  subTabs = [
    { id: 'profile', label: 'SETTINGS.TABS.PROFILE', icon: 'ph-user' },
    { id: 'team', label: 'SETTINGS.TABS.TEAM', icon: 'ph-users-three' },
    { id: 'notifications', label: 'SETTINGS.TABS.NOTIFICATIONS', icon: 'ph-bell' },
    { id: 'security', label: 'SETTINGS.TABS.SECURITY', icon: 'ph-lock' },
    { id: 'billing', label: 'SETTINGS.TABS.BILLING', icon: 'ph-credit-card' },
    { id: 'preferences', label: 'SETTINGS.TABS.PREFERENCES', icon: 'ph-gear' },
    { id: 'interface', label: 'SETTINGS.TABS.INTERFACE', icon: 'ph-layout' }
  ];

  ngOnInit() {
    this.loadSettings();
  }

  loadSettings() {
    this.settingsService.getUserSettings().subscribe({
      next: (settings) => {
        this.profileData.set(settings.profile);
        this.notifications.set(settings.notifications);
        this.preferences.set(settings.preferences);
        this.interface.set(settings.interface);
      },
      error: (err) => console.error('Error loading settings:', err)
    });
  }

  selectSubTab(tabId: string) {
    this.activeSubTab.set(tabId);
  }

  getNotificationValue(key: string): boolean {
    const current = this.notifications();
    return current[key as keyof NotificationSettings] || false;
  }

  toggleNotification(key: string) {
    const current = this.notifications();
    this.notifications.set({
      ...current,
      [key]: !current[key as keyof NotificationSettings]
    });
  }

  onPhotoChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      console.log('Photo selected:', input.files[0]);
    }
  }

  saveProfile() {
    this.settingsService.updateUserSettings({ profile: this.profileData() }).subscribe({
      next: () => console.log('Profile saved successfully'),
      error: (err) => console.error('Error saving profile:', err)
    });
  }

  saveNotifications() {
    this.settingsService.updateUserSettings({ notifications: this.notifications() }).subscribe({
      next: () => console.log('Notifications saved successfully'),
      error: (err) => console.error('Error saving notifications:', err)
    });
  }

  savePreferences() {
    this.settingsService.updateUserSettings({ preferences: this.preferences() }).subscribe({
      next: () => console.log('Preferences saved successfully'),
      error: (err) => console.error('Error saving preferences:', err)
    });
  }

  saveInterface() {
    this.settingsService.updateUserSettings({ interface: this.interface() }).subscribe({
      next: () => console.log('Interface saved successfully'),
      error: (err) => console.error('Error saving interface:', err)
    });
  }

  changePlan() {
    console.log('Change plan');
  }

  cancelSubscription() {
    console.log('Cancel subscription');
  }

  addPaymentMethod() {
    console.log('Add payment method');
  }

  downloadInvoice(invoice: any) {
    console.log('Download invoice:', invoice);
  }

  deleteAccount() {
    if (confirm('Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.')) {
      console.log('Delete account');
    }
  }

  toggleDarkMode() {
    const current = this.preferences();
    const newDarkMode = !current.darkMode;
    this.preferences.set({ ...current, darkMode: newDarkMode });
    
    // Apply immediately
    this.themeService.setDarkMode(newDarkMode);
    
    // Save to backend
    this.savePreferences();
  }

  onLanguageChange() {
    const current = this.preferences();
    
    // Apply immediately
    this.translate.use(current.language);
    
    // Save to backend
    this.savePreferences();
  }
}
