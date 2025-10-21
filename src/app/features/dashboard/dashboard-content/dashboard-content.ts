import { CommonModule } from '@angular/common';
import { Component, computed, EventEmitter, HostListener, inject, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Property } from '../../property/property';
import { DashboardService } from '../../../services/dashboard.service';
import { PropertyFilter, PropertyRow } from '../../../models/models';

@Component({
  selector: 'app-dashboard-content',
  imports: [TranslatePipe,CommonModule, FormsModule, Property],
  templateUrl: './dashboard-content.html',
  styleUrl: './dashboard-content.scss'
})
export class DashboardContent {
  
    private translate = inject(TranslateService);
  private router = inject(Router);
  private dash = inject(DashboardService);

  @Output() openProperty = new EventEmitter<string>();

  readonly searchQuery = signal('');
  readonly isAddPropertyOpen = signal(false);
  readonly filterPanelOpen = signal(false);
  readonly filter = signal<PropertyFilter>({});


  // Expose les signals du service vers le template
  readonly loading = this.dash.loading;
  readonly stats = this.dash.stats;
  readonly properties = this.dash.properties;
  readonly recentActivities = this.dash.activities;

  // Filtre local côté UI (optionnel)
  readonly filteredProperties = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return this.properties();
    return this.properties().filter(p =>
      p.address.toLowerCase().includes(q) ||
      (p.type?.toLowerCase().includes(q)) ||
      (p.tenant?.toLowerCase().includes(q ?? ''))
    );
  });

  async ngOnInit() {
    await this.loadAll() 
  }

  async loadAll() {
    this.dash.loadAll();
  }

  addProperty() {
    this.isAddPropertyOpen.set(true);
  }

  onPropertySaved(newProperty: any) {
    // exemple: push local + TODO: appeler POST backend si ce n’est pas déjà fait dans la modal
    this.properties.update(list => [newProperty, ...list]);
    this.isAddPropertyOpen.set(false);
  }

  toggleFilterPanel() {
  this.filterPanelOpen.update(v => !v);
}

async applyFilters() {
  const result = await this.dash.filterProperties(this.filter());
  if (result.length === 0) {
    alert(this.translate.instant('DASHBOARD.PROPERTIES.NO_RESULT'));
  }
}

clearFilters() {
  this.filter.set({});
  this.dash.loadAll();
}
getStatusBadge(status: PropertyRow['status']) {
    switch (status) {
      case 'occupied':
        return {
          label: 'DASHBOARD.PROPERTIES.STATUS.OCCUPIED',
          classes: 'bg-green-100 text-green-700 border border-green-200 px-2 py-1 rounded-full text-xs font-semibold'
        };
      case 'vacant':
        return {
          label: 'DASHBOARD.PROPERTIES.STATUS.VACANT',
          classes: 'bg-amber-100 text-amber-700 border border-amber-200 px-2 py-1 rounded-full text-xs font-semibold'
        };
      default:
        return {
          label: 'DASHBOARD.PROPERTIES.STATUS.UNKNOWN',
          classes: 'bg-gray-100 text-gray-700 border border-gray-200 px-2 py-1 rounded-full text-xs font-semibold'
        };
    }
  }

  getActivityIcon(type: string) {
    switch (type) {
      case 'payment':
        return 'ph ph-currency-eur text-green-600';
      case 'document':
        return 'ph ph-file-text text-blue-600';
      case 'alert':
        return 'ph ph-warning-circle text-amber-500';
      case 'new':
        return 'ph ph-user-plus text-purple-600';
      default:
        return 'ph ph-info text-gray-500';
    }
  }

  openMenuId = signal<number | null>(null);

  toggleMenu(id: number, event: MouseEvent) {
    console.log('toggleMenu', id);
    event.stopPropagation();
    this.openMenuId.update(cur => (cur === id ? null : id));
  }

  closeMenu() {
    this.openMenuId.set(null);
  }

  @HostListener('document:click')
  onDocumentClick() {
    this.closeMenu();
  }

  editProperty(id: number) {
    this.closeMenu();
    //this.router.navigate(['/properties', id, 'edit']);
  }

 async  deleteProperty(id: string) {
    this.closeMenu();
    const msg = this.translate.instant('COMMON.CANCEL');
    if (confirm(msg)) {
      await this.dash.deleteProperty(id);
    }
  }

  goTo(path: string) {
    //this.router.navigate([path]);
  }

  onDetailsClick(p: any) {
    this.openProperty.emit(p.address);
  }
}
