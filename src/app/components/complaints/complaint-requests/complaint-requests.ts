import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

import { ComplaintRequestService } from '../../../services/complaint-request.service';
import { ToastService } from '../../../shared/services/toast.service';
import { TokenStorageService } from '../../../services/auth.api.service';
import { AnalyticsService } from '../../../services/analytics.service';
import { PagedResultDto } from '../../../models/complaint.model';
import { ComplaintRequestDto } from '../../../models/complaint-request.model';
import { DashboardShellComponent, NavItem } from '../../../shared/components/dashboard-shell/dashboard-shell';
import { DashboardSkeletonComponent } from '../../../shared/components/dashboard-skeleton/dashboard-skeleton';
import { getNavItems } from '../../../shared/components/dashboard-shell/nav-menu';
import { ROLE_DASHBOARD_ROUTE } from '../../../models/auth.model';
import { FormsModule } from '@angular/forms';

type ActiveReviewModal = 'approve' | 'reject' | null;

@Component({
  selector: 'app-complaint-requests',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    DashboardShellComponent,
    DashboardSkeletonComponent,
    FormsModule,
  ],
  templateUrl: './complaint-requests.html',
  styleUrl: './complaint-requests.scss',
})
export class ComplaintRequestsComponent implements OnInit {
  private readonly requestService = inject(ComplaintRequestService);
  private readonly toast = inject(ToastService);
  private readonly tokenStorage = inject(TokenStorageService);
  private readonly analyticsService = inject(AnalyticsService);

  readonly isLoading = signal(true);
  readonly result = signal<PagedResultDto<ComplaintRequestDto> | null>(null);
  readonly currentPage = signal(1);
  readonly pageSize = signal(10);
  readonly selectedStatus = signal<number | null>(null);
  readonly isCustomPageSize = signal<boolean>(false);
  readonly pageSizeDropdownValue = signal<string>('10');

  // Review states for Admin
  readonly activeReviewModal = signal<ActiveReviewModal>(null);
  readonly selectedRequest = signal<ComplaintRequestDto | null>(null);
  readonly reviewRemarks = signal('');
  readonly isReviewLoading = signal(false);

  readonly currentRole = computed(() => this.tokenStorage.getRole());
  readonly isAdmin = computed(() => this.currentRole() === 'ADMIN');

  readonly navItems = computed<NavItem[]>(() => {
    const role = this.tokenStorage.getRole();
    return role ? getNavItems(role) : [];
  });

  ngOnInit(): void {
    const size = this.pageSize();
    if ([5, 10, 20, 50].includes(size)) {
      this.isCustomPageSize.set(false);
      this.pageSizeDropdownValue.set(String(size));
    } else {
      this.isCustomPageSize.set(true);
      this.pageSizeDropdownValue.set('custom');
    }
    this.loadRequests();
  }

  loadRequests(): void {
    this.isLoading.set(true);
    this.requestService
      .getPagedRequests(this.currentPage(), this.pageSize(), this.selectedStatus())
      .subscribe({
        next: (res) => {
          this.result.set(res);
          this.isLoading.set(false);
        },
        error: () => {
          this.toast.error('Failed to load rejection requests.');
          this.isLoading.set(false);
        },
      });
  }

  onStatusChange(statusId: number | null): void {
    this.selectedStatus.set(statusId);
    this.currentPage.set(1);
    this.loadRequests();
  }

  onDropdownPageSizeChange(value: string): void {
    this.pageSizeDropdownValue.set(value);
    if (value === 'custom') {
      this.isCustomPageSize.set(true);
    } else {
      this.isCustomPageSize.set(false);
      const size = Number(value);
      this.pageSize.set(size);
      this.currentPage.set(1);
      this.loadRequests();
    }
  }

  onCustomPageSizeChange(value: any): void {
    const size = Number(value);
    if (size > 0) {
      this.pageSize.set(size);
      this.currentPage.set(1);
      this.loadRequests();
    }
  }

  goToPage(page: number): void {
    const total = this.result()?.totalPages ?? 1;
    if (page < 1 || page > total) return;
    this.currentPage.set(page);
    this.loadRequests();
  }

  getComplaintDetailLink(complaintId: number): string[] {
    const role = this.currentRole();
    const routeRole = role === 'DEPARTMENT_HEAD' ? 'dept-head' : role?.toLowerCase();
    return [`/${routeRole}/complaints`, String(complaintId)];
  }

  openReviewModal(request: ComplaintRequestDto, type: 'approve' | 'reject'): void {
    this.selectedRequest.set(request);
    this.reviewRemarks.set('');
    this.activeReviewModal.set(type);
  }

  closeReviewModal(): void {
    this.activeReviewModal.set(null);
    this.selectedRequest.set(null);
    this.reviewRemarks.set('');
  }

  onSubmitReview(): void {
    const req = this.selectedRequest();
    const modalType = this.activeReviewModal();
    if (!req || !modalType) return;

    this.isReviewLoading.set(true);
    const approve = modalType === 'approve';

    this.requestService.reviewRequest(req.requestId, approve, this.reviewRemarks()).subscribe({
      next: () => {
        this.toast.success(approve ? 'Request approved successfully.' : 'Request rejected successfully.');
        this.closeReviewModal();
        this.isReviewLoading.set(false);
        this.loadRequests();
        if (this.currentRole() === 'ADMIN') {
          this.analyticsService.getAdminDashboard().subscribe({
            next: (data) => {
              this.analyticsService.pendingComplaintRequests.set(data.pendingComplaintRequests);
              this.analyticsService.pendingRoleRequests.set(data.pendingRoleRequests);
            }
          });
        }
      },
      error: (err) => {
        this.toast.error(err?.error?.message ?? 'Action failed. Please try again.');
        this.isReviewLoading.set(false);
      },
    });
  }

  getStatusClass(statusId: number): string {
    switch (statusId) {
      case 1: return 'badge--open';      // Pending
      case 2: return 'badge--resolved';  // Approved
      case 3: return 'badge--rejected';  // Rejected
      default: return 'badge--neutral';
    }
  }

  get pages(): number[] {
    const total = this.result()?.totalPages ?? 1;
    return Array.from({ length: total }, (_, i) => i + 1);
  }
}
