import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, catchError, filter, switchMap, take, throwError } from 'rxjs';

import { TokenStorageService, AuthApiService } from '../services/auth.api.service';

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

/**
 * Functional HTTP interceptor that:
 *  1. Attaches Authorization: Bearer <token> to all outgoing requests.
 *  2. On 401 → attempts to refresh the token.
 *  3. Queues subsequent requests during refresh and replays them on success.
 *  4. Clears session and redirects to /login on failure.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenStorage = inject(TokenStorageService);
  const authApiService = inject(AuthApiService);
  const router = inject(Router);

  // Bypass refresh endpoint to prevent recursive calls
  if (req.url.includes('/api/auth/refresh')) {
    return next(req);
  }

  const token = tokenStorage.getToken();
  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse && err.status === 401) {
        const refreshToken = tokenStorage.getRefreshToken();
        const accessToken = tokenStorage.getToken();

        if (accessToken && refreshToken) {
          if (!isRefreshing) {
            isRefreshing = true;
            refreshTokenSubject.next(null);

            return authApiService.refreshToken({ accessToken, refreshToken }).pipe(
              switchMap((res) => {
                isRefreshing = false;
                refreshTokenSubject.next(res.token);
                return next(req.clone({ setHeaders: { Authorization: `Bearer ${res.token}` } }));
              }),
              catchError((refreshErr) => {
                isRefreshing = false;
                tokenStorage.clear();
                router.navigate(['/login']);
                return throwError(() => refreshErr);
              })
            );
          } else {
            return refreshTokenSubject.pipe(
              filter((t) => t !== null),
              take(1),
              switchMap((newToken) => {
                return next(req.clone({ setHeaders: { Authorization: `Bearer ${newToken!}` } }));
              })
            );
          }
        } else {
          tokenStorage.clear();
          router.navigate(['/login']);
        }
      }
      return throwError(() => err);
    })
  );
};
