import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

import { baseUrl } from '../../environment';
import {
  AuthSession,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  Role,
} from '../models/auth.model';

// ─────────────────────────────────────────────────────────────────────────────
// TokenStorageService — persists session to localStorage
// ─────────────────────────────────────────────────────────────────────────────

const SESSION_KEY = 'cgr_session';

@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  private readonly _session = signal<AuthSession | null>(this._load());

  /** Reactive read of the current session */
  readonly session = this._session.asReadonly();

  private _load(): AuthSession | null {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? (JSON.parse(raw) as AuthSession) : null;
    } catch {
      return null;
    }
  }

  save(session: AuthSession): void {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    this._session.set(session);
  }

  clear(): void {
    localStorage.removeItem(SESSION_KEY);
    this._session.set(null);
  }

  getToken(): string | null {
    return this._session()?.token ?? null;
  }

  getRole(): Role | null {
    return this._session()?.role ?? null;
  }
  getUserName(): string | null {
    return this._session()?.employeeName ?? null;
  }
  getEmployeeId(): number | null {
    return this._session()?.employeeId ?? null;
  }
  isAuthenticated(): boolean {
    return !!this._session()?.token;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// AuthApiService — login & register HTTP calls
// ─────────────────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient);
  private readonly tokenStorage = inject(TokenStorageService);

  private readonly apiBase = `${baseUrl}/api/auth`;

  /** POST /api/auth/login */
  login(req: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiBase}/login`, req).pipe(
      tap((res) => this.tokenStorage.save(res))
    );
  }

  /** POST /api/auth/register */
  register(req: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.apiBase}/register`, req).pipe(
      tap((res) => this.tokenStorage.save(res))
    );
  }

  isAuthenticated(): boolean {
    return this.tokenStorage.isAuthenticated();
  }

  getRole(): Role | null {
    return this.tokenStorage.getRole();
  }

  logout(): void {
    this.tokenStorage.clear();
  }
}
