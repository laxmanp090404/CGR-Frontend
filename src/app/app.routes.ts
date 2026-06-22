import { Routes } from '@angular/router';
import { Login } from './components/auth/login/login';
import { Signup } from './components/auth/signup/signup';
import { Admindashboard } from './components/dashboard/admindashboard/admindashboard';
import { Employeedashboard } from './components/dashboard/employeedashboard/employeedashboard';
import { Grodashboard } from './components/dashboard/grodashboard/grodashboard';
import { Deptheaddashboard } from './components/dashboard/deptheaddashboard/deptheaddashboard';
import { MyFiledComplaintsComponent } from './components/dashboard/deptheaddashboard/my-filed-complaints/my-filed-complaints';
import { MyWorkQueueComponent } from './components/dashboard/deptheaddashboard/my-work-queue/my-work-queue';
import { DepartmentComplaintsComponent } from './components/dashboard/deptheaddashboard/department-complaints/department-complaints';
import { RaiseComplaintComponent } from './components/dashboard/deptheaddashboard/raise-complaint/raise-complaint';
import { ComplaintDetailComponent } from './components/dashboard/deptheaddashboard/complaint-detail/complaint-detail';
import { authGuard, roleGuard, guestGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: Login, canActivate: [guestGuard] },
  { path: 'register', component: Signup, canActivate: [guestGuard] },
  { path: 'employee/dashboard', component: Employeedashboard, canActivate: [authGuard, roleGuard], data: { roles: ['EMPLOYEE'] } },
  { path: 'gro/dashboard', component: Grodashboard, canActivate: [authGuard, roleGuard], data: { roles: ['GRO'] } },
  { path: 'admin/dashboard', component: Admindashboard, canActivate: [authGuard, roleGuard], data: { roles: ['ADMIN'] } },
  { path: 'dept-head/dashboard', component: Deptheaddashboard, canActivate: [authGuard, roleGuard], data: { roles: ['DEPARTMENT_HEAD'] } },
  { path: 'dept-head/my-filed-complaints', component: MyFiledComplaintsComponent, canActivate: [authGuard, roleGuard], data: { roles: ['DEPARTMENT_HEAD'] } },
  { path: 'dept-head/my-work-queue', component: MyWorkQueueComponent, canActivate: [authGuard, roleGuard], data: { roles: ['DEPARTMENT_HEAD'] } },
  { path: 'dept-head/department-complaints', component: DepartmentComplaintsComponent, canActivate: [authGuard, roleGuard], data: { roles: ['DEPARTMENT_HEAD'] } },
  { path: 'dept-head/raise-complaint', component: RaiseComplaintComponent, canActivate: [authGuard, roleGuard], data: { roles: ['DEPARTMENT_HEAD'] } },
  { path: 'dept-head/complaints/:id', component: ComplaintDetailComponent, canActivate: [authGuard, roleGuard], data: { roles: ['DEPARTMENT_HEAD'] } },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' },
];

