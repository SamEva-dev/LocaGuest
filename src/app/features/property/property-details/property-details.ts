import { CommonModule } from '@angular/common';
import { Component, inject, Input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { PropertyDto } from '../../../models/models';
import { PropertyService } from '../../../services/property.service';

@Component({
  selector: 'property-details',
  imports: [TranslatePipe,CommonModule, FormsModule],
  templateUrl: './property-details.html',
  styleUrl: './property-details.scss'
})
export class PropertyDetails {
private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);
  private readonly propertyService = inject(PropertyService);

  /** Nom passé depuis la tab ou le routeur */
  @Input() propertyName = '';

  /** État interne */
  readonly property = signal<PropertyDto | null>(null);
  editMode = false;

  /** Onglets principaux */
  tabs = [
    { id: 'overview', label: 'PROPERTY.TABS.OVERVIEW' },
    { id: 'tenants', label: 'PROPERTY.TABS.TENANTS' },
    { id: 'contracts', label: 'PROPERTY.TABS.CONTRACTS' },
    { id: 'documents', label: 'PROPERTY.TABS.DOCUMENTS' },
    { id: 'maintenance', label: 'PROPERTY.TABS.MAINTENANCE' },
  ];
  activeTab = this.tabs[0];

  /** Données liées au bien */
  tenants: any[] = [];
  leases: any[] = [];
  documents: any[] = [];
  maintenanceHistory: any[] = [];

  async ngOnInit() {
    try {
      // Exemple : dans le futur, ce sera via route param
      const id = 'prop-001';
      const data = await this.propertyService.loadById(id);
      this.property.set(data);
    } catch (err) {
      console.error('Erreur chargement propriété :', err);
      alert(this.translate.instant('COMMON.ERROR'));
    }
  }

  updateField<K extends keyof PropertyDto>(key: K, value: PropertyDto[K]) {
    this.property.update(current => {
      if (!current) return current;
      return { ...current, [key]: value } as PropertyDto;
    });
  }

  /** Bascule édition / sauvegarde */
  async toggleEdit() {
    this.editMode = !this.editMode;

    if (!this.editMode && this.property()?.id) {
      try {
        // Exemple de sauvegarde via ETag (à améliorer quand le backend le renverra)
        await this.propertyService.update(this.property()!, 'W/"etag-simulé"');
        alert(this.translate.instant('COMMON.SAVE_SUCCESS'));
      } catch (err) {
        console.error('Erreur sauvegarde propriété :', err);
        alert(this.translate.instant('COMMON.ERROR'));
      }
    }
  }

  /** Navigation interne (vers d’autres pages si besoin) */
  goTo(path: string) {
    this.router.navigate([path]);
  }
  view: any;
  edit: any;

  viewTenant(tenant: any) {
    alert(`Voir détails du locataire : ${tenant.name}`);
  }

  editLease(lease: any) {
    alert(`Éditer le contrat : ${lease.title}`);
  }

  viewDocument(doc: any) {
    alert(`Ouverture du document : ${doc.title}`);
  }

  viewHistory(item: any) {
    console.log('Historique maintenance :', item);
    alert(
      `Détail maintenance : ${item.title}\nPrestataire : ${item.provider}\nCoût : ${item.cost} €\nDate : ${item.date}`
    );
    // 👉 Ici tu peux afficher un modal détaillé avec facture ou photos par ex.
  }

}
