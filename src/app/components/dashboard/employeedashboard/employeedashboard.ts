import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { AnalyticsService } from '../../../services/analytics.service';
import { ToastService } from '../../../shared/services/toast.service';
import { MyDashboardDto } from '../../../models/analytics.model';
import { DashboardShellComponent, NavItem } from '../../../shared/components/dashboard-shell/dashboard-shell';
import { KpiCardComponent } from '../../../shared/components/kpi-card/kpi-card';
import { StatusPieChartComponent } from '../../../shared/components/status-pie-chart/status-pie-chart';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state';
import { DashboardSkeletonComponent } from '../../../shared/components/dashboard-skeleton/dashboard-skeleton';

@Component({
  selector: 'app-employeedashboard',
  standalone: true,
  imports: [
    CommonModule,
    DashboardShellComponent,
    KpiCardComponent,
    StatusPieChartComponent,
    EmptyStateComponent,
    DashboardSkeletonComponent,
  ],
  templateUrl: './employeedashboard.html',
  styleUrl: './employeedashboard.scss',
})
export class Employeedashboard {
  private readonly analyticsService = inject(AnalyticsService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly isLoading = signal(true);
  readonly dashboardData = signal<MyDashboardDto | null>(null);

  readonly navItems: NavItem[] = [
    { label: 'Dashboard', route: '/employee/dashboard', icon: 'dashboard' },
    { label: 'Raise Complaint', route: '/employee/raise-complaint', icon: 'raise' },
    { label: 'My Complaints', route: '/employee/my-complaints', icon: 'requests' },
    { label: 'My Profile', route: '/employee/profile', icon: 'profile' },
  ];

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
