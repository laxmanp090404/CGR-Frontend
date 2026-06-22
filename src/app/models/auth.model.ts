// ─────────────────────────────────────────────────────────────
// Auth Models — all authentication-related interfaces & types
// ─────────────────────────────────────────────────────────────

export type Role = 'ADMIN' | 'EMPLOYEE' | 'GRO' | 'DEPT_HEAD';

/** Maps each role to its default dashboard route */
export const ROLE_DASHBOARD_ROUTE: Record<Role, string> = {
  EMPLOYEE:  '/employee/dashboard',
  GRO:       '/gro/dashboard',
  ADMIN:     '/admin/dashboard',
  DEPT_HEAD: '/dept-head/dashboard',
};

// ── Login ──────────────────────────────────────────────────────
export interface LoginRequest {
  email:    string;
  password: string;
}

export interface LoginResponse {
  token:        string;
  employeeName: string;
  role:         Role;
  employeeId:   number;
}

// ── Register ───────────────────────────────────────────────────
export interface RegisterRequest {
  employeeName:   string;
  email:          string;
  mobileNumber:   string;
  password:       string;
  requestGroRole: boolean;
  departmentId?:  number;
}

/** Register response mirrors login response (token + user info) */
export type RegisterResponse = LoginResponse;

// ── Session (stored token payload) ────────────────────────────
export interface AuthSession {
  token:        string;
  employeeName: string;
  role:         Role;
  employeeId:   number;
}
