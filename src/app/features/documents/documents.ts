import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

interface DocumentTemplate {
  id: number;
  name: string;
  description: string;
  category: string;
  usage: number;
}

interface RecentDocument {
  name: string;
  property: string;
  date: string;
  type: string;
}

@Component({
  selector: 'app-documents',
  imports: [],
  templateUrl: './documents.html',
  styleUrl: './documents.scss'
})
export class Documents {
private router = inject(Router);

  documentTemplates = signal<DocumentTemplate[]>([
    { id: 1, name: 'Bail de location vide', description: 'Contrat de location pour logement non meublé', category: 'Contrats', usage: 45 },
    { id: 2, name: 'Bail de location meublé', description: 'Contrat de location pour logement meublé', category: 'Contrats', usage: 23 },
    { id: 3, name: "État des lieux d'entrée", description: "Document d'inventaire à l'entrée du locataire", category: 'États des lieux', usage: 38 },
    { id: 4, name: "État des lieux de sortie", description: "Document d'inventaire à la sortie du locataire", category: 'États des lieux', usage: 15 },
    { id: 5, name: 'Quittance de loyer', description: 'Reçu de paiement mensuel', category: 'Comptabilité', usage: 156 },
    { id: 6, name: 'Congé pour vente', description: 'Notification de congé pour vendre le bien', category: 'Résiliation', usage: 8 },
    { id: 7, name: 'Augmentation de loyer', description: "Notification d'augmentation de loyer", category: 'Modifications', usage: 12 },
    { id: 8, name: 'Autorisation de travaux', description: 'Demande pour réaliser des travaux', category: 'Travaux', usage: 6 }
  ]);

  recentDocuments = signal<RecentDocument[]>([
    { name: 'Bail_Dupont_Jean_2024.pdf', property: 'Appartement Centre Ville', date: '15/01/2024', type: 'Bail de location' },
    { name: 'Quittance_Janvier_2024_Martin.pdf', property: 'Studio Quartier Latin', date: '10/01/2024', type: 'Quittance' },
    { name: 'Etat_lieux_sortie_Bernard.pdf', property: '2 pièces Montmartre', date: '05/01/2024', type: 'État des lieux' }
  ]);

  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }
}
