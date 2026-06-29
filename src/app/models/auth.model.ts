

export type Role = 'ADMIN' | 'EMPLOYEE' | 'GRO' | 'DEPARTMENT_HEAD';

/** Maps each role to its default dashboard route */
export const ROLE_DASHBOARD_ROUTE: Record<Role, string> = {
  EMPLOYEE:  '/employee/dashboard',
  GRO:       '/gro/dashboard',
  ADMIN:     '/admin/dashboard',
  DEPARTMENT_HEAD: '/dept-head/dashboard',
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

export type RegisterResponse = LoginResponse;

export interface AuthSession {
  token:        string;
  employeeName: string;
  role:         Role;
  employeeId:   number;
}
