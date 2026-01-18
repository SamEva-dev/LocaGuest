import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError, from } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from '../auth/services/auth.service';
import { environment } from '../../../environnements/environment.dev';

/**
 * Intercepteur HTTP pour ajouter le token JWT aux requêtes
 * et gérer le refresh automatique en cas d'expiration
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getAccessToken();

  const allowedOrigins = [environment.BASE_AUTH_API, environment.BASE_LOCAGUEST_API]
    .filter(Boolean)
    .map((baseUrl) => {
      try {
        return new URL(baseUrl).origin;
      } catch {
        return null;
      }
    })
    .filter((x): x is string => !!x);

  const isAllowedTarget = (url: string): boolean => {
    // URL relative -> same-origin -> autorisée
    if (!/^https?:\/\//i.test(url)) return true;

    try {
      const targetOrigin = new URL(url).origin;
      return allowedOrigins.includes(targetOrigin);
    } catch {
      return false;
    }
  };

  // Ne pas ajouter le token pour les endpoints d'authentification
  const isAuthEndpoint = req.url.includes('/api/Auth/login') || 
                         req.url.includes('/api/Auth/register') ||
                         req.url.includes('/api/Auth/refresh');

  // Clone request and add Authorization header if token exists
  let authReq = req;
  if (token && !isAuthEndpoint && isAllowedTarget(req.url)) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  // Public endpoints that should not trigger login redirect on 401
  const isPublicEndpoint = req.url.includes('/api/PublicStats') ||
                           req.url.includes('/api/Subscriptions/plans');

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Don't redirect for public endpoints - just let error propagate
      if (isPublicEndpoint) {
        return throwError(() => error);
      }

      // Si 401 Unauthorized et pas déjà sur refresh, essayer de rafraîchir le token
      if (error.status === 401 && !req.url.includes('/api/Auth/refresh')) {
        // Only try refresh if user was authenticated
        if (!token) {
          return throwError(() => error);
        }

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
