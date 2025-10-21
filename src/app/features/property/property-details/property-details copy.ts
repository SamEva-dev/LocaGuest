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
  template: '',
  styleUrl: './property-details.scss'
})
export class PropertyDetails {


  private router = inject(Router);
  private translate = inject(TranslateService)

  private propertyService = inject(PropertyService);

   @Input() propertyName = '';

 editMode = false;


  tabs = [
    { id: 'overview', label: 'PROPERTY.TABS.OVERVIEW' },
    { id: 'tenants', label: 'PROPERTY.TABS.TENANTS' },
    { id: 'contracts', label: 'PROPERTY.TABS.CONTRACTS' },
    { id: 'documents', label: 'PROPERTY.TABS.DOCUMENTS' },
    { id: 'maintenance', label: 'PROPERTY.TABS.MAINTENANCE' }
  ];

  activeTab = this.tabs[0];

  property = {
    name: this.propertyName,
    address: '15 Rue de la République, 75001 Paris',
    status: 'occupied',
    rent: 1850,
    charges: 150,
    deposit: 1850,
    annualRevenue: 22200,
    surface: 68,
    rooms: '3 pièces',
    floor: '2ème',
    elevator: false,
    parking: '1 place',
    furnished: false
  };
  tenants = [
    { initials: 'JD', name: 'Jean Dupont', role: 'Locataire principal', email: 'jean.dupont@email.com', status: 'Actif', since: '2023-03-15' },
    { initials: 'ML', name: 'Marie Lefebvre', role: 'Colocataire', email: 'marie.lefebvre@email.com', status: 'Actif', since: '2023-03-15' }
  ];

  leases = [
    { title: 'Bail principal - Jean Dupont & Marie Lefebvre', start: '2023-03-15', end: '2026-03-14', duration: '3 ans', type: 'Non meublé' }
  ];

  documents = [
    { title: 'Bail de location', size: 'PDF - 2.3 MB' },
    { title: 'État des lieux d’entrée', size: 'PDF - 2.3 MB' },
    { title: 'Diagnostics', size: 'PDF - 2.3 MB' },
    { title: 'Assurance', size: 'PDF - 2.3 MB' },
    { title: 'Règlement de copropriété', size: 'PDF - 2.3 MB' }
  ];

  maintenanceHistory = [
    { title: 'Réparation fuite cuisine', provider: 'Plombier Martin', date: '2024-01-15', cost: 180, status: 'Terminé' },
    { title: 'Révision chaudière', provider: 'Chauffagiste Pro', date: '2023-10-10', cost: 120, status: 'Terminé' }
  ];
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

  toggleEdit() {
    this.editMode = !this.editMode;
    if (!this.editMode) {
      console.log('Sauvegarde des changements :', this.property);
      // appel backend possible ici
    }
  }

  addImage(slot: string) {
    // Ici tu peux ouvrir un file picker ou déclencher une autre modal
    console.log(`Ajouter une image pour : ${slot}`);
  }
}
