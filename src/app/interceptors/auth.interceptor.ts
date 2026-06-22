import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { TokenStorageService } from '../services/auth.api.service';

/**
 * Functional HTTP interceptor that:
 *  1. Attaches Authorization: Bearer <token> to all outgoing requests.
 *  2. On 401 → clears session and redirects to /login.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenStorage = inject(TokenStorageService);
  const router = inject(Router);

  const token = tokenStorage.getToken();

  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse && err.status === 401) {
        tokenStorage.clear();
        router.navigate(['/login']);
      }
      return throwError(() => err);
    })
  );
};
