import { HttpErrorResponse } from '@angular/common/http';
import { MonoTypeOperatorFunction, pipe, catchError, throwError } from 'rxjs';

/**
 * Extracts a human-readable error message from an Angular HTTP error.
 * Tries the backend `message` field first, then falls back to a generic string.
 */
export function extractApiError(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    const body = err.error;
    if (typeof body === 'string' && body.trim()) return body.trim();
    if (body && typeof body === 'object') {
      const msg = body['message'] || body['Message'] || body['error'] || body['Error'];
      if (msg && typeof msg === 'string') return msg;
    }
    if (err.status === 0) return 'Unable to reach server. Please check your connection.';
    if (err.status === 401) return 'Invalid email or password.';
    if (err.status === 409) return 'An account with this email already exists.';
    if (err.status === 400) return 'Invalid request. Please check your details.';
    return `Unexpected error (${err.status}). Please try again.`;
  }
  return 'An unexpected error occurred. Please try again.';
}

/**
 * RxJS operator that re-throws HTTP errors as string messages.
 * Usage: `this.authService.login(req).pipe(catchAuthError())`
 */
export function catchAuthError<T>(): MonoTypeOperatorFunction<T> {
  return pipe(
    catchError((err: unknown) => throwError(() => extractApiError(err)))
  );
}
