// core/auth/auth.interceptor.ts
import { HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { TokenService } from '../services/token/token.service';
import { from, throwError } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

export const ApiInterceptor: HttpInterceptorFn = (req, next) => {
  const tokens = inject(TokenService);
  const auth = inject(AuthService);
  const access = tokens.accessToken;
  const isApiCall = req.url.startsWith('http'); 
  if (!access || !isApiCall) return next(req);
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
