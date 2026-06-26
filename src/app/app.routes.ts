import { Routes } from '@angular/router';
import { Login } from './components/auth/login/login';
import { Signup } from './components/auth/signup/signup';
import { AdminDashboardComponent } from './components/dashboards/admin-dashboard/admin-dashboard';
import { EmployeeDashboardComponent } from './components/dashboards/employee-dashboard/employee-dashboard';
import { GroDashboardComponent } from './components/dashboards/gro-dashboard/gro-dashboard';
import { DeptHeadDashboardComponent } from './components/dashboards/dept-head-dashboard/dept-head-dashboard';
import { MyFiledComplaintsComponent } from './components/complaints/my-filed-complaints/my-filed-complaints';
import { MyWorkQueueComponent } from './components/complaints/my-work-queue/my-work-queue';
import { DepartmentComplaintsComponent } from './components/complaints/department-complaints/department-complaints';
import { RaiseComplaintComponent } from './components/complaints/raise-complaint/raise-complaint';
import { ComplaintDetailComponent } from './components/complaints/complaint-detail/complaint-detail';
import { ComplaintRequestsComponent } from './components/complaints/complaint-requests/complaint-requests';
import { DepartmentWiseAnalyticsComponent } from './components/dashboards/department-wise-analytics/department-wise-analytics';
import { EmployeesComponent } from './components/employees/employees';
import { DepartmentsPlaceholderComponent } from './components/departments-placeholder/departments-placeholder';
import { CategoriesPlaceholderComponent } from './components/categories-placeholder/categories-placeholder';
import { RoleRequestsPlaceholderComponent } from './components/role-requests-placeholder/role-requests-placeholder';
import { authGuard, roleGuard, guestGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'login',    component: Login,    canActivate: [guestGuard] },
  { path: 'register', component: Signup,   canActivate: [guestGuard] },

  // Employee
  { path: 'employee/dashboard',       component: EmployeeDashboardComponent,   canActivate: [authGuard, roleGuard], data: { roles: ['EMPLOYEE'] } },
  { path: 'employee/raise-complaint', component: RaiseComplaintComponent,       canActivate: [authGuard, roleGuard], data: { roles: ['EMPLOYEE'] } },
  { path: 'employee/my-complaints',   component: MyFiledComplaintsComponent,    canActivate: [authGuard, roleGuard], data: { roles: ['EMPLOYEE'] } },
  { path: 'employee/complaints/:id',  component: ComplaintDetailComponent,      canActivate: [authGuard, roleGuard], data: { roles: ['EMPLOYEE'] } },
  { path: 'employee/notifications',   loadComponent: () => import('./components/notifications/notifications').then(m => m.NotificationsComponent), canActivate: [authGuard, roleGuard], data: { roles: ['EMPLOYEE'] } },

  // GRO
  { path: 'gro/dashboard',           component: GroDashboardComponent,       canActivate: [authGuard, roleGuard], data: { roles: ['GRO'] } },
  { path: 'gro/raise-complaint',     component: RaiseComplaintComponent,      canActivate: [authGuard, roleGuard], data: { roles: ['GRO'] } },
  { path: 'gro/my-filed-complaints', component: MyFiledComplaintsComponent,  canActivate: [authGuard, roleGuard], data: { roles: ['GRO'] } },
  { path: 'gro/my-work-queue',       component: MyWorkQueueComponent,        canActivate: [authGuard, roleGuard], data: { roles: ['GRO'] } },
  { path: 'gro/complaints/:id',      component: ComplaintDetailComponent,    canActivate: [authGuard, roleGuard], data: { roles: ['GRO'] } },
  { path: 'gro/complaint-requests',  component: ComplaintRequestsComponent,  canActivate: [authGuard, roleGuard], data: { roles: ['GRO'] } },
  { path: 'gro/notifications',       loadComponent: () => import('./components/notifications/notifications').then(m => m.NotificationsComponent), canActivate: [authGuard, roleGuard], data: { roles: ['GRO'] } },

  // Admin
  { path: 'admin/dashboard',       component: AdminDashboardComponent,     canActivate: [authGuard, roleGuard], data: { roles: ['ADMIN'] } },
  { path: 'admin/view-complaints', component: MyFiledComplaintsComponent,   canActivate: [authGuard, roleGuard], data: { roles: ['ADMIN'] } },
  { path: 'admin/my-work-queue',   component: MyWorkQueueComponent,         canActivate: [authGuard, roleGuard], data: { roles: ['ADMIN'] } },
  { path: 'admin/complaints/:id',  component: ComplaintDetailComponent,     canActivate: [authGuard, roleGuard], data: { roles: ['ADMIN'] } },
  { path: 'admin/department-wise-analytics', component: DepartmentWiseAnalyticsComponent, canActivate: [authGuard, roleGuard], data: { roles: ['ADMIN'] } },
  { path: 'admin/requests',        component: ComplaintRequestsComponent,  canActivate: [authGuard, roleGuard], data: { roles: ['ADMIN'] } },
  { path: 'admin/notifications',   loadComponent: () => import('./components/notifications/notifications').then(m => m.NotificationsComponent), canActivate: [authGuard, roleGuard], data: { roles: ['ADMIN'] } },
  { path: 'admin/employees',       component: EmployeesComponent,          canActivate: [authGuard, roleGuard], data: { roles: ['ADMIN'] } },
  { path: 'admin/departments',     component: DepartmentsPlaceholderComponent, canActivate: [authGuard, roleGuard], data: { roles: ['ADMIN'] } },
  { path: 'admin/categories',      component: CategoriesPlaceholderComponent, canActivate: [authGuard, roleGuard], data: { roles: ['ADMIN'] } },
  { path: 'admin/role-requests',   component: RoleRequestsPlaceholderComponent, canActivate: [authGuard, roleGuard], data: { roles: ['ADMIN'] } },

  // Department Head
  { path: 'dept-head/dashboard',             component: DeptHeadDashboardComponent,    canActivate: [authGuard, roleGuard], data: { roles: ['DEPARTMENT_HEAD'] } },
  { path: 'dept-head/my-filed-complaints',   component: MyFiledComplaintsComponent,    canActivate: [authGuard, roleGuard], data: { roles: ['DEPARTMENT_HEAD'] } },
  { path: 'dept-head/my-work-queue',         component: MyWorkQueueComponent,          canActivate: [authGuard, roleGuard], data: { roles: ['DEPARTMENT_HEAD'] } },
  { path: 'dept-head/department-complaints', component: DepartmentComplaintsComponent, canActivate: [authGuard, roleGuard], data: { roles: ['DEPARTMENT_HEAD'] } },
  { path: 'dept-head/raise-complaint',       component: RaiseComplaintComponent,       canActivate: [authGuard, roleGuard], data: { roles: ['DEPARTMENT_HEAD'] } },
  { path: 'dept-head/complaints/:id',        component: ComplaintDetailComponent,      canActivate: [authGuard, roleGuard], data: { roles: ['DEPARTMENT_HEAD'] } },
  { path: 'dept-head/complaint-requests',    component: ComplaintRequestsComponent,    canActivate: [authGuard, roleGuard], data: { roles: ['DEPARTMENT_HEAD'] } },
  { path: 'dept-head/notifications',         loadComponent: () => import('./components/notifications/notifications').then(m => m.NotificationsComponent), canActivate: [authGuard, roleGuard], data: { roles: ['DEPARTMENT_HEAD'] } },

  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' },
];
