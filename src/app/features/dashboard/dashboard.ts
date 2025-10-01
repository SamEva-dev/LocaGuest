import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, HostListener, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-dashboard',
  imports: [TranslatePipe,CommonModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard {

  private router = inject(Router);
  private translate = inject(TranslateService)

  searchQuery = signal('');

  stats = signal([
  {
    title: 'DASHBOARD.STATS.PROPERTIES', // Biens gérés
    value: '12',
    change: '+2 ce mois',
    icon: 'ph-buildings',          // 🏢 Immeubles
    color: 'text-blue-600'
  },
  {
    title: 'DASHBOARD.STATS.TENANTS', // Locataires actifs
    value: '28',
    change: '+5 ce mois',
    icon: 'ph-users-three',       // 👥 Plusieurs utilisateurs
    color: 'text-indigo-600'
  },
  {
    title: 'DASHBOARD.STATS.REVENUE', // Revenus mensuels
    value: '15 840€',
    change: '+8.2% vs mois dernier',
    icon: 'ph-currency-eur',      // 💶 Euro
    color: 'text-green-600'
  },
  {
    title: 'DASHBOARD.STATS.OCCUPANCY', // Taux d'occupation
    value: '94%',
    change: '+2% ce mois',
    icon: 'ph-chart-line-up',     // 📈 Graphique montant
    color: 'text-purple-600'
  }
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
        return {
          label: 'DASHBOARD.PROPERTIES.STATUS.OCCUPIED',
          classes:
            'bg-green-100 text-green-700 border border-green-200 px-2 py-1 rounded-full text-xs font-semibold'
        };
      case 'vacant':
        return {
          label: 'DASHBOARD.PROPERTIES.STATUS.VACANT',
          classes:
            'bg-amber-100 text-amber-700 border border-amber-200 px-2 py-1 rounded-full text-xs font-semibold'
        };
      default:
        return {
          label: 'DASHBOARD.PROPERTIES.STATUS.UNKNOWN',
          classes:
            'bg-gray-100 text-gray-700 border border-gray-200 px-2 py-1 rounded-full text-xs font-semibold'
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
    this.router.navigate(['/properties', id, 'edit']);
  }

  deleteProperty(id: number) {
    this.closeMenu();
    const msg = this.translate.instant('DASHBOARD.PROPERTIES.MENU.DELETE_CONFIRM');
    if (confirm(msg)) {
      // TODO: appel service suppression
      console.log('Delete property', id);
    }
  }

  goTo(path: string) {
    this.router.navigate([path]);
  }

  addProperty() {
  console.log('➡️ Bouton "+ Ajouter un bien" cliqué');
  // TODO: Naviguer vers la page de création de bien
  this.router.navigate(['/properties/new']);
}


}
