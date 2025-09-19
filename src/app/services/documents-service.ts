import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';

export interface DocumentModel {
  id: number;
  type: string;
  title: string;
  category: string;
  usages: number;
}

@Injectable({
  providedIn: 'root'
})
export class DocumentsService {
  private http = inject(HttpClient);

  templates = signal<DocumentModel[]>([]);

  load() {
    setTimeout(() => {
      this.templates.set([
        { id: 1, type: 'bail-vide', title: 'Bail de location vide', category: 'Contrats', usages: 45 },
        { id: 2, type: 'bail-meuble', title: 'Bail de location meublé', category: 'Contrats', usages: 23 },
        { id: 3, type: 'etat-entree', title: "État des lieux d'entrée", category: 'États des lieux', usages: 38 }
      ]);
    }, 700);
  }
}
