import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ThemeService } from '../../core/services/theme.service';
import { UsersApi, UserProfile, NotificationSettings, UserPreferences } from '../../core/api/users.api';
import { BillingApi, BillingInvoice } from '../../core/api/billing.api';
import { SubscriptionService } from '../../core/services/subscription.service';
import { AuthService } from '../../core/auth/services/auth.service';
import { Permissions } from '../../core/auth/permissions';
import { TeamSettingsComponent } from './tabs/team-settings/team-settings-updated.component';
import { TwoFactorSettingsComponent } from './tabs/two-factor-settings/two-factor-settings.component';
import { OrganizationSettingsComponent } from './tabs/organization-settings/organization-settings.component';

@Component({
  selector: 'settings-tab',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe, TeamSettingsComponent, TwoFactorSettingsComponent, OrganizationSettingsComponent],
  templateUrl: './settings-tab.html'
})
export class SettingsTab implements OnInit {
  private usersApi = inject(UsersApi);
  private billingApi = inject(BillingApi);
  private subscriptionService = inject(SubscriptionService);
  private themeService = inject(ThemeService);
  private translate = inject(TranslateService);
  private router = inject(Router);
  private auth = inject(AuthService);
  
  activeSubTab = signal('profile');

  // Profile settings
  profileData = signal<Partial<UserProfile>>({
    userId: '',
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
    paymentReceived: true,
    paymentOverdue: true,
    paymentReminder: true,
    contractSigned: true,
    contractExpiring: true,
    contractRenewal: true,
    newTenantRequest: true,
    tenantCheckout: true,
    maintenanceRequest: true,
    maintenanceCompleted: false,
    systemUpdates: true,
    marketingEmails: false
  });

  // Preferences
  preferences = signal<UserPreferences>({
    darkMode: false,
    language: 'fr',
    timezone: 'Europe/Paris',
    dateFormat: 'DD/MM/YYYY',
    currency: 'EUR',
    sidebarNavigation: true,
    headerNavigation: false
  });

  // Billing
  currentSubscription = this.subscriptionService.subscription;
  currentPlan = this.subscriptionService.currentPlan;
  isInTrial = this.subscriptionService.isInTrial;
  daysUntilRenewal = this.subscriptionService.daysUntilRenewal;
  
  invoices = signal<BillingInvoice[]>([]);

  // Security
  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  activeSessions = [
    { id: '1', device: 'Chrome sur Windows', location: 'Paris, France', time: 'Actuelle session', current: true },
    { id: '2', device: 'Safari sur iPhone', location: 'Paris, France', time: 'il y a 2 heures', current: false }
  ];

  notificationsList = [
    { key: 'paymentReceived', label: 'SETTINGS.NOTIFICATIONS.ITEMS.PAYMENT_RECEIVED.TITLE', desc: 'SETTINGS.NOTIFICATIONS.ITEMS.PAYMENT_RECEIVED.DESC' },
    { key: 'paymentOverdue', label: 'SETTINGS.NOTIFICATIONS.ITEMS.PAYMENT_OVERDUE.TITLE', desc: 'SETTINGS.NOTIFICATIONS.ITEMS.PAYMENT_OVERDUE.DESC' },
    { key: 'paymentReminder', label: 'SETTINGS.NOTIFICATIONS.ITEMS.PAYMENT_REMINDER.TITLE', desc: 'SETTINGS.NOTIFICATIONS.ITEMS.PAYMENT_REMINDER.DESC' },
    { key: 'contractSigned', label: 'SETTINGS.NOTIFICATIONS.ITEMS.CONTRACT_SIGNED.TITLE', desc: 'SETTINGS.NOTIFICATIONS.ITEMS.CONTRACT_SIGNED.DESC' },
    { key: 'contractExpiring', label: 'SETTINGS.NOTIFICATIONS.ITEMS.CONTRACT_EXPIRING.TITLE', desc: 'SETTINGS.NOTIFICATIONS.ITEMS.CONTRACT_EXPIRING.DESC' },
    { key: 'newTenantRequest', label: 'SETTINGS.NOTIFICATIONS.ITEMS.NEW_TENANT_REQUEST.TITLE', desc: 'SETTINGS.NOTIFICATIONS.ITEMS.NEW_TENANT_REQUEST.DESC' },
    { key: 'systemUpdates', label: 'SETTINGS.NOTIFICATIONS.ITEMS.SYSTEM_UPDATES.TITLE', desc: 'SETTINGS.NOTIFICATIONS.ITEMS.SYSTEM_UPDATES.DESC' },
    { key: 'marketingEmails', label: 'SETTINGS.NOTIFICATIONS.ITEMS.MARKETING_EMAILS.TITLE', desc: 'SETTINGS.NOTIFICATIONS.ITEMS.MARKETING_EMAILS.DESC' }
  ];

  subTabs = [
    { id: 'profile', label: 'SETTINGS.TABS.PROFILE', icon: 'ph-user' },
    { id: 'organization', label: 'SETTINGS.TABS.ORGANIZATION', icon: 'ph-building' },
    { id: 'team', label: 'SETTINGS.TABS.TEAM', icon: 'ph-users-three' },
    { id: 'security', label: 'SETTINGS.TABS.SECURITY', icon: 'ph-shield-check' },
    { id: 'notifications', label: 'SETTINGS.TABS.NOTIFICATIONS', icon: 'ph-bell' },
    { id: 'billing', label: 'SETTINGS.TABS.BILLING', icon: 'ph-credit-card' },
    { id: 'preferences', label: 'SETTINGS.TABS.PREFERENCES', icon: 'ph-gear' },
    { id: 'interface', label: 'SETTINGS.TABS.INTERFACE', icon: 'ph-layout' }
  ];

  get visibleSubTabs() {
    return this.subTabs.filter(t => this.canAccessSubTab(t.id));
  }

  ngOnInit() {
    // Ensure active tab is allowed for current user
    if (!this.canAccessSubTab(this.activeSubTab())) {
      this.activeSubTab.set('profile');
    }
    this.loadSettings();
  }

  private canAccessSubTab(tabId: string): boolean {
    switch (tabId) {
      case 'organization':
        return this.auth.hasPermission(Permissions.TenantSettingsRead);
      case 'team':
        // Allow read access to the team page; actions inside are gated separately
        return this.auth.hasPermission(Permissions.UsersRead);
      case 'billing':
        return this.auth.hasPermission(Permissions.BillingRead);
      default:
        return true;
    }
  }

  loadSettings() {
    // Load profile
    this.usersApi.getUserProfile().subscribe({
      next: (profile) => this.profileData.set(profile),
      error: (err) => console.error('Error loading profile:', err)
    });

    // Load preferences
    this.usersApi.getUserPreferences().subscribe({
      next: (prefs) => {
        this.preferences.set(prefs);
        this.themeService.setDarkMode(prefs.darkMode);
      },
      error: (err) => console.error('Error loading preferences:', err)
    });

    // Load notifications
    this.usersApi.getNotificationSettings().subscribe({
      next: (notifs) => this.notifications.set(notifs),
      error: (err) => console.error('Error loading notifications:', err)
    });

    // Load billing data
    this.loadBillingData();
  }

  loadBillingData() {
    // Load subscription
    this.subscriptionService.loadCurrentSubscription().subscribe();

    // Load invoices
    this.billingApi.getInvoices().subscribe({
      next: (invoices) => this.invoices.set(invoices),
      error: (err) => console.error('Error loading invoices:', err)
    });
  }

  selectSubTab(tabId: string) {
    if (!this.canAccessSubTab(tabId)) {
      this.router.navigate(['/forbidden']);
      return;
    }
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

  uploadingPhoto = false;

  onPhotoChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('La taille du fichier ne doit pas dépasser 5 MB');
        return;
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        alert('Format de fichier non autorisé. Utilisez JPG, PNG ou GIF.');
        return;
      }

      this.uploadingPhoto = true;
      this.usersApi.uploadProfilePhoto(file).subscribe({
        next: (profile) => {
          this.profileData.set(profile);
          this.uploadingPhoto = false;
        },
        error: (err) => {
          console.error('Error uploading photo:', err);
          this.uploadingPhoto = false;
          alert('Erreur lors de l\'upload de la photo');
        }
      });
    }
  }

  saveProfile() {
    const profile = this.profileData();
    this.usersApi.updateUserProfile({
      firstName: profile.firstName || '',
      lastName: profile.lastName || '',
      phone: profile.phone,
      company: profile.company,
      role: profile.role,
      bio: profile.bio
    }).subscribe({
      next: (updatedProfile) => {
        this.profileData.set(updatedProfile);
      },
      error: (err) => console.error('Error saving profile:', err)
    });
  }

  saveNotifications() {
    this.usersApi.updateNotificationSettings(this.notifications()).subscribe({
      next: (updatedNotifications) => {
        this.notifications.set(updatedNotifications);
      },
      error: (err) => console.error('Error saving notifications:', err)
    });
  }

  savePreferences() {
    this.usersApi.updateUserPreferences(this.preferences()).subscribe({
      next: (updatedPreferences) => {
        this.preferences.set(updatedPreferences);
        this.themeService.setDarkMode(updatedPreferences.darkMode);
      },
      error: (err) => console.error('Error saving preferences:', err)
    });
  }

  changePlan() {
    // Navigate to pricing page
    this.router.navigate(['/app/pricing']);
  }

  cancelSubscription() {
    if (!confirm('Êtes-vous sûr de vouloir annuler votre abonnement ? Vous aurez accès jusqu\'à la fin de la période de facturation.')) {
      return;
    }

    this.billingApi.cancelSubscription(false).subscribe({
      next: () => {
        alert('Votre abonnement a été annulé. Il restera actif jusqu\'à la fin de la période de facturation.');
        this.loadBillingData();
      },
      error: (err) => {
        console.error('Error canceling subscription:', err);
        alert('Erreur lors de l\'annulation de l\'abonnement. Veuillez réessayer.');
      }
    });
  }

  addPaymentMethod() {
    // Open Stripe customer portal for payment method management
    this.billingApi.getCustomerPortalUrl('/settings/billing').subscribe({
      next: (response) => {
        window.location.href = response.url;
      },
      error: (err) => {
        console.error('Error opening customer portal:', err);
        alert('Erreur lors de l\'ouverture du portail de paiement.');
      }
    });
  }

  downloadInvoice(invoice: BillingInvoice) {
    if (invoice.invoicePdf) {
      window.open(invoice.invoicePdf, '_blank');
    } else {
      alert('PDF de facture non disponible');
    }
  }

  deleteAccount() {
    if (confirm('Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.')) {
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
