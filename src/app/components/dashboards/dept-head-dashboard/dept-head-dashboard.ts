import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';

import { AnalyticsService } from '../../../services/analytics.service';
import { ToastService } from '../../../shared/services/toast.service';
import { DepartmentDashboardDto } from '../../../models/analytics.model';
import { DashboardShellComponent, NavItem } from '../../../shared/components/dashboard-shell/dashboard-shell';
import { KpiCardComponent } from '../../../shared/components/kpi-card/kpi-card';
import { StatusPieChartComponent } from '../../../shared/components/status-pie-chart/status-pie-chart';
import { BarChartComponent, BarChartItem } from '../../../shared/components/bar-chart/bar-chart';
import { DashboardSkeletonComponent } from '../../../shared/components/dashboard-skeleton/dashboard-skeleton';
import { TokenStorageService } from '../../../services/auth.api.service';
import { getNavItems } from '../../../shared/components/dashboard-shell/nav-menu';

const PRIORITY_COLORS: Record<string, string> = {
  low: '#00ac46',
  medium: '#fdc500',
  high: '#fd8c00',
  critical: '#dc0000',
};

@Component({
  selector: 'app-dept-head-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    DashboardShellComponent,
    KpiCardComponent,
    StatusPieChartComponent,
    BarChartComponent,
    DashboardSkeletonComponent,
  ],
  templateUrl: './dept-head-dashboard.html',
  styleUrl: './dept-head-dashboard.scss',
})
export class DeptHeadDashboardComponent {
  private readonly analyticsService = inject(AnalyticsService);
  private readonly toast = inject(ToastService);
  private readonly tokenStorage = inject(TokenStorageService);

  readonly isLoading = signal(true);

  readonly deptData = signal<DepartmentDashboardDto | null>(null);

  readonly topCatsChartData = signal<BarChartItem[]>([]);
  readonly priorityChartData = signal<BarChartItem[]>([]);
  readonly priorityColors = signal<string[]>([]);

  readonly escalationRate = signal<number>(0);

  readonly navItems = computed<NavItem[]>(() => {
    const role = this.tokenStorage.getRole();
    return role ? getNavItems(role) : [];
  });

  constructor() {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);
    forkJoin({
      deptBoards: this.analyticsService.getDepartmentDashboard(),
      topCats: this.analyticsService.getTopCategories(5),
      summary: this.analyticsService.getComplaintSummary(),
    }).subscribe({
      next: (res) => {
        if (res.deptBoards && res.deptBoards.length > 0) {
          this.deptData.set(res.deptBoards[0]);
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

        // Map priorities with colour array
        const priorityItems = res.summary.byPriority.map((p) => ({
          label: p.priorityName,
          value: p.count,
        }));
        this.priorityChartData.set(priorityItems);
        this.priorityColors.set(
          priorityItems.map(
            (p) => PRIORITY_COLORS[p.label.toLowerCase()] ?? '#455e91'
          )
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

  getSlaClass(percent: number | null | undefined): string {
    if (percent === null || percent === undefined) return 'badge--neutral';
    if (percent >= 90) return 'badge--success';
    if (percent >= 70) return 'badge--warning';
    return 'badge--danger';
  }
}
