import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TwoFactorApi, EnableTwoFactorResponse } from '../../../../core/api/two-factor.api';

@Component({
  selector: 'two-factor-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Status Card -->
      <div class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
              <i class="ph ph-shield-check text-2xl"></i>
              Authentification à deux facteurs (2FA)
            </h3>
            <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Renforcez la sécurité de votre compte avec une vérification en 2 étapes
            </p>
          </div>
          
          @if (status()) {
            @if (status()!.isEnabled) {
              <span class="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-sm font-medium">
                <i class="ph ph-check-circle mr-1"></i>
                Activé
              </span>
            } @else {
              <span class="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 text-sm font-medium">
                <i class="ph ph-x-circle mr-1"></i>
                Désactivé
              </span>
            }
          }
        </div>

        @if (status() && status()!.isEnabled) {
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div class="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
              <p class="text-xs text-slate-500 dark:text-slate-400 mb-1">Activé le</p>
              <p class="text-sm font-semibold text-slate-800 dark:text-white">
                {{ status()!.enabledAt ? (status()!.enabledAt | date:'dd/MM/yyyy HH:mm') : 'N/A' }}
              </p>
            </div>
            <div class="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
              <p class="text-xs text-slate-500 dark:text-slate-400 mb-1">Dernière utilisation</p>
              <p class="text-sm font-semibold text-slate-800 dark:text-white">
                {{ status()!.lastUsedAt ? (status()!.lastUsedAt | date:'dd/MM/yyyy HH:mm') : 'Jamais' }}
              </p>
            </div>
            <div class="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
              <p class="text-xs text-slate-500 dark:text-slate-400 mb-1">Codes de récupération</p>
              <p class="text-sm font-semibold text-slate-800 dark:text-white">
                {{ status()!.recoveryCodesRemaining }} restants
              </p>
            </div>
          </div>
        }

        <div class="flex gap-3">
          @if (!status()?.isEnabled) {
            <button
              (click)="showEnableDialog.set(true)"
              class="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium">
              <i class="ph ph-shield-plus mr-2"></i>
              Activer 2FA
            </button>
          } @else {
            <button
              (click)="showDisableDialog.set(true)"
              class="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition font-medium">
              <i class="ph ph-shield-slash mr-2"></i>
              Désactiver 2FA
            </button>
          }
        </div>
      </div>

      <!-- Info Card -->
      <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
        <h4 class="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
          <i class="ph ph-info"></i>
          Comment fonctionne 2FA ?
        </h4>
        <ul class="text-sm text-blue-700 dark:text-blue-400 space-y-1">
          <li>• Téléchargez une application d'authentification (Google Authenticator, Authy, etc.)</li>
          <li>• Scannez le QR code fourni lors de l'activation</li>
          <li>• À chaque connexion, entrez le code à 6 chiffres généré par l'application</li>
          <li>• Conservez vos codes de récupération en lieu sûr</li>
        </ul>
      </div>
    </div>

    <!-- Enable 2FA Dialog -->
    @if (showEnableDialog()) {
      <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" (click)="showEnableDialog.set(false)">
        <div class="bg-white dark:bg-slate-800 rounded-xl w-full max-w-2xl" (click)="$event.stopPropagation()">
          @if (!enableResponse()) {
            <!-- Step 1: Loading -->
            @if (loading()) {
              <div class="p-8 text-center">
                <i class="ph ph-spinner text-4xl animate-spin text-emerald-600 mb-4"></i>
                <p class="text-slate-600 dark:text-slate-400">Génération du QR code...</p>
              </div>
            } @else {
              <!-- Step 1: Setup (if not yet enabled) -->
              <div class="p-6">
                <h3 class="text-xl font-bold text-slate-800 dark:text-white mb-4">
                  Activer l'authentification à deux facteurs
                </h3>
                <button (click)="initEnable()" class="w-full px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium">
                  Commencer la configuration
                </button>
              </div>
            }
          } @else if (!verified()) {
            <!-- Step 2: QR Code & Verification -->
            <div class="p-6">
              <h3 class="text-xl font-bold text-slate-800 dark:text-white mb-4">
                Scanner le QR code
              </h3>

              <div class="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-700 mb-6">
                <img [src]="'data:image/png;base64,' + enableResponse()!.qrCodeImage" 
                     alt="QR Code"
                     class="w-64 h-64 mx-auto" />
              </div>

              <div class="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg mb-6">
                <p class="text-sm text-slate-600 dark:text-slate-400 mb-2">Ou entrez ce code manuellement :</p>
                <p class="text-lg font-mono font-bold text-slate-800 dark:text-white text-center break-all">
                  {{ enableResponse()!.secret }}
                </p>
              </div>

              <div class="mb-6">
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Entrez le code à 6 chiffres
                </label>
                <input
                  type="text"
                  [(ngModel)]="verificationCode"
                  placeholder="123456"
                  maxlength="6"
                  class="w-full px-4 py-3 text-center text-2xl font-mono rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white">
              </div>

              <div class="flex gap-3">
                <button
                  (click)="cancelEnable()"
                  class="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition">
                  Annuler
                </button>
                <button
                  (click)="verifyAndEnable()"
                  [disabled]="verificationCode.length !== 6"
                  class="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition">
                  Vérifier et activer
                </button>
              </div>
            </div>
          } @else {
            <!-- Step 3: Recovery Codes -->
            <div class="p-6">
              <div class="text-center mb-6">
                <div class="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i class="ph ph-check-circle text-4xl text-emerald-600 dark:text-emerald-400"></i>
                </div>
                <h3 class="text-xl font-bold text-slate-800 dark:text-white mb-2">
                  2FA activé avec succès !
                </h3>
                <p class="text-sm text-slate-600 dark:text-slate-400">
                  Conservez ces codes de récupération en lieu sûr
                </p>
              </div>

              <div class="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg mb-6">
                <div class="grid grid-cols-2 gap-2">
                  @for (code of enableResponse()!.recoveryCodes; track code) {
                    <p class="text-sm font-mono font-semibold text-slate-800 dark:text-white bg-white dark:bg-slate-800 px-3 py-2 rounded">
                      {{ code }}
                    </p>
                  }
                </div>
              </div>

              <div class="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 mb-6">
                <p class="text-sm text-orange-800 dark:text-orange-300">
                  <i class="ph ph-warning mr-2"></i>
                  <strong>Important :</strong> Ces codes ne seront affichés qu'une seule fois. Téléchargez-les ou imprimez-les.
                </p>
              </div>

              <button
                (click)="finishEnable()"
                class="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium">
                J'ai sauvegardé mes codes
              </button>
            </div>
          }
        </div>
      </div>
    }

    <!-- Disable 2FA Dialog -->
    @if (showDisableDialog()) {
      <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" (click)="showDisableDialog.set(false)">
        <div class="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md" (click)="$event.stopPropagation()">
          <h3 class="text-xl font-bold text-slate-800 dark:text-white mb-4">
            Désactiver 2FA
          </h3>

          <p class="text-sm text-slate-600 dark:text-slate-400 mb-6">
            Êtes-vous sûr de vouloir désactiver l'authentification à deux facteurs ? Cela réduira la sécurité de votre compte.
          </p>

          <div class="mb-6">
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Confirmez avec votre mot de passe
            </label>
            <input
              type="password"
              [(ngModel)]="password"
              placeholder="Mot de passe"
              class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white">
          </div>

          <div class="flex gap-3">
            <button
              (click)="showDisableDialog.set(false)"
              class="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition">
              Annuler
            </button>
            <button
              (click)="disable()"
              class="flex-1 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition">
              Désactiver
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: []
})
export class TwoFactorSettingsComponent implements OnInit {
  private twoFactorApi = inject(TwoFactorApi);

  status = signal<{ isEnabled: boolean; enabledAt?: string; lastUsedAt?: string; recoveryCodesRemaining: number } | null>(null);
  loading = signal(false);
  showEnableDialog = signal(false);
  showDisableDialog = signal(false);
  enableResponse = signal<EnableTwoFactorResponse | null>(null);
  verified = signal(false);
  verificationCode = '';
  password = '';

  ngOnInit() {
    this.loadStatus();
  }

  loadStatus() {
    this.twoFactorApi.getStatus().subscribe({
      next: (status) => this.status.set(status),
      error: (err) => console.error('Failed to load 2FA status:', err)
    });
  }

  initEnable() {
    this.loading.set(true);
    this.twoFactorApi.enable().subscribe({
      next: (response) => {
        this.enableResponse.set(response);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to enable 2FA:', err);
        this.loading.set(false);
        alert('Erreur lors de l\'initialisation de 2FA');
      }
    });
  }

  verifyAndEnable() {
    this.twoFactorApi.verifyAndEnable({ code: this.verificationCode }).subscribe({
      next: (response) => {
        if (response.success) {
          this.verified.set(true);
        } else {
          alert('Code invalide. Veuillez réessayer.');
        }
      },
      error: (err) => {
        console.error('Failed to verify code:', err);
        alert('Code invalide. Veuillez réessayer.');
      }
    });
  }

  cancelEnable() {
    this.showEnableDialog.set(false);
    this.enableResponse.set(null);
    this.verified.set(false);
    this.verificationCode = '';
  }

  finishEnable() {
    this.showEnableDialog.set(false);
    this.enableResponse.set(null);
    this.verified.set(false);
    this.verificationCode = '';
    this.loadStatus();
  }

  disable() {
    this.twoFactorApi.disable({ password: this.password }).subscribe({
      next: (response) => {
        if (response.success) {
          alert('2FA désactivé avec succès');
          this.showDisableDialog.set(false);
          this.password = '';
          this.loadStatus();
        }
      },
      error: (err) => {
        console.error('Failed to disable 2FA:', err);
        alert('Erreur lors de la désactivation de 2FA');
      }
    });
  }
}
