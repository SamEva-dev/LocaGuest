import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { GuestGuard } from './guards/guest-guard';
import { Welcome } from './pages/welcome/welcome';
import { LandingPage } from './pages/landing-page/landing-page';
import { Register } from './pages/register/register';

export const routes: Routes = [
  {
    path: '',
    component: Welcome,
    children: [
      { path: '', component: LandingPage }, // page par défaut
      { path: 'login', component: Login , canActivate: [GuestGuard] },
      { path: 'register', component: Register , canActivate: [GuestGuard] },
      {path: 'forgot-password', loadComponent: () => import('./pages/forgot-password/forgot-password').then(m => m.ForgotPassword), canActivate: [GuestGuard]}
    ]
  },
//   {
//     path: '',
//     component: MainLayoutComponent,
//     children: [
//       { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },
//       { path: 'inbox', loadComponent: () => import('./features/inbox/inbox.component').then(m => m.InboxComponent) },
//       // ajoute ici toutes tes routes de features
//     ]
//   },
  {
    path: '**',
    redirectTo: '' // si route inconnue → redirection accueil
  }
];