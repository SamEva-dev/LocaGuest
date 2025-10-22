import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Welcome } from './pages/welcome/welcome';
import { LandingPage } from './pages/landing-page/landing-page';
import { Register } from './pages/register/register';
import { MainLayout } from './features/main-layout/main-layout';
import { Settings } from './features/settings/settings';
import { Contracts } from './features/contracts/contracts';
import { Documents } from './features/documents/documents';
import { DashboardTabs } from './features/dashboard/dashboard-tabs/dashboard-tabs';
import { AuthGuard } from './core/auth/guards/auth.guard';
import { GuestGuard } from './core/auth/guards/guest.guard';
import { MfaComponent } from './pages/mfa/mfa';

export const routes: Routes = [
  {
    path: '',
    component: Welcome,
    children: [
      { path: '', component: LandingPage }, // page par défaut
      { path: 'login', component: Login , canActivate: [GuestGuard] },
      { path: 'register', component: Register , canActivate: [GuestGuard] },
      { path: 'mfa', component: MfaComponent },
      {path: 'forgot-password', loadComponent: () => import('./pages/forgot-password/forgot-password').then(m => m.ForgotPassword), canActivate: [GuestGuard]}
    ]
  },
  {
    path: '',
    component: MainLayout,
    canActivate: [AuthGuard],
    children: [
      { path: 'dashboard', component: DashboardTabs },
      { path: 'settings', component: Settings },
      { path: 'contrats', component: Contracts },
      { path: 'financial', loadComponent: () => import('./features/financial/financial').then(m => m.Financial) },
      { path: 'analytics', loadComponent: () => import('./features/analytics/analytics').then(m => m.Analytics) },
      {path: 'documents', component: Documents}
    ]
    },
 { path: '**', redirectTo: 'login' }
];