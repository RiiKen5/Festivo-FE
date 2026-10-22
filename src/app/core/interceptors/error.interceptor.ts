import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../services/toast.service';

// The API responds with { success: false, error: { message, details? } }.
// Validation failures put the useful text in details[].message.
const serverMessage = (body: any): string | undefined => {
  const err = body?.error;
  if (err?.details?.length && err.details[0]?.message) {
    return err.details.map((d: any) => d.message).join('. ');
  }
  return err?.message || body?.message;
};

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'An unexpected error occurred';
      const fromServer = serverMessage(error.error);

      if (error.error instanceof ErrorEvent) {
        // Client-side error
        errorMessage = error.error.message;
      } else {
        // Server-side error
        switch (error.status) {
          case 0:
            errorMessage = 'Unable to connect to server. Please check your internet connection.';
            break;
          case 400:
            errorMessage = fromServer || 'Bad request. Please check your input.';
            break;
          case 401:
            // Handled by auth interceptor
            return throwError(() => error);
          case 403:
            errorMessage = fromServer || 'You do not have permission to perform this action.';
            break;
          case 404:
            errorMessage = fromServer || 'Resource not found.';
            break;
          case 409:
            errorMessage = fromServer || 'Conflict. This resource already exists.';
            break;
          case 422:
            errorMessage = fromServer || 'Validation error. Please check your input.';
            break;
          case 429:
            errorMessage = 'Too many requests. Please try again later.';
            break;
          case 500:
            errorMessage = 'Server error. Please try again later.';
            break;
          case 503:
            errorMessage = fromServer || 'Service temporarily unavailable. Please try again later.';
            break;
          default:
            errorMessage = fromServer || `Error: ${error.status}`;
        }
      }

      // Show toast for non-401 errors
      if (error.status !== 401) {
        toast.error('Error', errorMessage);
      }

      // Expose the server's message at error.error.message, where components read it
      return throwError(() => ({
        ...error,
        error: { ...(typeof error.error === 'object' ? error.error : {}), message: errorMessage },
        friendlyMessage: errorMessage
      }));
    })
  );
};
