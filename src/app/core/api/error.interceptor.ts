import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../ui/toast.service';

/**
 * 🌍 Error Interceptor Global
 * - Capture les erreurs non traitées (serveur, réseau)
 * - Affiche un message utilisateur
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);

  return next(req).pipe(
    catchError((error) => {
      if (error instanceof HttpErrorResponse) {
        if (error.status === 0) {
          toast.error('COMMON.NETWORK_ERROR');
        } else if (error.status >= 500) {
          toast.error('COMMON.SERVER_ERROR');
        } else if (error.status === 403) {
          toast.error('COMMON.ACCESS_DENIED');
        }
      }
      return throwError(() => error);
    })
  );
};
