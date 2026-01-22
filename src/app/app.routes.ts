import { Routes } from '@angular/router';
import { AuthGuard } from './core/auth/guards/auth.guard';
import { GuestGuard } from './core/auth/guards/guest.guard';
import { permissionGuard } from './core/auth/guards/permission.guard';
import { Permissions } from './core/auth/permissions';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/landing-page/landing-page').then(m => m.LandingPage)
  },
  {
    path: 'forgot-password',
    canActivate: [GuestGuard],
    loadComponent: () => import('./pages/forgot-password/forgot-password').then(m => m.ForgotPassword)
  },
  {
    path: 'check-email',
    canActivate: [GuestGuard],
    loadComponent: () => import('./pages/check-email/check-email').then(m => m.CheckEmail)
  },
  {
    path: 'confirm-email',
    canActivate: [GuestGuard],
    loadComponent: () => import('./pages/confirm-email/confirm-email').then(m => m.ConfirmEmail)
  },
  {
    path: 'reset-password',
    canActivate: [GuestGuard],
    loadComponent: () => import('./pages/reset-password/reset-password').then(m => m.ResetPassword)
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
    loadComponent: () => import('./pages/accept-invitation/accept-invitation').then(m => m.AcceptInvitationComponent)
  },
  {
    path: 'privacy',
    loadComponent: () => import('./pages/legal/privacy-policy/privacy-policy.component').then(m => m.PrivacyPolicyComponent)
  },
  {
    path: 'terms',
    loadComponent: () => import('./pages/legal/terms-of-service/terms-of-service.component').then(m => m.TermsOfServiceComponent)
  },
  {
    path: 'imprint',
    loadComponent: () => import('./pages/legal/imprint/imprint.component').then(m => m.ImprintComponent)
  },
  {
    path: 'features',
    loadComponent: () => import('./pages/features/features.component').then(m => m.FeaturesComponent)
  },
  {
    path: 'contact',
    loadComponent: () => import('./pages/contact/contact.component').then(m => m.ContactComponent)
  },
  {
    path: 'help',
    loadComponent: () => import('./pages/help/help.component').then(m => m.HelpComponent)
  },
  {
    path: 'forbidden',
    canActivate: [AuthGuard],
    loadComponent: () => import('./pages/forbidden/forbidden-page').then(m => m.ForbiddenPage)
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
        path: 'contracts',
        canActivate: [permissionGuard(Permissions.ContractsRead)],
        loadComponent: () => import('./pages/mon-locaguest/tabs/contracts/contracts-tab').then(m => m.ContractsTab)
      },
      {
        path: 'documents',
        canActivate: [permissionGuard(Permissions.DocumentsRead)],
        loadComponent: () => import('./pages/mon-locaguest/tabs/documents/documents-tab').then(m => m.DocumentsTab)
      },
      {
        path: 'profitability',
        canActivate: [permissionGuard(Permissions.AnalyticsRead)],
        loadComponent: () => import('./pages/mon-locaguest/tabs/profitability/profitability-tab').then(m => m.ProfitabilityTab)
      },
      {
        path: 'rentability',
        canActivate: [permissionGuard(Permissions.AnalyticsRead)],
        loadComponent: () => import('./pages/rentability/rentability-page').then(m => m.RentabilityPage)
      },
      {
        path: 'settings',
        loadComponent: () => import('./pages/settings/settings-tab').then(m => m.SettingsTab)
      },
      {
        path: 'pricing',
        loadComponent: () => import('./pages/pricing/pricing-page.component').then(m => m.PricingPageComponent)
      },
      {
        path: 'chatbot',
        loadComponent: () => import('./pages/chatbot/chatbot-page').then(m => m.ChatbotPage)
      }
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];