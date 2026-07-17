import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { GarageService } from '../services/garage.service';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map, take } from 'rxjs';

/**
 * Scoped to the founding `owner` only — an invited admin/receptionist/technician
 * registering into a still-mid-setup garage should land on their dashboard, not
 * be blocked by a wizard meant for the garage's original owner.
 */
export const setupWizardGuard: CanActivateFn = (route) => {
    const authService = inject(AuthService);
    const garageService = inject(GarageService);
    const router = inject(Router);

    // ensureGarageExists() (run right after login/registration) always creates the
    // garage doc if missing before its onSnapshot listener starts, so waiting for
    // the first non-null emission here is safe — it will always arrive.
    return toObservable(garageService.garage).pipe(
        filter(garage => garage !== null),
        take(1),
        map(garage => {
            const isWizardRoute = route.routeConfig?.path === 'setup-wizard';
            const isOwner = authService.currentUser()?.role === 'owner';
            const needsSetup = !garage!.setupCompleted && isOwner;

            if (needsSetup && !isWizardRoute) return router.createUrlTree(['/setup-wizard']);
            if (!needsSetup && isWizardRoute) return router.createUrlTree(['/dashboard']);
            return true;
        })
    );
};
