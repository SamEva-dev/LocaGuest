import { Injectable, signal, computed } from '@angular/core';

export type TabType = 'summary' | 'property' | 'tenant' | 'relation';

export interface DynamicTab {
  id: string;
  type: TabType;
  title: string;
  route: string;
  icon?: string;
  data?: any;
  closable: boolean;
}

@Injectable({ providedIn: 'root' })
export class TabManagerService {
  // Signals
  private readonly _tabs = signal<DynamicTab[]>([]);

  private readonly _activeTabId = signal<string>('summary');

  // Computed
  readonly tabs = this._tabs.asReadonly();
  readonly activeTabId = this._activeTabId.asReadonly();
  readonly activeTab = computed(() => {
    const id = this._activeTabId();
    return this._tabs().find((t) => t.id === id);
  });

  /**
   * Open or activate a tab
   * If tab exists (same type + id), activate it
   * Otherwise, create new tab
   */
  openTab(tab: Partial<DynamicTab> & { id: string; type: TabType; title: string; route: string }): void {
    const existingTab = this._tabs().find(
      (t) => t.type === tab.type && t.id === tab.id
    );

    if (existingTab) {
      // Tab already exists, just activate it
      this._activeTabId.set(existingTab.id);
    } else {
      // Create new tab with closable defaulting to true if not specified
      const newTab: DynamicTab = {
        icon: tab.icon,
        data: tab.data,
        closable: tab.closable !== undefined ? tab.closable : true,
        ...tab,
      } as DynamicTab;
      this._tabs.update((tabs) => [...tabs, newTab]);
      this._activeTabId.set(newTab.id);
    }
  }

  /**
   * Open Property tab
   */
  openProperty(propertyId: string, propertyName: string, data?: any): void {
    this.openTab({
      id: `property-${propertyId}`,
      type: 'property',
      title: propertyName,
      route: `/app/property/${propertyId}`,
      icon: 'ph-house-line',
      data: { propertyId, ...data },
    });
  }

  /**
   * Open Tenant tab
   */
  openTenant(tenantId: string, tenantName: string, data?: any): void {
    this.openTab({
      id: `tenant-${tenantId}`,
      type: 'tenant',
      title: tenantName,
      route: `/app/tenant/${tenantId}`,
      icon: 'ph-user',
      data: { tenantId, ...data },
    });
  }

  /**
   * Open Relation tab (Property ↔ Tenant)
   */
  openRelation(
    propertyId: string,
    tenantId: string,
    title: string,
    data?: any
  ): void {
    this.openTab({
      id: `relation-${propertyId}-${tenantId}`,
      type: 'relation',
      title,
      route: `/app/relation/${propertyId}/${tenantId}`,
      icon: 'ph-link',
      data: { propertyId, tenantId, ...data },
    });
  }

  /**
   * Close a tab
   */
  closeTab(tabId: string): void {
    const tab = this._tabs().find((t) => t.id === tabId);
    if (!tab || !tab.closable) return;

    const currentTabs = this._tabs();
    const tabIndex = currentTabs.findIndex((t) => t.id === tabId);

    this._tabs.update((tabs) => tabs.filter((t) => t.id !== tabId));

    // If closed tab was active, activate another
    if (this._activeTabId() === tabId) {
      const newActiveTab =
        currentTabs[tabIndex - 1] || currentTabs[tabIndex + 1] || currentTabs[0];
      if (newActiveTab) {
        this._activeTabId.set(newActiveTab.id);
      }
    }
  }

  /**
   * Activate a tab
   */
  activateTab(tabId: string): void {
    const exists = this._tabs().some((t) => t.id === tabId);
    if (exists) {
      this._activeTabId.set(tabId);
    }
  }

  /**
   * Set active tab (alias for activateTab)
   */
  setActiveTab(tabId: string): void {
    this.activateTab(tabId);
  }

  /**
   * Close all closable tabs
   */
  closeAll(): void {
    this._tabs.update((tabs) => tabs.filter((t) => !t.closable));
    this._activeTabId.set('summary');
  }

  /**
   * Get tab color class based on type
   */
  getTabColorClass(type: TabType): string {
    switch (type) {
      case 'property':
        return 'bg-secondary-500 hover:bg-secondary-600';
      case 'tenant':
        return 'bg-primary-500 hover:bg-primary-600';
      case 'relation':
        return 'bg-accent-500 hover:bg-accent-600';
      default:
        return 'bg-slate-500 hover:bg-slate-600';
    }
  }
}
