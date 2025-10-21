import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';

interface StatCard {
  title: string;
  value: string;
  change?: string;
  changeColor?: string;
  icon: string;
}

interface CashFlowItem {
  label: string;
  amount: number;
}

interface PropertyPerf {
  name: string;
  revenue: number;
  charges: number;
  roi: number;
}

interface ChargeItem {
  label: string;
  amount: number;
  percent: number;
  color: string;
}

interface Optimization {
  title: string;
  description: string;
  color: string; // bg-yellow-50, bg-blue-50...
}

interface ProjectionCard {
  title: string;
  value: string;
  change?: string;
  changeColor?: string;
}

@Component({
  selector: 'app-financial',
  imports: [CommonModule, FormsModule, TranslatePipe],
  template: '',
  styleUrl: './financial.scss'
})
export class Financial {
tabs = ['Vue d\'ensemble', 'Flux de trésorerie', 'Analyse des charges', 'Projections'];
  activeTab = this.tabs[0];

  // === Vue d'ensemble ===
  stats: StatCard[] = [
    { title: 'Revenus mensuels', value: '20 100€', change: '+4.5% vs mois dernier', changeColor: 'text-green-600', icon: 'ph-currency-eur' },
    { title: 'Charges mensuelles', value: '2 600€', change: '-8.2% vs mois dernier', changeColor: 'text-red-600', icon: 'ph-trend-down' },
    { title: 'Bénéfice net', value: '17 500€', change: '+7.1% vs mois dernier', changeColor: 'text-blue-600', icon: 'ph-calculator' },
    { title: 'Taux de rentabilité', value: '8.7%', change: 'Objectif : 8.5%', changeColor: 'text-gray-500', icon: 'ph-clock' },
  ];

  upcoming = [
    { label: 'Loyer Jean Dupont', due: '28/01/2024', amount: 1850, status: 'en-attente' },
    { label: 'Loyer Paul Martin', due: '30/01/2024', amount: 950, status: 'en-attente' },
    { label: 'Charges copropriété', due: '31/01/2024', amount: -450, status: 'a-payer' },
  ];

  properties = [
    { name: 'Appartement Centre Ville', revenue: 1850, charges: 320, roi: 8.9 },
    { name: 'Studio Quartier Latin', revenue: 950, charges: 180, roi: 9.2 },
    { name: '2 pièces Montmartre', revenue: 1200, charges: 250, roi: 8.1 },
  ];

  // === Flux de trésorerie ===
  incomes: CashFlowItem[] = [
    { label: 'Loyers encaissés', amount: 18200 },
    { label: 'Dépôts de garantie', amount: 1850 },
    { label: 'Régularisations charges', amount: 150 },
  ];
  expenses: CashFlowItem[] = [
    { label: 'Travaux & réparations', amount: -2400 },
    { label: 'Charges copropriété', amount: -1800 },
    { label: 'Assurances', amount: -950 },
  ];

  // === Analyse des charges ===
  charges: ChargeItem[] = [
    { label: 'Travaux & Réparations', amount: 2400, percent: 35, color: 'bg-blue-500' },
    { label: 'Charges de copropriété', amount: 1800, percent: 26, color: 'bg-green-500' },
    { label: 'Assurances', amount: 950, percent: 14, color: 'bg-yellow-500' },
    { label: 'Frais de gestion', amount: 720, percent: 10, color: 'bg-purple-500' },
    { label: 'Taxes', amount: 680, percent: 10, color: 'bg-orange-500' },
    { label: 'Autres', amount: 350, percent: 5, color: 'bg-red-500' },
  ];

  optimizations: Optimization[] = [
    { title: 'Négocier les contrats d’assurance', description: 'Économie potentielle: 200€/mois', color: 'bg-yellow-50' },
    { title: 'Regrouper les travaux', description: 'Réduction des frais d’intervention: 15%', color: 'bg-blue-50' },
  ];

  // === Projections ===
  projections: ProjectionCard[] = [
    { title: 'Projection 12 mois', value: '+210,000€', change: '+12% vs année précédente', changeColor: 'text-green-600' },
    { title: 'Projection 5 ans', value: '+1,150,000€', change: 'Croissance moyenne: 8.5%', changeColor: 'text-green-600' },
    { title: 'ROI projeté', value: '9.2%', change: 'Objectif dépassé', changeColor: 'text-green-600' },
  ];

  opportunities = [
    { title: 'Acquisition bien #4', desc: 'Appartement 2 pièces - Quartier émergent', price: 180000, rent: 1100, roi: 7.3 }
  ];

  setTab(tab: string) {
    this.activeTab = tab;
  }
}
