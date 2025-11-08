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
    // Open Dashboard and Mon LocaGuest as fixed tabs
    if (this.tabs().length === 0) {
      // First tab: Dashboard (fixed)
      this.tabManager.openTab({
        id: 'dashboard',
        type: 'summary',
        title: 'DASHBOARD.TITLE',
        route: '/app/dashboard',
        icon: 'ph-chart-line-up',
        closable: false
      });
      
      // Second tab: Mon LocaGuest (fixed)
      this.tabManager.openTab({
        id: 'mon-locaguest',
        type: 'summary',
        title: 'MON_LOCAGUEST.TITLE',
        route: '/app/mon-locaguest',
        icon: 'ph-house',
        closable: false
      });
    }
  }

  selectTab(tabId: string) {
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
