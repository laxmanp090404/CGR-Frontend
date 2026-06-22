import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';

import { AnalyticsService } from '../../../services/analytics.service';
import { ToastService } from '../../../shared/services/toast.service';
import { GroDashboardDto, MyDashboardDto, StatusDistributionDto } from '../../../models/analytics.model';
import { DashboardShellComponent, NavItem } from '../../../shared/components/dashboard-shell/dashboard-shell';
import { KpiCardComponent } from '../../../shared/components/kpi-card/kpi-card';
import { StatusPieChartComponent } from '../../../shared/components/status-pie-chart/status-pie-chart';
import { BarChartComponent, BarChartItem } from '../../../shared/components/bar-chart/bar-chart';
import { DashboardSkeletonComponent } from '../../../shared/components/dashboard-skeleton/dashboard-skeleton';

@Component({
  selector: 'app-grodashboard',
  standalone: true,
  imports: [
    CommonModule,
    DashboardShellComponent,
    KpiCardComponent,
    StatusPieChartComponent,
    BarChartComponent,
    DashboardSkeletonComponent,
  ],
  templateUrl: './grodashboard.html',
  styleUrl: './grodashboard.scss',
})
export class Grodashboard {
  private readonly analyticsService = inject(AnalyticsService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly isLoading = signal(true);

  readonly groData = signal<GroDashboardDto | null>(null);
  readonly myData = signal<MyDashboardDto | null>(null);
  readonly statusDist = signal<StatusDistributionDto[]>([]);

  readonly workloadChartData = signal<BarChartItem[]>([]);

  readonly navItems = signal<NavItem[]>([
    { label: 'Dashboard', route: '/gro/dashboard', icon: 'dashboard' },
    { label: 'Assigned to Me', route: '/gro/assigned-complaints', icon: 'requests', badge: 0 },
    { label: 'Overdue Assigned', route: '/gro/overdue-complaints', icon: 'overdue', badge: 0 },
    { label: 'Raise a Complaint', route: '/gro/raise-complaint', icon: 'raise' },
    { label: 'My Filed Complaints', route: '/gro/my-filed-complaints', icon: 'requests' },
  ]);

  constructor() {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);
    forkJoin({
      gro: this.analyticsService.getGroDashboard(),
      my: this.analyticsService.getMyDashboard(),
      statusDist: this.analyticsService.getStatusDistribution(),
    }).subscribe({
      next: (res) => {
        this.groData.set(res.gro);
        this.myData.set(res.my);
        this.statusDist.set(res.statusDist);

        // Update nav badges
        this.navItems.update((items) =>
          items.map((item) => {
            if (item.label === 'Assigned to Me') {
              return { ...item, badge: res.gro.assignedToMe };
            }
            if (item.label === 'Overdue Assigned') {
              return { ...item, badge: res.gro.overdueAssignedToMe };
            }
            return item;
          })
        );

        // Map workload chart
        this.workloadChartData.set([
          { label: 'Assigned', value: res.gro.assignedToMe },
          { label: 'In Progress', value: res.gro.inProgressByMe },
          { label: 'Resolved', value: res.gro.resolvedByMe },
          { label: 'Escalated', value: res.gro.escalatedByMe },
        ]);

        this.isLoading.set(false);
      },
      error: () => {
        this.toast.error('Failed to load dashboard data. Please try again.');
        this.isLoading.set(false);
      },
    });
  }

  raiseComplaint(): void {
    this.router.navigate(['/gro/raise-complaint']);
  }
}
