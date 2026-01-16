// core/auth/guest.guard.ts
import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const GuestGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const ok = await auth.checkAuth();
  if (ok) {
    router.navigate(['/app']);
    return false;
  }
  return true;
};
