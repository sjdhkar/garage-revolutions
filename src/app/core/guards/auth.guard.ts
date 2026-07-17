import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map, take } from 'rxjs';

export const authGuard: CanActivateFn = () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    // Wait until auth state is resolved (not undefined/loading)
    return toObservable(authService.currentUser).pipe(
        filter(user => user !== undefined),
        take(1),
        map(user => {
            if (user) return true;
            return router.createUrlTree(['/auth/login']);
        })
    );
};
