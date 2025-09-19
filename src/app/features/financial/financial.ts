import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

interface Payment {
  description: string;
  amount: number;
  dueDate: string;
  status: 'En attente' | 'À payer';
  type?: 'expense'; // undefined => income
}

interface PropertyPerf {
  name: string;
  revenue: number;
  expenses: number;
  profit: number;
  roi: number;
}

interface ExpenseCategory {
  category: string;
  amount: number;
  percentage: number;
  color: string; // tailwind class
}

interface Investment {
  name: string;
  description: string;
  price: number;
  rent: number;
  roi: number;
}


@Component({
  selector: 'app-financial',
  imports: [CommonModule],
  templateUrl: './financial.html',
  styleUrl: './financial.scss'
})
export class Financial {
private router = inject(Router);

  // --- Onglets ---
  activeTab = signal<'overview' | 'cashflow' | 'expenses' | 'projections'>('overview');

  // --- Données (fidèles à ta maquette / code React) ---
  monthlyData = signal([
    { month: 'Jan', revenue: 18500, expenses: 3200, profit: 15300 },
    { month: 'Fév', revenue: 18500, expenses: 2800, profit: 15700 },
    { month: 'Mar', revenue: 19200, expenses: 4100, profit: 15100 },
    { month: 'Avr', revenue: 19200, expenses: 2900, profit: 16300 },
    { month: 'Mai', revenue: 20100, expenses: 3400, profit: 16700 },
    { month: 'Jun', revenue: 20100, expenses: 2600, profit: 17500 }
  ]);

  upcomingPayments = signal<Payment[]>([
    { description: 'Loyer Jean Dupont', amount: 1850, dueDate: '28/01/2024', status: 'En attente' },
    { description: 'Loyer Paul Martin', amount: 950, dueDate: '30/01/2024', status: 'En attente' },
    { description: 'Charges copropriété', amount: -450, dueDate: '31/01/2024', status: 'À payer', type: 'expense' }
  ]);

  propertyPerformance = signal<PropertyPerf[]>([
    { name: 'Appartement Centre Ville', revenue: 1850, expenses: 320, profit: 1530, roi: 8.9 },
    { name: 'Studio Quartier Latin',    revenue: 950,  expenses: 180, profit: 770,  roi: 9.2 },
    { name: '2 pièces Montmartre',      revenue: 1200, expenses: 250, profit: 950,  roi: 8.1 }
  ]);

  expenseCategories = signal<ExpenseCategory[]>([
    { category: 'Travaux & Réparations',  amount: 2400, percentage: 35, color: 'bg-primary'     },
    { category: 'Charges de copropriété', amount: 1800, percentage: 26, color: 'bg-secondary'   },
    { category: 'Assurances',             amount: 950,  percentage: 14, color: 'bg-accent'      },
    { category: 'Frais de gestion',       amount: 720,  percentage: 10, color: 'bg-muted'       },
    { category: 'Taxes',                   amount: 680,  percentage: 10, color: 'bg-warning'     },
    { category: 'Autres',                  amount: 350,  percentage: 5,  color: 'bg-destructive' }
  ]);

  optimizations = signal([
    {
      icon: 'pi pi-exclamation-circle',
      color: 'text-warning',
      bg: 'bg-warning/5',
      title: "Négocier les contrats d'assurance",
      subtitle: 'Économie potentielle: 200€/mois'
    },
    {
      icon: 'pi pi-bullseye',
      color: 'text-primary',
      bg: 'bg-primary/5',
      title: 'Regrouper les travaux',
      subtitle: "Réduction des frais d'intervention: 15%"
    }
  ]);

  investments = signal<Investment[]>([
    { name: 'Acquisition bien #4', description: 'Appartement 2 pièces - Quartier émergent', price: 180000, rent: 1100, roi: 7.3 }
  ]);

  // --- UI ---
  years = signal([2024, 2023, 2022]);
  selectedYear = signal(2024);

  // --- Actions ---
  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }
  setYear(value: string) {
    const y = Number(value);
    if (!Number.isNaN(y)) this.selectedYear.set(y);
  }
}
