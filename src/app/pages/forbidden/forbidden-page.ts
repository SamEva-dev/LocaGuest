import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'forbidden-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-6">
      <div class="max-w-md w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm p-8">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
            <i class="ph ph-shield-warning text-2xl text-rose-600 dark:text-rose-400"></i>
          </div>
          <div>
            <h1 class="text-xl font-bold text-slate-800 dark:text-white">Accès refusé</h1>
            <p class="text-sm text-slate-500 dark:text-slate-400">Vous n'avez pas les droits nécessaires pour accéder à cette page.</p>
          </div>
        </div>

        <div class="bg-slate-50 dark:bg-slate-700/30 border border-slate-200 dark:border-slate-600 rounded-xl p-4 mb-6">
          <p class="text-sm text-slate-700 dark:text-slate-300">
            Si vous pensez qu'il s'agit d'une erreur, contactez l'administrateur de votre organisation.
          </p>
        </div>

        <div class="flex gap-3">
          <a
            routerLink="/app/dashboard"
            class="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white text-center font-semibold hover:bg-blue-700 transition">
            Retour au tableau de bord
          </a>
          <a
            routerLink="/app/settings"
            class="flex-1 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-center hover:bg-slate-50 dark:hover:bg-slate-700 transition">
            Paramètres
          </a>
        </div>
      </div>
    </div>
  `
})
export class ForbiddenPage {}
