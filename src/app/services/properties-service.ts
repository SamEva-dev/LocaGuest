import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';

export interface Property {
  id: number;
  title: string;
  address: string;
  rent: number;
  status: 'Occupé' | 'Vacant';
}

@Injectable({
  providedIn: 'root'
})
export class PropertiesService {
  private http = inject(HttpClient);

  properties = signal<Property[]>([]);

  load() {
    setTimeout(() => {
      this.properties.set([
        { id: 1, title: '15 Rue de la Paix, Paris 2e', address: 'Appartement 2P', rent: 1250, status: 'Occupé' },
        { id: 2, title: '8 Avenue des Champs, Lyon 3e', address: 'Studio', rent: 780, status: 'Occupé' },
        { id: 3, title: '22 Boulevard Voltaire, Marseille', address: 'Colocation 4P', rent: 2100, status: 'Occupé' },
        { id: 4, title: '45 Rue du Commerce, Nice', address: 'Appartement 3P', rent: 1450, status: 'Vacant' }
      ]);
    }, 400);
  }
}
