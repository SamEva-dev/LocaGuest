export interface AnalyticsOverview {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  averageYield: number;
  revenueChange: number;
  expensesChange: number;
  profitChange: number;
}

export interface AnalyticsPropertyPerformance {
  name: string;
  value: number;
  monthlyIncome: number;
  yield: number;
}

export interface AnalyticsOptimization {
  type: 'warning' | 'opportunity' | 'advice';
  title: string;
  message: string;
  action: string;
}

export interface AnalyticsChartPoint {
  month: string;
  revenue: number;
  expense: number;
}

export interface AnalyticsYieldShare {
  property: string;
  yield: number;
}


// ✅ réponse typée (inclut cashflow & yieldShare)
export interface AnalyticsResponse {
  overview: AnalyticsOverview;
  performances: AnalyticsPropertyPerformance[];
  optimizations: AnalyticsOptimization[];
  cashflow: AnalyticsChartPoint[];
  yieldShare: AnalyticsYieldShare[];
}