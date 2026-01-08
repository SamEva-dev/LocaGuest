import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth/services/auth.service';
import { Permissions } from '../auth/permissions';

export type InternalTabType = 'summary' | 'property' | 'tenant' | 'relation';

export interface InternalTab {
  id: string;
  type: InternalTabType;
  title: string;
  icon?: string;
  color?: string; // green for property, orange for tenant
  data?: any;
  closable: boolean;
}

@Injectable({ providedIn: 'root' })
export class InternalTabManagerService {
  private static readonly STORAGE_KEY = 'lg.internal.activeTab';
  private router = inject(Router);
  private auth = inject(AuthService);
  private readonly _tabs = signal<InternalTab[]>([
    {
      id: 'summary',
      type: 'summary',
      title: 'TABS.SUMMARY',
      icon: 'ph-house',
      closable: false,
    },
  ]);

  private readonly _activeTabId = signal<string>('summary');

  readonly tabs = this._tabs.asReadonly();
  readonly activeTabId = this._activeTabId.asReadonly();
  readonly activeTab = computed(() => {
    const id = this._activeTabId();
    return this._tabs().find((t) => t.id === id);
  });

  private denyAccess(): void {
    this.router.navigate(['/forbidden']);
  }

  private canOpenProperty(): boolean {
    return this.auth.hasPermission(Permissions.PropertiesRead);
  }

  private canOpenTenant(): boolean {
    return this.auth.hasPermission(Permissions.TenantsRead);
  }

  private canOpenRelation(): boolean {
    return (
      this.auth.hasPermission(Permissions.PropertiesRead) &&
      this.auth.hasPermission(Permissions.TenantsRead)
    );
  }

  constructor() {
    // Restore active tab from storage if exists and is valid
    const savedId = localStorage.getItem(InternalTabManagerService.STORAGE_KEY);
    if (savedId) {
      const exists = this._tabs().some((t) => t.id === savedId);
      this._activeTabId.set(exists ? savedId : 'summary');
    }

    // Persist active tab changes
    effect(() => {
      const current = this._activeTabId();
      try {
        localStorage.setItem(InternalTabManagerService.STORAGE_KEY, current);
      } catch {}
    });
  }

  openProperty(propertyId: string, propertyName: string, data?: any): void {
    if (!this.canOpenProperty()) {
      this.denyAccess();
      return;
    }
    const tabId = `property-${propertyId}`;
    const existingTab = this._tabs().find((t) => t.id === tabId);

    if (existingTab) {
      if (data) {
        this._tabs.update((tabs) =>
          tabs.map((t) =>
            t.id === tabId
              ? { ...t, data: { ...(t.data ?? {}), propertyId, ...(data ?? {}) } }
              : t
          )
        );
      }
      this._activeTabId.set(tabId);
    } else {
      const newTab: InternalTab = {
        id: tabId,
        type: 'property',
        title: propertyName,
        icon: 'ph-house-line',
        color: '#38B2AC', // green
        data: { propertyId, ...data },
        closable: true,
      };
      this._tabs.update((tabs) => [...tabs, newTab]);
      this._activeTabId.set(tabId);
    }
  }

  openTenant(tenantId: string, tenantName: string, data?: any): void {
    if (!this.canOpenTenant()) {
      this.denyAccess();
      return;
    }
    const tabId = `tenant-${tenantId}`;
    const existingTab = this._tabs().find((t) => t.id === tabId);

    if (existingTab) {
      if (data) {
        this._tabs.update((tabs) =>
          tabs.map((t) =>
            t.id === tabId
              ? { ...t, data: { ...(t.data ?? {}), tenantId, ...(data ?? {}) } }
              : t
          )
        );
      }
      this._activeTabId.set(tabId);
    } else {
      const newTab: InternalTab = {
        id: tabId,
        type: 'tenant',
        title: tenantName,
        icon: 'ph-user',
        color: '#ED8936', // orange
        data: { tenantId, ...data },
        closable: true,
      };
      this._tabs.update((tabs) => [...tabs, newTab]);
      this._activeTabId.set(tabId);
    }
  }

  openRelation(
    propertyId: string,
    tenantId: string,
    title: string,
    data?: any
  ): void {
    if (!this.canOpenRelation()) {
      this.denyAccess();
      return;
    }
    const tabId = `relation-${propertyId}-${tenantId}`;
    const existingTab = this._tabs().find((t) => t.id === tabId);

    if (existingTab) {
      this._activeTabId.set(tabId);
    } else {
      const newTab: InternalTab = {
        id: tabId,
        type: 'relation',
        title,
        icon: 'ph-link',
        color: '#4299E1', // blue
        data: { propertyId, tenantId, ...data },
        closable: true,
      };
      this._tabs.update((tabs) => [...tabs, newTab]);
      this._activeTabId.set(tabId);
    }
  }

  closeTab(tabId: string): void {
    const tab = this._tabs().find((t) => t.id === tabId);
    if (!tab || !tab.closable) return;

    const currentTabs = this._tabs();
    const tabIndex = currentTabs.findIndex((t) => t.id === tabId);

    this._tabs.update((tabs) => tabs.filter((t) => t.id !== tabId));

    if (this._activeTabId() === tabId) {
      const newActiveTab =
        currentTabs[tabIndex - 1] || currentTabs[tabIndex + 1] || currentTabs[0];
      if (newActiveTab) {
        this._activeTabId.set(newActiveTab.id);
      }
    }
  }

  setActiveTab(tabId: string): void {
    const exists = this._tabs().some((t) => t.id === tabId);
    if (exists) {
      this._activeTabId.set(tabId);
    }
  }

  closeAll(): void {
    this._tabs.update((tabs) => tabs.filter((t) => !t.closable));
    this._activeTabId.set('summary');
  }
}
