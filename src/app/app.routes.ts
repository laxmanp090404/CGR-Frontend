import { Routes } from '@angular/router';
import { Login } from './components/auth/login/login';
import { Signup } from './components/auth/signup/signup';
import { Admindashboard } from './components/dashboard/admindashboard/admindashboard';
import { Employeedashboard } from './components/dashboard/employeedashboard/employeedashboard';
import { Grodashboard } from './components/dashboard/grodashboard/grodashboard';
import { Deptheaddashboard } from './components/dashboard/deptheaddashboard/deptheaddashboard';
import { authGuard, roleGuard, guestGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: Login, canActivate: [guestGuard] },
  { path: 'register', component: Signup, canActivate: [guestGuard] },
  { path: 'employee/dashboard', component: Employeedashboard, canActivate: [authGuard, roleGuard], data: { roles: ['EMPLOYEE'] } },
  { path: 'gro/dashboard', component: Grodashboard, canActivate: [authGuard, roleGuard], data: { roles: ['GRO'] } },
  { path: 'admin/dashboard', component: Admindashboard, canActivate: [authGuard, roleGuard], data: { roles: ['ADMIN'] } },
  { path: 'dept-head/dashboard', component: Deptheaddashboard, canActivate: [authGuard, roleGuard], data: { roles: ['DEPT_HEAD'] } },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' },
];
