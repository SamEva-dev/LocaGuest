// core/auth/auth.interceptor.ts
import { HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { TokenService } from '../services/token/token.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokens = inject(TokenService);
  const access = tokens.accessToken;
  if (!access) return next(req);
  const authReq = req.clone({ setHeaders: { Authorization: `Bearer ${access}` } });
  return next(authReq);
};
