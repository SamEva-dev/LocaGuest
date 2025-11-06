import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { AuthService } from "../services/auth.service";

export const permissionGuard = (permission: string): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.hasPermission(permission)) {
      return true;
    }

    router.navigate(['/forbidden']);
    return false;
  };
};