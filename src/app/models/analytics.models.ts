// Analytics models
export interface AnalyticsOverview {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  occupancyRate: number;
}

export interface AnalyticsPropertyPerformance {
  propertyId: string;
  propertyName: string;
  revenue: number;
  expenses: number;
  roi: number;
}

export interface AnalyticsOptimization {
  type: 'opportunity' | 'warning' | 'advice';
  title: string;
  description: string;
}

export interface AnalyticsResponse {
  overview: AnalyticsOverview;
  propertyPerformances: AnalyticsPropertyPerformance[];
  optimizations: AnalyticsOptimization[];
}
