import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';

export interface Contract {
  id: number;
  title: string;
  tenant: string;
  period: string;
  rent: number;
  status: 'Actif' | 'Expire bientôt';
}

@Injectable({
  providedIn: 'root'
})
export class ContractsService {
  private http = inject(HttpClient);

  contracts = signal<Contract[]>([]);

  load() {
    // Simule le backend
    setTimeout(() => {
      this.contracts.set([
        { id: 1, title: 'Appartement 3 pièces - Centre Ville', tenant: 'Jean Dupont & Marie Lefebvre', period: '15/03/23 - 14/03/26', rent: 1850, status: 'Actif' },
        { id: 2, title: 'Studio - Quartier Latin', tenant: 'Paul Martin', period: '01/09/23 - 31/08/24', rent: 950, status: 'Actif' },
        { id: 3, title: 'Appartement 2 pièces - Montmartre', tenant: 'Sophie Bernard', period: '10/01/23 - 09/01/24', rent: 1200, status: 'Expire bientôt' }
      ]);
    }, 500);
  }
}
