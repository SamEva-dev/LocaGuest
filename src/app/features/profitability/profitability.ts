import { DecimalPipe } from '@angular/common';
import { Component, signal } from '@angular/core';

interface IProfitability {
  month: string;
  revenus: number;
  charges: number;
  benefice: number;
  rendement: number;
}

interface Investment {
  name: string;
  valeur: number;
  rendement: number;
  benefice: number;
}

interface Expense {
  name: string;
  value: number;
  color: string;
}

@Component({
  selector: 'app-profitability',
  imports: [DecimalPipe],
  templateUrl: './profitability.html',
  styleUrl: './profitability.scss'
})
export class Profitability {
selectedPeriod = signal('6months');
  selectedProperty = signal('all');

  profitabilityData = signal<IProfitability[]>([
    { month: 'Jan', revenus: 4500, charges: 2200, benefice: 2300, rendement: 5.2 },
    { month: 'Fév', revenus: 4800, charges: 2100, benefice: 2700, rendement: 5.8 },
    { month: 'Mar', revenus: 4600, charges: 2300, benefice: 2300, rendement: 5.1 },
    { month: 'Avr', revenus: 5200, charges: 2400, benefice: 2800, rendement: 6.1 },
    { month: 'Mai', revenus: 5100, charges: 2200, benefice: 2900, rendement: 6.3 },
    { month: 'Jun', revenus: 5400, charges: 2500, benefice: 2900, rendement: 6.2 }
  ]);

  investmentData = signal<Investment[]>([
    { name: 'Appartement Centre', valeur: 180000, rendement: 6.2, benefice: 950 },
    { name: 'Studio Quartier Étudiant', valeur: 95000, rendement: 7.8, benefice: 620 },
    { name: 'Maison Banlieue', valeur: 220000, rendement: 5.4, benefice: 990 },
    { name: 'T2 Proche Métro', valeur: 145000, rendement: 6.8, benefice: 820 }
  ]);

  expenseBreakdown = signal<Expense[]>([
    { name: 'Charges Copropriété', value: 35, color: '#8B5CF6' },
    { name: 'Taxes Foncières', value: 25, color: '#06B6D4' },
    { name: 'Assurances', value: 15, color: '#10B981' },
    { name: 'Travaux/Maintenance', value: 20, color: '#F59E0B' },
    { name: 'Gestion/Administration', value: 5, color: '#EF4444' }
  ]);

  get totalRevenue() {
    return this.profitabilityData().reduce((sum, i) => sum + i.revenus, 0);
  }
  get totalExpenses() {
    return this.profitabilityData().reduce((sum, i) => sum + i.charges, 0);
  }
  get totalProfit() {
    return this.totalRevenue - this.totalExpenses;
  }
  get averageYield() {
    return (this.totalProfit / this.totalRevenue) * 100;
  }
}
