export interface StatCard {
  title: string;
  value: string;
  change?: string;
  changeColor?: string;
  icon: string;
}

export interface CashFlowItem {
  label: string;
  amount: number;
}

export interface PropertyPerf {
  name: string;
  revenue: number;
  charges: number;
  roi: number;
}

export interface ChargeItem {
  label: string;
  amount: number;
  percent: number;
  color: string;
}

export interface Optimization {
  title: string;
  description: string;
  color: string;
}

export interface ProjectionCard {
  title: string;
  value: string;
  change?: string;
  changeColor?: string;
}

export interface FinancialDashboardDto {
  stats: StatCard[];
  upcoming: { label: string; due: string; amount: number; status: string }[];
  properties: PropertyPerf[];
  incomes: CashFlowItem[];
  expenses: CashFlowItem[];
  charges: ChargeItem[];
  optimizations: Optimization[];
  projections: ProjectionCard[];
  opportunities: {
    title: string;
    desc: string;
    price: number;
    rent: number;
    roi: number;
  }[];
}
