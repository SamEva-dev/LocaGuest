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


export interface DashboardStatItem {
  titleKey: string;     // ex: 'DASHBOARD.STATS.PROPERTIES'
  value: string;        // ex: '12'
  change?: string;      // ex: '+2 ce mois'
  icon?: string;        // ex: 'ph-buildings'
  colorClass?: string;  // ex: 'text-blue-600'
}

export interface PropertyRow {
  id: string;
  address: string;
  type: string;
  tenant: string | null;
  rent: number;        // en euros
  status: 'occupied' | 'vacant' | 'available' | 'occupied' | 'maintenance' |'unknown';
  nextDue?: string | null; // ISO date
}

export interface ActivityItem {
  id: string;
  type: 'payment' | 'document' | 'alert' | 'new' | 'info';
  message: string;
  amount?: number;    // euros
  time: string;       // ex: 'Il y a 2h' (ou ISO si tu préfères)
}

export interface DashboardPayload {
  stats: DashboardStatItem[];
  properties: PropertyRow[];
  activities: ActivityItem[];
}


export interface PropertyDto {
  id: string;
  name: string;
  address: string;
  type: string;
  status: 'occupied' | 'vacant' | 'maintenance' ;
  rent: number;
  surface?: number;
  rooms?: string;
  floor?: string;
  elevator?: boolean;
  parking?: string;
  furnished?: boolean;
  charges?: number;
  deposit?: number;
  annualRevenue?: number;
  nextDue?: string;
}

export interface TenantDto {
  id?: string;
  name: string;
  email: string;
  since: string;
  status: string;
}

export interface LeaseDto {
  id?: string;
  title: string;
  start: string;
  end: string;
  duration: string;
  type: string;
}

export interface DocumentDto {
  id?: string;
  title: string;
  size: string;
  url?: string;
}

export interface MaintenanceDto {
  id?: string;
  title: string;
  provider: string;
  date: string;
  cost: number;
  status: string;
}

export interface ContractDto {
  id: string;
  propertyName: string;
  tenantNames: string;
  startDate: string;
  endDate: string;
  type: 'furnished' | 'unfurnished';
  duration: string;
  rent: number;
  status: 'active' | 'expiringSoon' | 'terminated';
}

export interface ContractStatsDto {
  activeContracts: number;
  expiringIn3Months: number;
  monthlyRevenue: number;
  tenantCount: number;
}

export interface PropertyFilter {
  status?: string;
  type?: string;
  tenant?: boolean; // true = occupé, false = libre
  minRent?: number;
  maxRent?: number;
}
export interface ContractFilter {
  status?: string;
  type?: string;
  tenant?: string;
  propertyName?: string;
  startAfter?: string;
  endBefore?: string;
  minRent?: number;
  maxRent?: number;
}
