import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map, take } from 'rxjs/operators';

/**
 * Helper function that waits for auth initialization to complete before checking auth state
 */
const waitForAuthInit = (auth: AuthService) => {
  return toObservable(auth.isLoading).pipe(
    filter(isLoading => !isLoading), // Wait until loading is false
    take(1)
  );
};

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Wait for auth initialization to complete
  return waitForAuthInit(auth).pipe(
    map(() => {
      if (auth.isAuthenticated()) {
        return true;
      }

      // Store the attempted URL for redirecting after login
      router.navigate(['/auth/login'], {
        queryParams: { returnUrl: state.url }
      });
      return false;
    })
  );
};

export const guestGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Wait for auth initialization to complete
  return waitForAuthInit(auth).pipe(
    map(() => {
      if (!auth.isAuthenticated()) {
        return true;
      }

      // Already logged in, redirect to dashboard
      router.navigate(['/dashboard']);
      return false;
    })
  );
};

export const roleGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const requiredRole = route.data['role'] as string;

  // Wait for auth initialization to complete
  return waitForAuthInit(auth).pipe(
    map(() => {
      if (auth.isAuthenticated() && auth.hasRole(requiredRole)) {
        return true;
      }

      // Not authorized
      router.navigate(['/']);
      return false;
    })
  );
};

export const userTypeGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const requiredType = route.data['userType'] as string;

  // Wait for auth initialization to complete
  return waitForAuthInit(auth).pipe(
    map(() => {
      if (auth.isAuthenticated() && auth.isUserType(requiredType)) {
        return true;
      }

      // Not authorized for this user type
      router.navigate(['/dashboard']);
      return false;
    })
  );
};
