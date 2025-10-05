import { Injectable, signal } from '@angular/core';
import { DashboardTab } from '../models/tabs';

@Injectable({
  providedIn: 'root'
})
export class DashboardTabsService {
   tabs = signal<DashboardTab[]>([
    { id: 'dashboard', title: 'Tableau de bord', type: 'dashboard' }
  ]);
  activeTab = signal('dashboard');

  openProperty(name: string) {
    const id = `prop-${name}`;
    if (!this.tabs().find(t => t.id === id)) {
      this.tabs.update(t => [...t, { id, title: name, type: 'property' }]);
    }
    this.activeTab.set(id);
  }

  closeTab(id: string) {
    if (id === 'dashboard') return;
    this.tabs.update(t => t.filter(x => x.id !== id));
    if (this.activeTab() === id) this.activeTab.set('dashboard');
  }
}
