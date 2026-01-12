// core/auth/auth.interceptor.ts
import { HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { TokenService } from '../services/token/token.service';
import { from, throwError } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { environment } from '../../../../environnements/environment.dev';

export const ApiInterceptor: HttpInterceptorFn = (req, next) => {
  const tokens = inject(TokenService);
  const auth = inject(AuthService);
  const access = tokens.accessToken;

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

  const isAuthEndpoint = req.url.includes('/api/Auth/login') ||
                         req.url.includes('/api/Auth/register') ||
                         req.url.includes('/api/Auth/refresh');

  if (!access || isAuthEndpoint || !isAllowedTarget(req.url)) return next(req);

  const cloned = req.clone({ setHeaders: { Authorization: `Bearer ${access}` } });

  return next(cloned).pipe(
    catchError((err: any) => {
      // Si 401: on tente un refresh (si dispo)
      if (err?.status === 401) {
        return from(auth.refreshIfNeeded()).pipe(
          switchMap((refreshed) => {
            if (refreshed) {
              const retryReq = req.clone({
                setHeaders: { Authorization: `Bearer ${tokens.accessToken}`  },
              });
              return next(retryReq);
            }
            return throwError(() => err);
          })
        );
      }
      return throwError(() => err);
    })
  );
};
