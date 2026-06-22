import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';

import { AnalyticsService } from '../../../services/analytics.service';
import { ToastService } from '../../../shared/services/toast.service';
import {
  AdminDashboardDto,
  StatusDistributionDto,
  DepartmentDashboardDto,
} from '../../../models/analytics.model';
import { DashboardShellComponent, NavItem } from '../../../shared/components/dashboard-shell/dashboard-shell';
import { KpiCardComponent } from '../../../shared/components/kpi-card/kpi-card';
import { StatusPieChartComponent } from '../../../shared/components/status-pie-chart/status-pie-chart';
import { BarChartComponent, BarChartItem } from '../../../shared/components/bar-chart/bar-chart';
import { DataTableComponent, DataTableColumn } from '../../../shared/components/data-table/data-table';
import { DashboardSkeletonComponent } from '../../../shared/components/dashboard-skeleton/dashboard-skeleton';

@Component({
  selector: 'app-admindashboard',
  standalone: true,
  imports: [
    CommonModule,
    DashboardShellComponent,
    KpiCardComponent,
    StatusPieChartComponent,
    BarChartComponent,
    DataTableComponent,
    DashboardSkeletonComponent,
  ],
  templateUrl: './admindashboard.html',
  styleUrl: './admindashboard.scss',
})
export class Admindashboard {
  private readonly analyticsService = inject(AnalyticsService);
  private readonly toast = inject(ToastService);

  readonly isLoading = signal(true);

  readonly adminData = signal<AdminDashboardDto | null>(null);
  readonly statusDist = signal<StatusDistributionDto[]>([]);
  readonly deptBoards = signal<DepartmentDashboardDto[]>([]);

  readonly topCatsChartData = signal<BarChartItem[]>([]);
  readonly priorityChartData = signal<BarChartItem[]>([]);
  readonly deptComplaintsChartData = signal<BarChartItem[]>([]);

  readonly navItems = signal<NavItem[]>([
    { label: 'Dashboard', route: '/admin/dashboard', icon: 'dashboard' },
    { label: 'Complaint Requests', route: '/admin/requests', icon: 'requests', badge: 0 },
    { label: 'Role Requests', route: '/admin/role-requests', icon: 'profile', badge: 0 },
    { label: 'Employees', route: '/admin/employees', icon: 'employees' },
    { label: 'Departments', route: '/admin/departments', icon: 'departments' },
    { label: 'Analytics', route: '/admin/analytics', icon: 'chart' },
  ]);

  readonly columns: DataTableColumn[] = [
    { key: 'departmentName', label: 'Department Name', sortable: true, type: 'text' },
    { key: 'totalComplaints', label: 'Total', sortable: true, type: 'number' },
    { key: 'openComplaints', label: 'Open', sortable: true, type: 'number' },
    { key: 'overdueComplaints', label: 'Overdue', sortable: true, type: 'number' },
    { key: 'avgResolutionHours', label: 'Avg Hrs', sortable: true, type: 'duration' },
    { key: 'slaCompliancePercent', label: 'SLA %', sortable: true, type: 'percent' },
  ];

  constructor() {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);
    forkJoin({
      admin: this.analyticsService.getAdminDashboard(),
      statusDist: this.analyticsService.getStatusDistribution(),
      topCats: this.analyticsService.getTopCategories(5),
      summary: this.analyticsService.getComplaintSummary(),
      deptBoards: this.analyticsService.getDepartmentDashboard(),
    }).subscribe({
      next: (res) => {
        this.adminData.set(res.admin);
        this.statusDist.set(res.statusDist);
        this.deptBoards.set(res.deptBoards);

        // Update nav badges
        this.navItems.update((items) =>
          items.map((item) => {
            if (item.label === 'Complaint Requests') {
              return { ...item, badge: res.admin.pendingComplaintRequests };
            }
            if (item.label === 'Role Requests') {
              return { ...item, badge: res.admin.pendingRoleRequests };
            }
            return item;
          })
        );

        // Map top categories chart
        this.topCatsChartData.set(
          res.topCats.map((c) => ({
            label: c.categoryName,
            value: c.complaintCount,
          }))
        );

        // Map priority breakdown chart
        this.priorityChartData.set(
          res.summary.byPriority.map((p) => ({
            label: p.priorityName,
            value: p.count,
          }))
        );

        // Map department complaints chart
        this.deptComplaintsChartData.set(
          res.deptBoards.map((d) => ({
            label: d.departmentName,
            value: d.totalComplaints,
          }))
        );

        this.isLoading.set(false);
      },
      error: () => {
        this.toast.error('Failed to load dashboard data. Please try again.');
        this.isLoading.set(false);
      },
    });
  }

  getSlaClass(percent: number | null): string {
    if (percent === null) return 'badge--neutral';
    if (percent >= 90) return 'badge--success';
    if (percent >= 70) return 'badge--warning';
    return 'badge--danger';
  }
}
