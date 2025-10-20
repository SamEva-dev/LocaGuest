import {
  HttpErrorResponse,
  HttpEvent,
  HttpInterceptorFn
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  catchError,
  finalize,
  from,
  Observable,
  switchMap,
  throwError
} from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../../ui/toast.service';

let isRefreshing = false;
let pending: Array<() => void> = [];

/**
 * 🔁 Refresh Interceptor
 * - Empêche les multiples refresh simultanés
 * - Met en file les requêtes 401 pendant un refresh
 * - Rejoue la requête une fois le token mis à jour
 * - Redirige vers /login si le refresh échoue
 */
export const refreshInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const toast = inject(ToastService);

  return next(req).pipe(
    catchError((err) => {
      // Si token expiré
      if (err instanceof HttpErrorResponse && err.status === 401) {
        if (!isRefreshing) {
          isRefreshing = true;

          return from(auth.refreshIfNeeded()).pipe(
            finalize(() => {
              isRefreshing = false;
              pending.splice(0).forEach((cb) => cb());
            }),
            switchMap((ok) => {
              if (ok) {
                // ✅ Token refresh réussi → on rejoue la requête
                return next(req);
              } else {
                // ❌ Refresh échoué → déconnexion + redirection
                toast.error('AUTH.SESSION_EXPIRED');
                auth.logout();
                router.navigate(['/login'], { queryParams: { expired: 1 } });
                return throwError(() => err);
              }
            })
          );
        } else {
          // ⏳ Si un refresh est déjà en cours → on met la requête en attente
          return new Observable<HttpEvent<any>>((subscriber) => {
            pending.push(() => {
              next(req).subscribe({
                next: (v) => subscriber.next(v),
                error: (e) => subscriber.error(e),
                complete: () => subscriber.complete()
              });
            });
          });
        }
      }

      // Autres erreurs HTTP → on les relance pour le errorInterceptor
      return throwError(() => err);
    })
  );
};
