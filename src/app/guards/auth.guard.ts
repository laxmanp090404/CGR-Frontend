import { inject } from '@angular/core';
import {
  CanActivateFn,
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from '@angular/router';

import { TokenStorageService } from '../services/auth.api.service';
import { Role, ROLE_DASHBOARD_ROUTE } from '../models/auth.model';

// ─────────────────────────────────────────────────────────────────────────────
// authGuard — blocks unauthenticated users → /login
// ─────────────────────────────────────────────────────────────────────────────

export const authGuard: CanActivateFn = (
  _route: ActivatedRouteSnapshot,
  _state: RouterStateSnapshot
) => {
  const tokenStorage = inject(TokenStorageService);
  const router = inject(Router);

  if (tokenStorage.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/login']);
};

// ─────────────────────────────────────────────────────────────────────────────
// roleGuard — ensures user's role matches the route's required roles
// Route data shape: { roles: Role[] }
// On mismatch → navigates to user's own dashboard
// ─────────────────────────────────────────────────────────────────────────────

export const roleGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  _state: RouterStateSnapshot
) => {
  const tokenStorage = inject(TokenStorageService);
  const router = inject(Router);

  const allowedRoles: Role[] = route.data['roles'] ?? [];
  const userRole = tokenStorage.getRole();

  if (userRole && allowedRoles.includes(userRole)) {
    return true;
  }

  // Redirect to the user's own dashboard, or /login if no role
  const fallback = userRole ? ROLE_DASHBOARD_ROUTE[userRole] : '/login';
  return router.createUrlTree([fallback]);
};

// ─────────────────────────────────────────────────────────────────────────────
// guestGuard — prevents logged-in users from visiting /login or /register
// → redirects to role-based dashboard
// ─────────────────────────────────────────────────────────────────────────────

export const guestGuard: CanActivateFn = (
  _route: ActivatedRouteSnapshot,
  _state: RouterStateSnapshot
) => {
  const tokenStorage = inject(TokenStorageService);
  const router = inject(Router);

  if (!tokenStorage.isAuthenticated()) {
    return true;
  }

  const role = tokenStorage.getRole();
  const dashboardRoute = role ? ROLE_DASHBOARD_ROUTE[role] : '/login';
  return router.createUrlTree([dashboardRoute]);
};
