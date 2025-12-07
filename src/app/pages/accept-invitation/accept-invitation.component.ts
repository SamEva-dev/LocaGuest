import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TeamApi } from '../../core/api/team.api';

@Component({
  selector: 'accept-invitation',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-6">
      <div class="max-w-md w-full">
        <!-- Loading State -->
        @if (loading()) {
          <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-12 text-center">
            <div class="w-16 h-16 mx-auto mb-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <i class="ph ph-spinner text-3xl text-emerald-600 dark:text-emerald-400 animate-spin"></i>
            </div>
            <h2 class="text-2xl font-bold text-slate-800 dark:text-white mb-2">
              Vérification de votre invitation...
            </h2>
            <p class="text-slate-600 dark:text-slate-400">
              Veuillez patienter un instant
            </p>
          </div>
        }

        <!-- Success State -->
        @else if (accepted()) {
          <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-12 text-center">
            <div class="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <i class="ph ph-check-circle text-5xl text-emerald-600 dark:text-emerald-400"></i>
            </div>
            
            <h2 class="text-3xl font-bold text-slate-800 dark:text-white mb-4">
              🎉 Bienvenue !
            </h2>
            
            <div class="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-6 mb-6">
              <p class="text-lg text-slate-700 dark:text-slate-300 mb-2">
                Vous avez rejoint
              </p>
              <p class="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {{ organizationName() }}
              </p>
              <p class="text-sm text-slate-600 dark:text-slate-400 mt-2">
                en tant que <strong>{{ roleLabel() }}</strong>
              </p>
            </div>

            <p class="text-slate-600 dark:text-slate-400 mb-8">
              Vous pouvez maintenant accéder à toutes les fonctionnalités de gestion immobilière de LocaGuest.
            </p>

            <button
              (click)="navigateToLogin()"
              class="w-full px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg font-semibold hover:shadow-lg transition">
              <i class="ph ph-sign-in mr-2"></i>
              Se connecter
            </button>
          </div>
        }

        <!-- Error State -->
        @else if (error()) {
          <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-12 text-center">
            <div class="w-20 h-20 mx-auto mb-6 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
              <i class="ph ph-warning-circle text-5xl text-rose-600 dark:text-rose-400"></i>
            </div>
            
            <h2 class="text-2xl font-bold text-slate-800 dark:text-white mb-4">
              Invitation invalide
            </h2>
            
            <div class="bg-rose-50 dark:bg-rose-900/20 rounded-xl p-4 mb-6">
              <p class="text-sm text-rose-700 dark:text-rose-400">
                {{ errorMessage() }}
              </p>
            </div>

            <p class="text-slate-600 dark:text-slate-400 mb-8">
              Causes possibles :
            </p>
            
            <ul class="text-left text-sm text-slate-600 dark:text-slate-400 space-y-2 mb-8">
              <li class="flex items-start gap-2">
                <i class="ph ph-x-circle text-rose-500 mt-0.5"></i>
                <span>Le lien d'invitation a expiré (> 72h)</span>
              </li>
              <li class="flex items-start gap-2">
                <i class="ph ph-x-circle text-rose-500 mt-0.5"></i>
                <span>L'invitation a déjà été utilisée</span>
              </li>
              <li class="flex items-start gap-2">
                <i class="ph ph-x-circle text-rose-500 mt-0.5"></i>
                <span>Le lien est invalide ou corrompu</span>
              </li>
            </ul>

            <button
              (click)="navigateToHome()"
              class="w-full px-6 py-3 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white rounded-lg font-semibold hover:bg-slate-300 dark:hover:bg-slate-600 transition">
              <i class="ph ph-house mr-2"></i>
              Retour à l'accueil
            </button>
          </div>
        }

        <!-- Footer -->
        <p class="text-center text-sm text-slate-500 dark:text-slate-400 mt-8">
          © 2024 LocaGuest - Gestion immobilière simplifiée
        </p>
      </div>
    </div>
  `,
  styles: []
})
export class AcceptInvitationComponent implements OnInit {
  private teamApi = inject(TeamApi);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  loading = signal(true);
  accepted = signal(false);
  error = signal(false);
  errorMessage = signal('');
  organizationName = signal('');
  roleLabel = signal('');

  ngOnInit() {
    // Récupérer le token depuis l'URL
    this.route.queryParams.subscribe(params => {
      const token = params['token'];
      
      if (!token) {
        this.showError('Aucun token d\'invitation fourni');
        return;
      }

      this.acceptInvitation(token);
    });
  }

  acceptInvitation(token: string) {
    this.loading.set(true);
    
    this.teamApi.acceptInvitation({ token }).subscribe({
      next: (response) => {
        this.loading.set(false);
        this.accepted.set(true);
        this.organizationName.set(response.organizationName);
        this.roleLabel.set(this.getRoleLabel(response.role));
      },
      error: (err) => {
        console.error('Failed to accept invitation:', err);
        this.loading.set(false);
        this.showError(err.error?.message || 'Une erreur est survenue lors de l\'acceptation de l\'invitation');
      }
    });
  }

  getRoleLabel(role: string): string {
    const labels: Record<string, string> = {
      'Owner': 'Propriétaire',
      'Admin': 'Administrateur',
      'Manager': 'Gestionnaire',
      'Accountant': 'Comptable',
      'Viewer': 'Lecture seule'
    };
    return labels[role] || role;
  }

  showError(message: string) {
    this.error.set(true);
    this.errorMessage.set(message);
  }

  navigateToLogin() {
    this.router.navigate(['/login']);
  }

  navigateToHome() {
    this.router.navigate(['/']);
  }
}
