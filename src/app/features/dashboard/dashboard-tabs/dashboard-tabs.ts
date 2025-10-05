import { Component, computed, inject, signal } from '@angular/core';
import { DashboardContent } from '../dashboard-content/dashboard-content';
import { PropertyDetails } from '../../property-details/property-details';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { DashboardTabsService } from '../../../services/dashboard-tabs-service';


@Component({
  selector: 'app-dashboard-tabs',
  imports: [DashboardContent, PropertyDetails,CommonModule, FormsModule],
  templateUrl: './dashboard-tabs.html',
  styleUrl: './dashboard-tabs.scss'
})
export class DashboardTabs {

  private router = inject(Router);
  private translate = inject(TranslateService)
  private tabsSvc = inject(DashboardTabsService)

  
  
  /** Expose les signaux du service */
  tabs = this.tabsSvc.tabs;
  activeTab = this.tabsSvc.activeTab;

  /** Onglet actif courant (pour passer les infos au détail) */
  activeTabData = computed(() =>
    this.tabs().find(t => t.id === this.activeTab())
  );

  /** Méthodes de délégation */
  openProperty(name: string) { this.tabsSvc.openProperty(name); }
  closeTab(id: string) { this.tabsSvc.closeTab(id); }

}
