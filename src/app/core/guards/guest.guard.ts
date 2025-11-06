import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard pour les routes accessibles uniquement aux utilisateurs non authentifiés
 * (login, register, etc.)
 * Redirige vers /app si l'utilisateur est déjà authentifié
 */
export const GuestGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const isAuthenticated = await authService.checkAuth();

  if (isAuthenticated) {
    // Utilisateur déjà connecté, rediriger vers l'application
    router.navigate(['/app']);
    return false;
  }

  return true;
};
