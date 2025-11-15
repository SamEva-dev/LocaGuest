import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { SubscriptionService } from '../services/subscription.service';
import { map } from 'rxjs/operators';

/**
 * Guard pour protéger les routes basées sur les features
 * Usage: { path: 'api-docs', canActivate: [featureGuard('api_access')] }
 */
export function featureGuard(featureName: string): CanActivateFn {
  return () => {
    const subscriptionService = inject(SubscriptionService);
    const router = inject(Router);

    return subscriptionService.canAccessFeature(featureName).pipe(
      map(hasAccess => {
        if (!hasAccess) {
          // Rediriger vers la page pricing avec message
          router.navigate(['/pricing'], {
            queryParams: { feature: featureName, reason: 'upgrade_required' }
          });
          return false;
        }
        return true;
      })
    );
  };
}
