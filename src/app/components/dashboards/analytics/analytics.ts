import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AnalyticsService } from '../../../services/analytics.service';
import { ToastService } from '../../../shared/services/toast.service';
import { TokenStorageService } from '../../../services/auth.api.service';
import { DepartmentDashboardDto, StatusDistributionDto } from '../../../models/analytics.model';
import { DashboardShellComponent, NavItem } from '../../../shared/components/dashboard-shell/dashboard-shell';
import { KpiCardComponent } from '../../../shared/components/kpi-card/kpi-card';
import { StatusPieChartComponent } from '../../../shared/components/status-pie-chart/status-pie-chart';
import { DashboardSkeletonComponent } from '../../../shared/components/dashboard-skeleton/dashboard-skeleton';
import { getNavItems } from '../../../shared/components/dashboard-shell/nav-menu';

@Component({
  selector: 'app-admin-analytics',
  standalone: true,
  imports: [
    CommonModule,
    DashboardShellComponent,
    KpiCardComponent,
    StatusPieChartComponent,
    DashboardSkeletonComponent,
  ],
  templateUrl: './analytics.html',
  styleUrl: './analytics.scss',
})
export class AnalyticsComponent {
  private readonly analyticsService = inject(AnalyticsService);
  private readonly toast = inject(ToastService);
  private readonly tokenStorage = inject(TokenStorageService);

  readonly isLoading = signal(true);
  readonly allDeptsData = signal<DepartmentDashboardDto[]>([]);
  readonly selectedDeptId = signal<number | null>(null);

  readonly navItems = computed<NavItem[]>(() => {
    const role = this.tokenStorage.getRole();
    return role ? getNavItems(role) : [];
  });

  // Derived list of departments for dropdown
  readonly departments = computed(() => {
    return this.allDeptsData().map((d) => ({
      id: d.departmentId,
      name: d.departmentName,
    }));
  });

  // Derived selected department data
  readonly selectedDept = computed<DepartmentDashboardDto | null>(() => {
    const data = this.allDeptsData();
    const id = this.selectedDeptId();
    if (!data || data.length === 0) return null;
    if (id === null) return data[0]; // default to first department
    return data.find((d) => d.departmentId === id) || data[0];
  });

  constructor() {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);
    this.analyticsService.getDepartmentDashboard().subscribe({
      next: (res) => {
        this.allDeptsData.set(res || []);
        if (res && res.length > 0) {
          // Initialize selected department ID if not set
          if (this.selectedDeptId() === null) {
            this.selectedDeptId.set(res[0].departmentId);
          }
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.toast.error('Failed to load department analytics.');
        this.isLoading.set(false);
      },
    });
  }

  onDepartmentChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const value = target.value ? Number(target.value) : null;
    this.selectedDeptId.set(value);
  }

  getSlaClass(percent: number | null | undefined): string {
    if (percent === null || percent === undefined) return 'badge--neutral';
    if (percent >= 90) return 'badge--success';
    if (percent >= 70) return 'badge--warning';
    return 'badge--danger';
  }
}
