import { Component, signal } from '@angular/core';
import { DashboardContent } from '../dashboard-content/dashboard-content';
import { PropertyDetails } from '../../property-details/property-details';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';


interface Tab {
  id: string;
  title: string;
  type: 'dashboard' | 'property';
}

@Component({
  selector: 'app-dashboard-tabs',
  imports: [DashboardContent, PropertyDetails,CommonModule, FormsModule],
  templateUrl: './dashboard-tabs.html',
  styleUrl: './dashboard-tabs.scss'
})
export class DashboardTabs {

  tabs = signal<Tab[]>([
    { id: 'dashboard', title: 'Tableau de bord', type: 'dashboard' }
  ]);
  activeTab = signal('dashboard');

  get activeTabData(): Tab | undefined {
  return this.tabs().find(t => t.id === this.activeTab());
}


  /** ✅ Ajout dynamique d'une tab propriété */
  openProperty(propertyName: string) {
    const id = `prop-${propertyName}`;
    if (!this.tabs().find(t => t.id === id)) {
      this.tabs.update(t => [...t, { id, title: propertyName, type: 'property' }]);
    }
    this.activeTab.set(id);
  }

  /** ✅ Fermeture d'un onglet */
  closeTab(id: string) {
    if (id === 'dashboard') return;
    this.tabs.update(t => t.filter(x => x.id !== id));
    if (this.activeTab() === id) this.activeTab.set('dashboard');
  }

}
