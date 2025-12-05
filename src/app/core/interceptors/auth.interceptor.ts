import { HttpInterceptorFn, HttpErrorResponse, HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { StorageService } from '../services/storage.service';
import { environment } from '../../../environments/environment';
import { TokenResponse } from '../models/user.model';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const storage = inject(StorageService);
  const router = inject(Router);
  const http = inject(HttpClient);

  const token = storage.getAccessToken();

  // Skip auth for public endpoints (no token needed)
  const publicEndpoints = [
    '/auth/login',
    '/auth/register',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/auth/refresh-token'
  ];
  const isPublicEndpoint = publicEndpoints.some(endpoint => req.url.includes(endpoint));

  if (token && !isPublicEndpoint) {
    console.log('Interceptor: Adding token to request:', req.url);
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  } else if (!token && !isPublicEndpoint) {
    console.log('Interceptor: No token available for:', req.url);
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      console.log('Interceptor: Error for', req.url, 'Status:', error.status);

      if (error.status === 401 && !req.url.includes('/auth/refresh-token')) {
        const refreshToken = storage.getRefreshToken();

        if (!refreshToken) {
          // No refresh token, clear and redirect
          storage.clearAll();
          router.navigate(['/auth/login']);
          return throwError(() => error);
        }

        // Try to refresh token directly (avoid circular dependency with AuthService)
        return http.post<TokenResponse>(`${environment.apiUrl}/auth/refresh-token`, { refreshToken }).pipe(
          switchMap(response => {
            if (response.success && response.data.accessToken) {
              storage.setAccessToken(response.data.accessToken);
              const newReq = req.clone({
                setHeaders: {
                  Authorization: `Bearer ${response.data.accessToken}`
                }
              });
              return next(newReq);
            }
            // Refresh didn't return a valid token
            storage.clearAll();
            router.navigate(['/auth/login']);
            return throwError(() => error);
          }),
          catchError((refreshError: HttpErrorResponse) => {
            // Refresh failed, clear and redirect
            storage.clearAll();
            router.navigate(['/auth/login']);
            return throwError(() => refreshError);
          })
        );
      }
      return throwError(() => error);
    })
  );
};
