import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environnements/environment.dev';

const writeMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function createIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export const idempotencyInterceptor: HttpInterceptorFn = (req, next) => {
  const isWrite = writeMethods.has(req.method.toUpperCase());
  const isLocaGuestApi = req.url.startsWith(environment.BASE_LOCAGUEST_API);

  if (!isWrite || !isLocaGuestApi || req.headers.has('Idempotency-Key')) {
    return next(req);
  }

  return next(
    req.clone({
      setHeaders: {
        'Idempotency-Key': createIdempotencyKey(),
      },
    })
  );
};
