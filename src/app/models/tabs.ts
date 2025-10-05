 type Tabs = 'profile' | 'notifications' | 'security' | 'billing' | 'preferences' | 'layout';

 export interface DashboardTab {
  id: string;
  title: string;
  type: 'dashboard' | 'property';
}