import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { AnalyticsService } from '../../../services/analytics.service';
import { ToastService } from '../../../shared/services/toast.service';
import { TokenStorageService } from '../../../services/auth.api.service';
import { getNavItems } from '../../../shared/components/dashboard-shell/nav-menu';
import { MyDashboardDto } from '../../../models/analytics.model';
import { DashboardShellComponent, NavItem } from '../../../shared/components/dashboard-shell/dashboard-shell';
import { KpiCardComponent } from '../../../shared/components/kpi-card/kpi-card';
import { StatusPieChartComponent } from '../../../shared/components/status-pie-chart/status-pie-chart';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state';
import { DashboardSkeletonComponent } from '../../../shared/components/dashboard-skeleton/dashboard-skeleton';

@Component({
  selector: 'app-employee-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    DashboardShellComponent,
    KpiCardComponent,
    StatusPieChartComponent,
    EmptyStateComponent,
    DashboardSkeletonComponent,
  ],
  templateUrl: './employee-dashboard.html',
  styleUrl: './employee-dashboard.scss',
})
export class EmployeeDashboardComponent {
  private readonly analyticsService = inject(AnalyticsService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly tokenStorage = inject(TokenStorageService);

  readonly isLoading = signal(true);
  readonly dashboardData = signal<MyDashboardDto | null>(null);

  readonly navItems = computed<NavItem[]>(() => {
    const role = this.tokenStorage.getRole();
    return role ? getNavItems(role) : [];
  });

  constructor() {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);
    this.analyticsService.getMyDashboard().subscribe({
      next: (data) => {
        this.dashboardData.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.toast.error('Failed to load dashboard data. Please try again.');
        this.isLoading.set(false);
      },
    });
  }

  raiseComplaint(): void {
    this.router.navigate(['/employee/raise-complaint']);
  }
}
