import { Component, computed, inject, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subject, timer, of } from 'rxjs';
import { debounce, switchMap } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { ComplaintService } from '../../../services/complaint.service';
import { ToastService } from '../../../shared/services/toast.service';
import { ComplaintDashboardDto, PagedResultDto, ComplaintFilterParams } from '../../../models/complaint.model';
import { DashboardShellComponent, NavItem } from '../../../shared/components/dashboard-shell/dashboard-shell';
import { TableSkeletonComponent } from '../../../shared/components/table-skeleton/table-skeleton';
import { ComplaintFilterComponent } from '../../../shared/components/complaint-filter/complaint-filter';
import { TokenStorageService } from '../../../services/auth.api.service';
import { getNavItems } from '../../../shared/components/dashboard-shell/nav-menu';

@Component({
  selector: 'app-department-complaints',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    DashboardShellComponent,
    TableSkeletonComponent,
    ComplaintFilterComponent,
  ],
  templateUrl: './department-complaints.html',
  styleUrl: './department-complaints.scss',
})
export class DepartmentComplaintsComponent {
  private readonly complaintService = inject(ComplaintService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly tokenStorage = inject(TokenStorageService);

  readonly isLoading = signal(true);
  readonly result = signal<PagedResultDto<ComplaintDashboardDto> | null>(null);
  readonly currentPage = signal(1);
  readonly pageSize = signal(10);

  // Filter States
  readonly statusId = signal<number | null>(null);
  readonly priorityId = signal<number | null>(null);
  readonly categoryId = signal<number | null>(null);
  readonly departmentId = signal<number | null>(null);
  readonly searchQuery = signal<string>('');

  readonly isDeptHead = computed(() => this.tokenStorage.getRole() === 'DEPARTMENT_HEAD');
  readonly deptId = computed(() => this.tokenStorage.getDepartmentId());

  readonly navItems = computed<NavItem[]>(() => {
    const role = this.tokenStorage.getRole();
    return role ? getNavItems(role) : [];
  });

  private readonly destroyRef = inject(DestroyRef);
  private readonly filterSubject = new Subject<{ searchChanged: boolean }>();

  constructor() {
    const userDeptId = this.tokenStorage.getDepartmentId();
    if (this.isDeptHead() && userDeptId) {
      this.departmentId.set(userDeptId);
    }
    this.setupFilterStream();
    this.loadComplaints();
  }

  setupFilterStream(): void {
    this.filterSubject.pipe(
      debounce((item) => item.searchChanged ? timer(300) : of(null)),
      switchMap(() => {
        this.isLoading.set(true);
        return this.complaintService.getPagedComplaints(
          this.currentPage(),
          this.pageSize(),
          this.statusId(),
          this.priorityId(),
          this.categoryId(),
          this.departmentId(),
          this.searchQuery(),
          false
        );
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (res) => {
        this.result.set(res);
        this.isLoading.set(false);
      },
      error: () => {
        this.toast.error('Failed to load department complaints.');
        this.isLoading.set(false);
      },
    });
  }

  loadComplaints(searchChanged = false): void {
    this.filterSubject.next({ searchChanged });
  }

  onFilterChanged(filters: ComplaintFilterParams): void {
    const searchChanged = filters.search !== this.searchQuery();
    this.statusId.set(filters.statusId);
    this.priorityId.set(filters.priorityId);
    this.categoryId.set(filters.categoryId);
    const userDeptId = this.tokenStorage.getDepartmentId();
    if (this.isDeptHead() && userDeptId) {
      this.departmentId.set(userDeptId);
    } else {
      this.departmentId.set(filters.departmentId);
    }
    this.searchQuery.set(filters.search);
    this.pageSize.set(filters.pageSize);
    this.currentPage.set(1); // Reset to page 1 on filter changes
    this.loadComplaints(searchChanged);
  }

  goToPage(page: number): void {
    const total = this.result()?.totalPages ?? 1;
    if (page < 1 || page > total) return;
    this.currentPage.set(page);
    this.loadComplaints();
  }

  raiseComplaint(): void {
    const role = this.tokenStorage.getRole();
    const routeRole = role === 'DEPARTMENT_HEAD' ? 'dept-head' : role?.toLowerCase();
    this.router.navigate([`/${routeRole}/raise-complaint`]);
  }

  getComplaintDetailLink(id: number): string[] {
    const role = this.tokenStorage.getRole();
    const routeRole = role === 'DEPARTMENT_HEAD' ? 'dept-head' : role?.toLowerCase();
    return [`/${routeRole}/complaints`, String(id)];
  }

  getStatusClass(status: string): string {
    const s = status.toLowerCase();
    if (s.includes('open') || s.includes('submitted')) return 'badge--open';
    if (s.includes('progress')) return 'badge--progress';
    if (s.includes('resolved')) return 'badge--resolved';
    if (s.includes('closed')) return 'badge--closed';
    if (s.includes('rejected')) return 'badge--rejected';
    if (s.includes('escalated')) return 'badge--escalated';
    return 'badge--neutral';
  }

  getPriorityClass(priority: string): string {
    switch (priority.toLowerCase()) {
      case 'critical': return 'priority--critical';
      case 'high': return 'priority--high';
      case 'medium': return 'priority--medium';
      case 'low': return 'priority--low';
      default: return '';
    }
  }

  get pages(): number[] {
    const total = this.result()?.totalPages ?? 1;
    return Array.from({ length: total }, (_, i) => i + 1);
  }
}
