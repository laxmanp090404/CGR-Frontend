import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';

import { AnalyticsService } from '../../../services/analytics.service';
import { ToastService } from '../../../shared/services/toast.service';
import {
  DepartmentDashboardDto,
  MyDashboardDto,
} from '../../../models/analytics.model';
import { DashboardShellComponent, NavItem } from '../../../shared/components/dashboard-shell/dashboard-shell';
import { KpiCardComponent } from '../../../shared/components/kpi-card/kpi-card';
import { StatusPieChartComponent } from '../../../shared/components/status-pie-chart/status-pie-chart';
import { BarChartComponent, BarChartItem } from '../../../shared/components/bar-chart/bar-chart';
import { DashboardSkeletonComponent } from '../../../shared/components/dashboard-skeleton/dashboard-skeleton';

@Component({
  selector: 'app-deptheaddashboard',
  standalone: true,
  imports: [
    CommonModule,
    DashboardShellComponent,
    KpiCardComponent,
    StatusPieChartComponent,
    BarChartComponent,
    DashboardSkeletonComponent,
  ],
  templateUrl: './deptheaddashboard.html',
  styleUrl: './deptheaddashboard.scss',
})
export class Deptheaddashboard {
  private readonly analyticsService = inject(AnalyticsService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly isLoading = signal(true);

  readonly deptData = signal<DepartmentDashboardDto | null>(null);
  readonly myData = signal<MyDashboardDto | null>(null);

  readonly topCatsChartData = signal<BarChartItem[]>([]);
  readonly priorityChartData = signal<BarChartItem[]>([]);

  readonly escalationRate = signal<number>(0);

  readonly navItems = signal<NavItem[]>([
    { label: 'Dashboard', route: '/dept-head/dashboard', icon: 'dashboard' },
    { label: 'Raise a Complaint', route: '/dept-head/raise-complaint', icon: 'raise' },
    { label: 'My Filed Complaints', route: '/dept-head/my-filed-complaints', icon: 'requests' },
    { label: 'Analytics', route: '/dept-head/analytics', icon: 'chart' },
  ]);

  constructor() {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);
    forkJoin({
      deptBoards: this.analyticsService.getDepartmentDashboard(),
      my: this.analyticsService.getMyDashboard(),
      topCats: this.analyticsService.getTopCategories(5),
      summary: this.analyticsService.getComplaintSummary(),
    }).subscribe({
      next: (res) => {
        this.myData.set(res.my);

        if (res.deptBoards && res.deptBoards.length > 0) {
          const dept = res.deptBoards[0];
          this.deptData.set(dept);
        } else {
          this.toast.error('Department data unavailable.');
        }

        // Map top categories
        this.topCatsChartData.set(
          res.topCats.map((c) => ({
            label: c.categoryName,
            value: c.complaintCount,
          }))
        );

        // Map priorities
        this.priorityChartData.set(
          res.summary.byPriority.map((p) => ({
            label: p.priorityName,
            value: p.count,
          }))
        );

        // Calculate escalation rate
        if (res.summary.totalComplaints > 0) {
          const rate = (res.summary.escalatedComplaints / res.summary.totalComplaints) * 100;
          this.escalationRate.set(Math.round(rate * 10) / 10);
        } else {
          this.escalationRate.set(0);
        }

        this.isLoading.set(false);
      },
      error: () => {
        this.toast.error('Failed to load dashboard data. Please try again.');
        this.isLoading.set(false);
      },
    });
  }

  raiseComplaint(): void {
    this.router.navigate(['/dept-head/raise-complaint']);
  }

  getSlaClass(percent: number | null | undefined): string {
    if (percent === null || percent === undefined) return 'badge--neutral';
    if (percent >= 90) return 'badge--success';
    if (percent >= 70) return 'badge--warning';
    return 'badge--danger';
  }
}
