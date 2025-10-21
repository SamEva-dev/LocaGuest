import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { FinancialApi } from '../core/api/financial.api';
import { FinancialDashboardDto } from '../models/financial.models';

@Injectable({ providedIn: 'root' })
export class FinancialService {
  private readonly api = inject(FinancialApi);

  readonly loading = signal(false);
  readonly data = signal<FinancialDashboardDto | null>(null);
  readonly selectedYear = signal<number>(2024);

  async load(year = this.selectedYear()) {
    this.loading.set(true);
    try {
      const result = await firstValueFrom(this.api.getDashboard(year));
      this.data.set(result);
    } finally {
      this.loading.set(false);
    }
  }

  async exportData(year = this.selectedYear()) {
    const file = await firstValueFrom(this.api.export(year));
    const blob = new Blob([file], { type: 'application/octet-stream' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `financial-${year}.xlsx`;
    a.click();
  }
}
