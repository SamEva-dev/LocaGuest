import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { FinancialService } from '../../services/financial.service';

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
  templateUrl: './financial.html',
  styleUrl: './financial.scss'
})
export class Financial {
private readonly translate = inject(TranslateService);
  readonly service = inject(FinancialService);

  readonly tabs = [
    "PROPERTY.TABS.OVERVIEW",
    'FINANCIAL.TABS.CASHFLOW',
    'FINANCIAL.TABS.CHARGES',
    'FINANCIAL.TABS.PROJECTIONS'
  ];
  readonly activeTab = signal(this.tabs[0]);

  data = this.service.data;

  async ngOnInit() {
    await this.service.load();
  }

  setTab(tab: string) {
    this.activeTab.set(tab);
  }

  async changeYear(event: any) {
    const year = Number(event.target.value);
    this.service.selectedYear.set(year);
    await this.service.load(year);
  }

  async export() {
    await this.service.exportData(this.service.selectedYear());
  }
}
