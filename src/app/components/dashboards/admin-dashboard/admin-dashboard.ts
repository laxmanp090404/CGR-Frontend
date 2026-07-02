import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';

import { AnalyticsService } from '../../../services/analytics.service';
import { ToastService } from '../../../shared/services/toast.service';
import { TokenStorageService } from '../../../services/auth.api.service';
import { getNavItems } from '../../../shared/components/dashboard-shell/nav-menu';
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
  selector: 'app-admin-dashboard',
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
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.scss',
})
export class AdminDashboardComponent {
  private readonly analyticsService = inject(AnalyticsService);
  private readonly toast = inject(ToastService);
  private readonly tokenStorage = inject(TokenStorageService);

  readonly isLoading = signal(true);

  readonly adminData = signal<AdminDashboardDto | null>(null);
  readonly statusDist = signal<StatusDistributionDto[]>([]);
  readonly deptBoards = signal<DepartmentDashboardDto[]>([]);

  readonly topCatsChartData = signal<BarChartItem[]>([]);
  readonly priorityChartData = signal<BarChartItem[]>([]);
  readonly deptComplaintsChartData = signal<BarChartItem[]>([]);
  readonly topCatsLimit = signal<number>(5);

  readonly priorityChartColors = computed(() => {
    return this.priorityChartData().map((item) => {
      const label = item.label.toLowerCase();
      if (label.includes('critical')) return '#dc0000'; 
      if (label.includes('high')) return '#fd8c00';    
      if (label.includes('medium')) return '#fea619';  
      if (label.includes('low')) return '#00ac46';      
      return '#888888';                                
    });
  });

  readonly navItems = signal<NavItem[]>(getNavItems('ADMIN'));

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
      topCats: this.analyticsService.getTopCategories(this.topCatsLimit()),
      summary: this.analyticsService.getComplaintSummary(),
      deptBoards: this.analyticsService.getDepartmentDashboard(),
    }).subscribe({
      next: (res) => {
        this.adminData.set(res.admin);
        this.statusDist.set(res.statusDist);
        this.deptBoards.set(res.deptBoards);

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

        this.analyticsService.pendingComplaintRequests.set(res.admin.pendingComplaintRequests);
        this.analyticsService.pendingRoleRequests.set(res.admin.pendingRoleRequests);

        this.topCatsChartData.set(
          res.topCats.map((c) => ({
            label: c.categoryName,
            value: c.complaintCount,
          }))
        );

        this.priorityChartData.set(
          res.summary.byPriority.map((p) => ({
            label: p.priorityName,
            value: p.count,
          }))
        );

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

  loadTopCategories(): void {
    this.analyticsService.getTopCategories(this.topCatsLimit()).subscribe({
      next: (cats) => {
        this.topCatsChartData.set(
          cats.map((c) => ({
            label: c.categoryName,
            value: c.complaintCount,
          }))
        );
      },
      error: () => {
        this.toast.error('Failed to load top categories');
      }
    });
  }

  onTopCatsLimitChange(event: Event): void {
    const inputEl = event.target as HTMLInputElement;
    let value = parseInt(inputEl.value, 10);
    if (isNaN(value) || value < 1) {
      value = 5;
      inputEl.value = '5';
    }
    this.topCatsLimit.set(value);
    this.loadTopCategories();
  }

  getSlaClass(percent: number | null): string {
    if (percent === null) return 'badge--neutral';
    if (percent >= 90) return 'badge--success';
    if (percent >= 70) return 'badge--warning';
    return 'badge--danger';
  }
}
