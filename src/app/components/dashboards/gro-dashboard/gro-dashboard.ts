import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';

import { AnalyticsService } from '../../../services/analytics.service';
import { ToastService } from '../../../shared/services/toast.service';
import { TokenStorageService } from '../../../services/auth.api.service';
import { getNavItems } from '../../../shared/components/dashboard-shell/nav-menu';
import { GroDashboardDto, MyDashboardDto, StatusDistributionDto } from '../../../models/analytics.model';
import { DashboardShellComponent, NavItem } from '../../../shared/components/dashboard-shell/dashboard-shell';
import { KpiCardComponent } from '../../../shared/components/kpi-card/kpi-card';
import { StatusPieChartComponent } from '../../../shared/components/status-pie-chart/status-pie-chart';
import { BarChartComponent, BarChartItem } from '../../../shared/components/bar-chart/bar-chart';
import { DashboardSkeletonComponent } from '../../../shared/components/dashboard-skeleton/dashboard-skeleton';

@Component({
  selector: 'app-gro-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    DashboardShellComponent,
    KpiCardComponent,
    StatusPieChartComponent,
    BarChartComponent,
    DashboardSkeletonComponent,
  ],
  templateUrl: './gro-dashboard.html',
  styleUrl: './gro-dashboard.scss',
})
export class GroDashboardComponent {
  private readonly analyticsService = inject(AnalyticsService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly tokenStorage = inject(TokenStorageService);

  readonly isLoading = signal(true);

  readonly groData = signal<GroDashboardDto | null>(null);
  readonly myData = signal<MyDashboardDto | null>(null);
  readonly statusDist = signal<StatusDistributionDto[]>([]);

  readonly workloadChartData = signal<BarChartItem[]>([]);

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
      gro: this.analyticsService.getGroDashboard(),
      my: this.analyticsService.getMyDashboard(),
      statusDist: this.analyticsService.getStatusDistribution(),
    }).subscribe({
      next: (res) => {
        this.groData.set(res.gro);
        this.myData.set(res.my);
        this.statusDist.set(res.statusDist);

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
