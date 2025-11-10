import { Component, inject, signal } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { TabManagerService } from '../../core/services/tab-manager.service';
import { ThemeService } from '../../core/services/theme.service';
import { AuthService } from '../../core/auth/services/auth.service';

@Component({
  selector: 'main-layout',
  imports: [RouterOutlet, TranslatePipe],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss'
})
export class MainLayout {
  private auth = inject(AuthService);
  private router = inject(Router);
  private tabManager = inject(TabManagerService);
  theme = inject(ThemeService);

  user = this.auth.user;
  tabs = this.tabManager.tabs;
  activeTabId = this.tabManager.activeTabId;

  ngOnInit() {
    // Open fixed tabs
    console.log("tabs",this.tabs());
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

      // Tab 6: Paramètres (fixed)
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

  selectTab(tabId: string) {
    console.log("tabId",tabId);
    this.tabManager.setActiveTab(tabId);
    const tab = this.tabs().find(t => t.id === tabId);
    if (tab) {
      this.router.navigate([tab.route]);
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
}
