// core/auth/auth.guard.ts
import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const AuthGuard: CanActivateFn = async (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const ok = await auth.checkAuth();
  if (ok) return true;

  router.navigate(['/login'], {
    queryParams: { returnUrl: state.url }
  });
  return false;
};
