import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard {
private router = inject(Router);

  searchQuery = signal('');

  stats = signal([
    { title: 'Biens gérés', value: '12', change: '+2 ce mois', icon: 'pi pi-building', color: 'text-primary' },
    { title: 'Locataires actifs', value: '28', change: '+5 ce mois', icon: 'pi pi-users', color: 'text-secondary' },
    { title: 'Revenus mensuels', value: '15 840€', change: '+8.2% vs mois dernier', icon: 'pi pi-euro', color: 'text-success' },
    { title: "Taux d'occupation", value: '94%', change: '+2% ce mois', icon: 'pi pi-chart-line', color: 'text-accent' }
  ]);

  properties = signal([
    { id: 1, address: '15 Rue de la Paix, Paris 2e', type: 'Appartement 2P', tenant: 'Marie Dubois', rent: '1250€', status: 'occupied', nextDue: '2024-01-15' },
    { id: 2, address: '8 Avenue des Champs, Lyon 3e', type: 'Studio', tenant: 'Pierre Martin', rent: '780€', status: 'occupied', nextDue: '2024-01-10' },
    { id: 3, address: '22 Boulevard Voltaire, Marseille', type: 'Colocation 4P', tenant: '3 colocataires', rent: '2100€', status: 'occupied', nextDue: '2024-01-20' },
    { id: 4, address: '45 Rue du Commerce, Nice', type: 'Appartement 3P', tenant: null, rent: '1450€', status: 'vacant', nextDue: null }
  ]);

  recentActivities = signal([
    { type: 'payment', message: 'Loyer reçu - 15 Rue de la Paix', amount: '1250€', time: 'Il y a 2h' },
    { type: 'document', message: 'Contrat renouvelé - Studio Lyon', time: 'Il y a 5h' },
    { type: 'alert', message: 'Loyer en retard - Boulevard Voltaire', time: 'Il y a 1j' },
    { type: 'new', message: 'Nouveau locataire - Rue du Commerce', time: 'Il y a 2j' }
  ]);

  getStatusBadge(status: string) {
    switch (status) {
      case 'occupied':
        return { label: 'Occupé', classes: 'bg-success/10 text-success border border-success/20 px-2 py-1 rounded text-sm' };
      case 'vacant':
        return { label: 'Vacant', classes: 'bg-warning/10 text-warning border border-warning/20 px-2 py-1 rounded text-sm' };
      default:
        return { label: 'Inconnu', classes: 'border px-2 py-1 rounded text-sm' };
    }
  }

  getActivityIcon(type: string) {
    switch (type) {
      case 'payment': return 'pi pi-euro text-success';
      case 'document': return 'pi pi-file text-primary';
      case 'alert': return 'pi pi-exclamation-triangle text-warning';
      case 'new': return 'pi pi-plus text-secondary';
      default: return 'pi pi-info-circle';
    }
  }

  goTo(path: string) {
    this.router.navigate([path]);
  }
}
