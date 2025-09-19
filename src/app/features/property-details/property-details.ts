import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

type Tab = 'overview' | 'tenants' | 'contracts' | 'documents' | 'maintenance';

interface Tenant {
  initials: string;
  name: string;
  role: 'Locataire principal' | 'Colocataire';
  email: string;
  since: string;
  active: boolean;
}
interface Contract {
  title: string;
  period: string;
  tags: { label: string; variant: 'secondary' | 'outline' }[];
}
interface DocItem {
  title: string;
  meta: string;
}
interface MaintenanceItem {
  title: string;
  provider: string;
  date: string;
  amount: string;
  status: 'Terminé';
}

@Component({
  selector: 'app-property-details',
  imports: [],
  templateUrl: './property-details.html',
  styleUrl: './property-details.scss'
})
export class PropertyDetails {

  private router = inject(Router);

  activeTab = signal<Tab>('overview');

  // Header
  address = signal('Appartement 3 pièces - Centre Ville');
  location = signal('15 Rue de la République, 75001 Paris');
  occupied = signal(true);
  rentMonthly = signal('1,850€');

  // Aperçu "Détails du bien"
  details = signal([
    { label: 'Surface', value: '68 m²' },
    { label: 'Pièces', value: '3 pièces' },
    { label: 'Étage', value: '2ème' },
    { label: 'Ascenseur', value: 'Non' },
    { label: 'Parking', value: '1 place' },
    { label: 'Meublé', value: 'Non' }
  ]);

  // Résumé financier
  finance = signal([
    { label: 'Loyer mensuel', value: '1,850€' },
    { label: 'Charges', value: '150€' },
    { label: 'Dépôt de garantie', value: '1,850€' }
  ]);
  yearlyIncome = signal('22,200€');

  // Locataires
  tenants = signal<Tenant[]>([
    { initials: 'JD', name: 'Jean Dupont',  role: 'Locataire principal', email: 'jean.dupont@email.com', since: 'Depuis le 15/03/2023', active: true },
    { initials: 'ML', name: 'Marie Lefebvre', role: 'Colocataire',        email: 'marie.lefebvre@email.com', since: 'Depuis le 15/03/2023', active: true }
  ]);

  // Contrats
  contracts = signal<Contract[]>([
    {
      title: 'Bail principal - Jean Dupont & Marie Lefebvre',
      period: 'Du 15/03/2023 au 14/03/2026',
      tags: [
        { label: '3 ans', variant: 'secondary' },
        { label: 'Non meublé', variant: 'outline' }
      ]
    }
  ]);

  // Documents
  documents = signal<DocItem[]>([
    { title: 'Bail de location',            meta: 'PDF • 2.3 MB' },
    { title: "État des lieux d'entrée",     meta: 'PDF • 2.3 MB' },
    { title: 'Diagnostics',                 meta: 'PDF • 2.3 MB' },
    { title: 'Assurance',                   meta: 'PDF • 2.3 MB' },
    { title: 'Règlement de copropriété',    meta: 'PDF • 2.3 MB' }
  ]);

  // Maintenance
  maintenance = signal<MaintenanceItem[]>([
    { title: 'Réparation fuite cuisine', provider: 'Plombier Martin', date: '15/01/2024', amount: '180€', status: 'Terminé' },
    { title: 'Révision chaudière',       provider: 'Chauffagiste Pro', date: '10/10/2023', amount: '120€', status: 'Terminé' }
  ]);

  goBack() {
    this.router.navigate(['/dashboard']);
  }
  editProperty() {
    // plus tard: navigation vers page d'édition
  }
}
