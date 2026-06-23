import { NavItem } from './dashboard-shell';
import { Role } from '../../../models/auth.model';

export function getNavItems(role: Role): NavItem[] {
  switch (role) {
    case 'EMPLOYEE':
      return [
        { label: 'Dashboard', route: '/employee/dashboard', icon: 'dashboard' },
        { label: 'Raise Complaint', route: '/employee/raise-complaint', icon: 'raise' },
        { label: 'My Complaints', route: '/employee/my-complaints', icon: 'requests' },
        { label: 'My Profile', route: '/employee/profile', icon: 'profile' },
      ];
    case 'GRO':
      return [
        { label: 'Dashboard', route: '/gro/dashboard', icon: 'dashboard' },
        { label: 'File a Complaint', route: '/gro/raise-complaint', icon: 'raise' },
        { label: 'My Filed Complaints', route: '/gro/my-filed-complaints', icon: 'requests' },
        { label: 'My Work Queue', route: '/gro/my-work-queue', icon: 'work-queue' },
      ];
    case 'DEPARTMENT_HEAD':
      return [
        { label: 'Dashboard', route: '/dept-head/dashboard', icon: 'dashboard' },
        { label: 'Raise a Complaint', route: '/dept-head/raise-complaint', icon: 'raise' },
        { label: 'My Filed Complaints', route: '/dept-head/my-filed-complaints', icon: 'requests' },
        { label: 'Department Complaints', route: '/dept-head/department-complaints', icon: 'departments' },
        { label: 'My Work Queue', route: '/dept-head/my-work-queue', icon: 'work-queue' },
      ];
    case 'ADMIN':
      return [
        { label: 'Dashboard', route: '/admin/dashboard', icon: 'dashboard' },
        { label: 'Complaint Requests', route: '/admin/requests', icon: 'requests', badge: 0 },
        { label: 'Role Requests', route: '/admin/role-requests', icon: 'profile', badge: 0 },
        { label: 'Employees', route: '/admin/employees', icon: 'employees' },
        { label: 'Departments', route: '/admin/departments', icon: 'departments' },
        { label: 'Analytics', route: '/admin/analytics', icon: 'chart' },
      ];
    default:
      return [];
  }
}
