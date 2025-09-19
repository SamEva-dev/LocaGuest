import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class FinancialService {
  private http = inject(HttpClient);

  stats = signal({
    revenues: 20100,
    expenses: 2600,
    profit: 17500,
    roi: 8.7
  });

  projections = signal([
    { label: 'Projection 12 mois', value: '+210,000€', growth: '+12%' },
    { label: 'Projection 5 ans', value: '+1,150,000€', growth: '+8.5% annuel' }
  ]);

  load() {
    setTimeout(() => {
      this.stats.set({
        revenues: 21000,
        expenses: 2700,
        profit: 18300,
        roi: 9.1
      });
    }, 600);
  }
}
