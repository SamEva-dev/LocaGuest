import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../auth/services/auth.service';

/**
 * Guard pour protéger les routes nécessitant une authentification
 * Redirige vers /login si l'utilisateur n'est pas authentifié
 */
export const AuthGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const isAuthenticated = await authService.checkAuth();

  if (!isAuthenticated) {
    // Rediriger vers login avec l'URL de retour
    router.navigate(['/login'], {
      queryParams: { returnUrl: state.url }
    });
    return false;
  }

  return true;
};
