import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

interface Contract {
  id: number;
  property: string;
  tenant: string;
  startDate: string;
  endDate: string;
  rent: number;
  status: 'Actif' | 'Expire bientôt';
  type: 'Meublé' | 'Non meublé';
  duration: string;
}

@Component({
  selector: 'app-contrats',
  imports: [],
  templateUrl: './contrats.html',
  styleUrl: './contrats.scss'
})
export class Contrats {
private router = inject(Router);

  contracts = signal<Contract[]>([
    {
      id: 1,
      property: 'Appartement 3 pièces - Centre Ville',
      tenant: 'Jean Dupont & Marie Lefebvre',
      startDate: '15/03/2023',
      endDate: '14/03/2026',
      rent: 1850,
      status: 'Actif',
      type: 'Non meublé',
      duration: '3 ans'
    },
    {
      id: 2,
      property: 'Studio - Quartier Latin',
      tenant: 'Paul Martin',
      startDate: '01/09/2023',
      endDate: '31/08/2024',
      rent: 950,
      status: 'Actif',
      type: 'Meublé',
      duration: '1 an'
    },
    {
      id: 3,
      property: 'Appartement 2 pièces - Montmartre',
      tenant: 'Sophie Bernard',
      startDate: '10/01/2023',
      endDate: '09/01/2024',
      rent: 1200,
      status: 'Expire bientôt',
      type: 'Non meublé',
      duration: '1 an'
    }
  ]);

  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }
}
