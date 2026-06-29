import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { DashboardShellComponent, NavItem } from '../../shared/components/dashboard-shell/dashboard-shell';
import { TableSkeletonComponent } from '../../shared/components/table-skeleton/table-skeleton';
import { getNavItems } from '../../shared/components/dashboard-shell/nav-menu';
import { TokenStorageService } from '../../services/auth.api.service';
import { RoleRequestService } from '../../services/role-request.service';
import { EmployeeService } from '../../services/employee.service';
import { LookupService, DepartmentLookupDto, RequestStatusDto } from '../../services/lookup.service';
import { ToastService } from '../../shared/services/toast.service';
import { RoleRequestDto } from '../../models/role-request.model';
import { EmployeeDto } from '../../models/employee.model';
import { Role } from '../../models/auth.model';

@Component({
  selector: 'app-role-requests',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    DashboardShellComponent,
    TableSkeletonComponent,
  ],
  templateUrl: './role-requests.html',
  styleUrl: './role-requests.scss',
})
export class RoleRequestsComponent implements OnInit {
  private readonly tokenStorage = inject(TokenStorageService);
  private readonly roleRequestService = inject(RoleRequestService);
  private readonly employeeService = inject(EmployeeService);
  private readonly lookupService = inject(LookupService);
  private readonly toast = inject(ToastService);

  // ----- Role / Nav -----
  readonly userRole = signal<Role>(this.tokenStorage.getRole() ?? 'EMPLOYEE');
  readonly navItems = signal<NavItem[]>(getNavItems(this.userRole()));
  readonly isAdmin = computed(() => this.userRole() === 'ADMIN');

  // ----- Admin View State -----
  readonly isLoading = signal(true);
  readonly requests = signal<RoleRequestDto[]>([]);
  readonly totalCount = signal(0);
  readonly totalPages = signal(0);
  readonly currentPage = signal(1);
  readonly pageSize = signal<number>(10);
  readonly isCustomPageSize = signal<boolean>(false);
  readonly pageSizeDropdownValue = signal<string>('10');
  readonly localPageSize = signal<number>(10);
  readonly selectedStatusId = signal<number | null>(null);

  // ----- Lookup Data -----
  readonly requestStatuses = signal<RequestStatusDto[]>([]);
  readonly roles = signal<any[]>([]);
  readonly departments = signal<DepartmentLookupDto[]>([]);

  // ----- Employee Profile View State -----
  readonly myProfile = signal<EmployeeDto | null>(null);
  readonly myRequests = signal<RoleRequestDto[]>([]);
  readonly isProfileLoading = signal(true);
  readonly isSubmitting = signal(false);
  readonly selectedRoleId = signal<number | null>(null);

  // Available roles for segmented picker (all except Admin=4)
  readonly availableRoles = computed(() => {
    return this.roles().filter((r: any) => r.roleId !== 4);
  });

  // ----- Admin Approve/Reject Modal State -----
  readonly isApproveModalOpen = signal(false);
  readonly isRejectModalOpen = signal(false);
  readonly selectedRequest = signal<RoleRequestDto | null>(null);
  readonly isActionLoading = signal(false);
  readonly approveRemarks = signal('');
  readonly approveDeptId = signal<number | null>(null);
  readonly rejectRemarks = signal('');

  // Check if selected request needs department assignment
  readonly needsDepartment = computed(() => {
    const req = this.selectedRequest();
    if (!req) return false;
  
    return true;
  });

  ngOnInit(): void {
    this.loadLookups();

    if (this.isAdmin()) {
      this.loadPagedRequests();
    } else {
      this.loadMyProfile();
      this.loadMyRequests();
    }
  }


  loadLookups(): void {
    this.lookupService.getRequestStatuses().subscribe({
      next: (list) => this.requestStatuses.set(list),
    });

    this.lookupService.getRoles().subscribe({
      next: (list) => this.roles.set(list),
    });

    this.lookupService.getDepartments().subscribe({
      next: (list) => this.departments.set(list),
    });
  }

  loadPagedRequests(): void {
    this.isLoading.set(true);

    this.roleRequestService
      .getPagedRequests(this.currentPage(), this.pageSize(), this.selectedStatusId())
      .subscribe({
        next: (res) => {
          this.requests.set(res.items);
          this.totalCount.set(res.totalCount);
          this.totalPages.set(Math.ceil(res.totalCount / this.pageSize()));
          this.isLoading.set(false);
        },
        error: () => {
          this.toast.error('Failed to load role requests.');
          this.isLoading.set(false);
        },
      });
  }

  onStatusFilterChange(val: string): void {
    this.selectedStatusId.set(val ? Number(val) : null);
    this.currentPage.set(1);
    this.loadPagedRequests();
  }

  onDropdownPageSizeChange(value: string): void {
    this.pageSizeDropdownValue.set(value);
    if (value === 'custom') {
      this.isCustomPageSize.set(true);
    } else {
      this.isCustomPageSize.set(false);
      const size = Number(value) || 10;
      this.pageSize.set(size);
      this.currentPage.set(1);
      this.loadPagedRequests();
    }
  }

  onCustomPageSizeChange(value: any): void {
    const size = Number(value);
    if (size && size > 0) {
      this.pageSize.set(size);
      this.currentPage.set(1);
      this.loadPagedRequests();
    }
  }

  resetFilters(): void {
    this.selectedStatusId.set(null);
    this.pageSize.set(10);
    this.isCustomPageSize.set(false);
    this.pageSizeDropdownValue.set('10');
    this.localPageSize.set(10);
    this.currentPage.set(1);
    this.loadPagedRequests();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    this.loadPagedRequests();
  }

  get pages(): number[] {
    const count = this.totalPages();
    const arr: number[] = [];
    for (let i = 1; i <= count; i++) arr.push(i);
    return arr;
  }

  openApproveModal(req: RoleRequestDto): void {
    this.selectedRequest.set(req);
    this.approveRemarks.set('');
    this.approveDeptId.set(null);
    this.isApproveModalOpen.set(true);
  }

  closeApproveModal(): void {
    this.isApproveModalOpen.set(false);
    this.selectedRequest.set(null);
  }

  submitApproval(): void {
    const req = this.selectedRequest();
    if (!req) return;

    this.isActionLoading.set(true);

    this.roleRequestService
      .approveRoleRequest(req.roleRequestId, {
        assignDepartmentId: this.approveDeptId() || null,
        remarks: this.approveRemarks() || null,
      })
      .subscribe({
        next: () => {
          this.toast.success('Role request approved successfully.');
          this.isActionLoading.set(false);
          this.closeApproveModal();
          this.loadPagedRequests();
        },
        error: (err) => {
          const message = err?.error?.message || 'Failed to approve request.';
          this.toast.error(message);
          this.isActionLoading.set(false);
        },
      });
  }

  openRejectModal(req: RoleRequestDto): void {
    this.selectedRequest.set(req);
    this.rejectRemarks.set('');
    this.isRejectModalOpen.set(true);
  }

  closeRejectModal(): void {
    this.isRejectModalOpen.set(false);
    this.selectedRequest.set(null);
  }

  submitRejection(): void {
    const req = this.selectedRequest();
    if (!req) return;

    this.isActionLoading.set(true);

    this.roleRequestService
      .rejectRoleRequest(req.roleRequestId, {
        remarks: this.rejectRemarks() || null,
      })
      .subscribe({
        next: () => {
          this.toast.success('Role request rejected.');
          this.isActionLoading.set(false);
          this.closeRejectModal();
          this.loadPagedRequests();
        },
        error: (err) => {
          const message = err?.error?.message || 'Failed to reject request.';
          this.toast.error(message);
          this.isActionLoading.set(false);
        },
      });
  }

  loadMyProfile(): void {
    const empId = this.tokenStorage.getEmployeeId();
    if (!empId) return;

    this.employeeService.getEmployeeById(empId).subscribe({
      next: (profile) => {
        this.myProfile.set(profile);
        this.isProfileLoading.set(false);
      },
      error: () => {
        this.toast.error('Failed to load profile.');
        this.isProfileLoading.set(false);
      },
    });
  }

  loadMyRequests(): void {
    this.roleRequestService.getMyRequests().subscribe({
      next: (list) => {
        this.myRequests.set(list);
        this.isProfileLoading.set(false);
      },
      error: () => {
        this.toast.error('Failed to load your role requests.');
        this.isProfileLoading.set(false);
      },
    });
  }

  selectRole(roleId: number): void {
    if (this.selectedRoleId() === roleId) {
      this.selectedRoleId.set(null);
    } else {
      this.selectedRoleId.set(roleId);
    }
  }

  submitRoleRequest(): void {
    const roleId = this.selectedRoleId();
    if (!roleId) {
      this.toast.warning('Please select a role to request.');
      return;
    }

    this.isSubmitting.set(true);

    this.roleRequestService
      .createRoleRequest({ requestedRoleId: roleId })
      .subscribe({
        next: () => {
          this.toast.success('Role upgrade request submitted successfully!');
          this.isSubmitting.set(false);
          this.selectedRoleId.set(null);
          this.loadMyRequests();
        },
        error: (err) => {
          const message = err?.error?.message || 'Failed to submit role request.';
          this.toast.error(message);
          this.isSubmitting.set(false);
        },
      });
  }


  getStatusClass(statusName: string): string {
    const name = statusName.toUpperCase();
    if (name === 'PENDING') return 'badge--pending';
    if (name === 'APPROVED') return 'badge--approved';
    if (name === 'REJECTED') return 'badge--rejected';
    return '';
  }
}
