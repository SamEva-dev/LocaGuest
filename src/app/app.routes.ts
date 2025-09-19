import { Routes } from '@angular/router';
import { LandingPage } from './features/landing-page/landing-page';
import { Auth } from './authentication/auth/auth';
import { GuestGuard } from './guards/guest-guard-guard';
import { Dashboard } from './features/dashboard/dashboard';
import { Contrats } from './features/contrats/contrats';
import { Documents } from './features/documents/documents';
import { Financial } from './features/financial/financial';
import { PropertyDetails } from './features/property-details/property-details';
import { Settings } from './features/settings/settings';
import { Profitability } from './features/profitability/profitability';

export const routes: Routes = [
  { path: '', redirectTo: 'landing', pathMatch: 'full' },
  { path: 'landing', component: LandingPage },
  { path: 'auth', component: Auth, canActivate: [GuestGuard] },
  { path: 'documents', component: Documents },
  { path: 'dashboard', component: Dashboard },
  { path: 'contrats', component: Contrats },
  {path: 'financial', component: Financial },
  {path: 'settings', component: Settings },
  {path:'profitability', component: Profitability },
  {path: 'property/:id', component: PropertyDetails },
  { path: '**', redirectTo: 'landing' } // fallback 404 → landing
];
