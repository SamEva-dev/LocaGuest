import { Routes } from '@angular/router';
import { AuthGuard } from './core/auth/guards/auth.guard';
import { GuestGuard } from './core/auth/guards/guest.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/landing-page/landing-page').then(m => m.LandingPage)
  },
  {
    path: 'login',
    canActivate: [GuestGuard],
    loadComponent: () => import('./pages/login/login').then(m => m.Login)
  },
  {
    path: 'register',
    canActivate: [GuestGuard],
    loadComponent: () => import('./pages/register/register').then(m => m.Register)
  },
  {
    path: 'accept-invitation',
    loadComponent: () => import('./pages/accept-invitation/accept-invitation.component').then(m => m.AcceptInvitationComponent)
  },
  {
    path: 'app',
   canActivate: [AuthGuard],
    loadComponent: () => import('./layouts/main-layout/main-layout').then(m => m.MainLayout),
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.Dashboard)
      },
      {
        path: 'mon-locaguest',
        loadComponent: () => import('./pages/mon-locaguest/mon-locaguest').then(m => m.MonLocaGuest)
      },
      {
        path: 'property/:id',
        loadComponent: () => import('./pages/property/property').then(m => m.Property)
      },
      {
        path: 'tenant/:id',
        loadComponent: () => import('./pages/tenant/tenant').then(m => m.Tenant)
      },
      {
        path: 'contracts',
        loadComponent: () => import('./pages/mon-locaguest/tabs/contracts/contracts-tab').then(m => m.ContractsTab)
      },
      {
        path: 'documents',
        loadComponent: () => import('./pages/mon-locaguest/tabs/documents/documents-tab').then(m => m.DocumentsTab)
      },
      {
        path: 'profitability',
        loadComponent: () => import('./pages/mon-locaguest/tabs/profitability/profitability-tab').then(m => m.ProfitabilityTab)
      },
      {
        path: 'rentability',
        loadComponent: () => import('./pages/rentability/rentability-page').then(m => m.RentabilityPage)
      },
      {
        path: 'settings',
        loadComponent: () => import('./pages/settings/settings-tab').then(m => m.SettingsTab)
      },
      {
        path: 'pricing',
        loadComponent: () => import('./pages/pricing/pricing-page.component').then(m => m.PricingPageComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];