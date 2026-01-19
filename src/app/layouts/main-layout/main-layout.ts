import { Component, inject, signal, HostListener } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { TabManagerService } from '../../core/services/tab-manager.service';
import { ThemeService } from '../../core/services/theme.service';
import { AuthService } from '../../core/auth/services/auth.service';
import { ToastService } from '../../core/ui/toast.service';
import { ConfirmService } from '../../core/ui/confirm.service';
import { ConfirmModal } from '../../shared/components/confirm-modal/confirm-modal';
import { BrandingThemeService } from '../../core/services/branding-theme.service';
import { SatisfactionSurveyModal } from '../../shared/components/satisfaction-survey-modal/satisfaction-survey-modal';

@Component({
  selector: 'main-layout',
  imports: [CommonModule, RouterOutlet, TranslatePipe, ConfirmModal, SatisfactionSurveyModal],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss'
})
export class MainLayout {
  private auth = inject(AuthService);
  private router = inject(Router);
  private tabManager = inject(TabManagerService);
  theme = inject(ThemeService);
  branding = inject(BrandingThemeService);
  
  // ✅ Services UI
  toasts = inject(ToastService);
  confirmService = inject(ConfirmService);

  user = this.auth.user;
  tabs = this.tabManager.tabs;
  activeTabId = this.tabManager.activeTabId;
  showUserMenu = signal(false);
  showNotificationsMenu = signal(false);

  showSatisfactionSurveyModal = signal(false);
  private readonly satisfactionSurveyStorageKey = 'satisfactionSurvey.submitted.session.v1';
  
  // ✅ Getters pour template
  toastItems = this.toasts.items;
  confirmData = this.confirmService.confirm;

  ngOnInit() {
    // Open fixed tabs
    if (this.tabs().length === 0) {
      // Tab 1: Dashboard (fixed)
      this.tabManager.openTab({
        id: 'dashboard',
        type: 'summary',
        title: 'DASHBOARD.TITLE',
        route: '/app/dashboard',
        icon: 'ph-chart-line-up',
        closable: false
      });
      
      // Tab 2: Mon LocaGuest (fixed)
      this.tabManager.openTab({
        id: 'mon-locaguest',
        type: 'summary',
        title: 'MON_LOCAGUEST.TITLE',
        route: '/app/mon-locaguest',
        icon: 'ph-house',
        closable: false
      });

      // Tab 3: Contrats (fixed)
      this.tabManager.openTab({
        id: 'contracts',
        type: 'summary',
        title: 'CONTRACTS.TITLE',
        route: '/app/contracts',
        icon: 'ph-file-text',
        closable: false
      });

      // Tab 4: Documents (fixed)
      this.tabManager.openTab({
        id: 'documents',
        type: 'summary',
        title: 'DOCUMENTS_TAB.TITLE',
        route: '/app/documents',
        icon: 'ph-file-doc',
        closable: false
      });

      // Tab 5: Rentabilité (fixed)
      this.tabManager.openTab({
        id: 'profitability',
        type: 'summary',
        title: 'PROFITABILITY.TITLE',
        route: '/app/profitability',
        icon: 'ph-chart-bar',
        closable: false
      });

      // Tab 6: Calcul Rentabilité (fixed)
      this.tabManager.openTab({
        id: 'rentability',
        type: 'summary',
        title: 'RENTABILITY.TITLE',
        route: '/app/rentability',
        icon: 'ph-calculator',
        closable: false
      });

      // Tab 7: Paramètres (fixed)
      this.tabManager.openTab({
        id: 'settings',
        type: 'summary',
        title: 'SETTINGS.TITLE',
        route: '/app/settings',
        icon: 'ph-gear',
        closable: false
      });

      this.tabManager.setActiveTab('dashboard');
    }
  }

  hasSubmittedSatisfactionSurvey(): boolean {
    try {
      return sessionStorage.getItem(this.satisfactionSurveyStorageKey) === 'true';
    } catch {
      return false;
    }
  }

  openSatisfactionSurvey() {
    this.showNotificationsMenu.set(false);
    this.showSatisfactionSurveyModal.set(true);
  }

  closeSatisfactionSurvey() {
    this.showSatisfactionSurveyModal.set(false);
  }

  onSatisfactionSurveySubmitted() {
    try {
      sessionStorage.setItem(this.satisfactionSurveyStorageKey, 'true');
    } catch {}
    this.showSatisfactionSurveyModal.set(false);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('satisfactionSurvey.submitted'));
    }
  }

  selectTab(tabId: string) {
    this.tabManager.setActiveTab(tabId);
    const tab = this.tabs().find(t => t.id === tabId);
    if (tab) {
      // Avoid re-navigating to the same route (can cause component re-creation loops)
      if (this.router.url === tab.route) return;
      this.router.navigateByUrl(tab.route);
    }
  }

  closeTab(tabId: string, event: Event) {
    event.stopPropagation();
    this.tabManager.closeTab(tabId);
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/']);
  }

  toggleTheme() {
    this.theme.toggleTheme();
  }

  toggleUserMenu() {
    this.showUserMenu.set(!this.showUserMenu());
  }

  toggleNotificationsMenu() {
    this.showNotificationsMenu.set(!this.showNotificationsMenu());
  }

  goToPricing() {
    this.showUserMenu.set(false);
    this.router.navigate(['/app/settings'], { queryParams: { tab: 'billing' } });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (this.showUserMenu() && !target.closest('.relative')) {
      this.showUserMenu.set(false);
    }

    if (this.showNotificationsMenu() && !target.closest('.notifications-menu')) {
      this.showNotificationsMenu.set(false);
    }
  }
}
