import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { InvitationsApi } from '../../core/api/invitations.api';

interface InvitationInfo {
  email: string;
  role: string;
  tenantName: string;
  inviterName: string;
  expiresAt: string;
}

@Component({
  selector: 'accept-invitation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-6">
      <div class="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8">
        @if (isLoading()) {
          <div class="text-center py-12">
            <i class="ph ph-spinner text-4xl animate-spin text-slate-400"></i>
            <p class="mt-4 text-slate-600 dark:text-slate-400">Vérification de l'invitation...</p>
          </div>
        } @else if (error()) {
          <div class="text-center py-8">
            <i class="ph ph-x-circle text-6xl text-rose-500 mb-4"></i>
            <h2 class="text-2xl font-bold text-slate-800 dark:text-white mb-2">Invitation invalide</h2>
            <p class="text-slate-600 dark:text-slate-400">{{ error() }}</p>
            <button 
              (click)="goToLogin()"
              class="mt-6 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition">
              Se connecter
            </button>
          </div>
        } @else if (invitation()) {
          <div class="text-center mb-8">
            <i class="ph ph-envelope-open text-6xl text-emerald-600 mb-4"></i>
            <h2 class="text-2xl font-bold text-slate-800 dark:text-white mb-2">Invitation à rejoindre</h2>
            <p class="text-lg font-semibold text-emerald-600">{{ invitation()!.tenantName }}</p>
            <p class="text-sm text-slate-600 dark:text-slate-400 mt-2">
              Invité par {{ invitation()!.inviterName }} en tant que <span class="font-semibold">{{ invitation()!.role }}</span>
            </p>
          </div>

          <form (ngSubmit)="acceptInvitation()" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Email</label>
              <input 
                type="email" 
                [value]="invitation()!.email"
                disabled
                class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Prénom *</label>
              <input 
                type="text" 
                [(ngModel)]="firstName"
                name="firstName"
                required
                class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-emerald-500">
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Nom *</label>
              <input 
                type="text" 
                [(ngModel)]="lastName"
                name="lastName"
                required
                class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-emerald-500">
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Mot de passe *</label>
              <input 
                type="password" 
                [(ngModel)]="password"
                name="password"
                required
                class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-emerald-500">
              <p class="text-xs text-slate-500 mt-1">Minimum 8 caractères</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Confirmer le mot de passe *</label>
              <input 
                type="password" 
                [(ngModel)]="confirmPassword"
                name="confirmPassword"
                required
                class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-emerald-500">
            </div>

            @if (submitError()) {
              <div class="p-3 rounded-lg bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800">
                <p class="text-sm text-rose-600 dark:text-rose-400">{{ submitError() }}</p>
              </div>
            }

            <button 
              type="submit"
              [disabled]="isSubmitting()"
              class="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-lg hover:shadow-lg transition disabled:opacity-50">
              @if (isSubmitting()) {
                <i class="ph ph-spinner animate-spin mr-2"></i>
              }
              Accepter l'invitation
            </button>
          </form>

          <p class="text-center text-xs text-slate-500 dark:text-slate-400 mt-6">
            Expire le {{ invitation()!.expiresAt | date:'dd/MM/yyyy HH:mm' }}
          </p>
        }
      </div>
    </div>
  `,
  styles: []
})
export class AcceptInvitationComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private invitationsApi = inject(InvitationsApi);

  token = '';
  invitation = signal<InvitationInfo | null>(null);
  isLoading = signal(true);
  error = signal('');

  firstName = '';
  lastName = '';
  password = '';
  confirmPassword = '';
  isSubmitting = signal(false);
  submitError = signal('');

  ngOnInit() {
    this.token = this.route.snapshot.params['token'];
    if (!this.token) {
      this.error.set('Token d\'invitation manquant');
      this.isLoading.set(false);
      return;
    }
    this.loadInvitation();
  }

  loadInvitation() {
    this.invitationsApi.getInvitationByToken(this.token)
      .subscribe({
        next: (info: any) => {
          this.invitation.set(info as InvitationInfo);
          this.isLoading.set(false);
        },
        error: (err: any) => {
          this.error.set(err.error?.error || 'Invitation invalide ou expirée');
          this.isLoading.set(false);
        }
      });
  }

  acceptInvitation() {
    if (this.password !== this.confirmPassword) {
      this.submitError.set('Les mots de passe ne correspondent pas');
      return;
    }

    if (this.password.length < 8) {
      this.submitError.set('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    this.isSubmitting.set(true);
    this.submitError.set('');

    this.invitationsApi.acceptInvitation({
      token: this.token,
      password: this.password,
      firstName: this.firstName,
      lastName: this.lastName
    }).subscribe({
      next: (response) => {
        // Store tokens
        localStorage.setItem('access_token', response.accessToken);
        localStorage.setItem('refresh_token', response.refreshToken);
        
        // Redirect to dashboard
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.submitError.set(err.error?.error || 'Erreur lors de l\'acceptation de l\'invitation');
        this.isSubmitting.set(false);
      }
    });
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}
