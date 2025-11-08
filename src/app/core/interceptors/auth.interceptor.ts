import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError, from } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from '../auth/services/auth.service';

/**
 * Intercepteur HTTP pour ajouter le token JWT aux requêtes
 * et gérer le refresh automatique en cas d'expiration
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getAccessToken();

  // Ne pas ajouter le token pour les endpoints d'authentification
  const isAuthEndpoint = req.url.includes('/api/auth/login') || 
                         req.url.includes('/api/auth/register') ||
                         req.url.includes('/api/auth/refresh');

  // Clone request and add Authorization header if token exists
  let authReq = req;
  if (token && !isAuthEndpoint) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Si 401 Unauthorized et pas déjà sur refresh, essayer de rafraîchir le token
      if (error.status === 401 && !req.url.includes('/api/auth/refresh')) {
        return from(authService.refreshIfNeeded()).pipe(
          switchMap(() => {
            // Retry original request with new token
            const newToken = authService.getAccessToken();
            if (newToken) {
              const retryReq = req.clone({
                setHeaders: {
                  Authorization: `Bearer ${newToken}`,
                },
              });
              return next(retryReq);
            }
            // Pas de nouveau token, rediriger vers login
            router.navigate(['/login'], { queryParams: { expired: 'true' } });
            return throwError(() => error);
          }),
          catchError((refreshError) => {
            // Refresh failed, redirect to login
            router.navigate(['/login'], { queryParams: { expired: 'true' } });
            return throwError(() => refreshError);
          })
        );
      }

      return throwError(() => error);
    })
  );
};
