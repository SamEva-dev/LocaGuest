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
        const body: any = error.error;
        const extractedMessage: string | null =
          (typeof body?.message === 'string' && body.message.trim().length > 0) ? body.message :
          (typeof body?.detail === 'string' && body.detail.trim().length > 0) ? body.detail :
          (typeof body?.title === 'string' && body.title.trim().length > 0) ? body.title :
          null;

        if (error.status === 0) {
          toast.error('COMMON.NETWORK_ERROR');
        } else if (error.status >= 500) {
          toast.error('COMMON.SERVER_ERROR');
        } else if (error.status === 403) {
          toast.error('COMMON.ACCESS_DENIED');
        } else if (error.status === 400 && extractedMessage) {
          // Pour les validations métier / fluentvalidation (ProblemDetails ou {message})
          toast.errorDirect(extractedMessage);
        }
      }
      return throwError(() => error);
    })
  );
};
