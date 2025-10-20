export interface DashboardStatsDto {
  properties: number;
  tenants: number;
  revenue: number;
  occupancyRate: number;
}

export interface ActivityDto {
  type: 'payment' | 'document' | 'alert' | 'new';
  message: string;
  amount?: string;
  time: string;
}

export interface PropertyDto {
  id: string;
  name: string;
  address: string;
  type: string;
  tenant?: string;
  rent: number;
  status: 'occupied' | 'vacant' | 'maintenance';
  nextDue?: string;
}
