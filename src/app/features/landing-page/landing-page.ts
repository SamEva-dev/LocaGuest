import { Component } from '@angular/core';

import { NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';


@Component({
  selector: 'app-landing-page',
  imports: [ RouterLink, ButtonModule],
  templateUrl: './landing-page.html',
  styleUrl: './landing-page.scss'
})
export class LandingPage {
  features = [
      { icon: 'pi pi-building', title: 'Gestion des Biens', description: 'Gérez tous vos biens immobiliers en un seul endroit. Locations, colocations et saisonnières.' },
    { icon: 'pi pi-users', title: 'Suivi des Locataires', description: 'Suivez vos locataires, leurs contrats, paiements et toute leur documentation.' },
    { icon: 'pi pi-file', title: 'Documents Automatisés', description: 'Générez automatiquement contrats, avenants, quittances et rappels.' },
    { icon: 'pi pi-chart-line', title: 'Analyses & Projections', description: 'Tableaux de bord complets avec analyses financières et projections.' },
    { icon: 'pi pi-shield', title: 'Conformité Légale', description: 'Restez conforme avec les dernières réglementations locatives.' },
    { icon: 'pi pi-cog', title: 'Comptabilité Simplifiée', description: 'Export automatique vers votre expert-comptable et suivi fiscal.' }
    ];
  }
