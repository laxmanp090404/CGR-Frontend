import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { DepartmentApiService } from '../../services/department.api.service';
import { EmployeeService } from '../../services/employee.service';
import { ToastService } from '../../shared/services/toast.service';
import { DashboardShellComponent, NavItem } from '../../shared/components/dashboard-shell/dashboard-shell';
import { TableSkeletonComponent } from '../../shared/components/table-skeleton/table-skeleton';
import { getNavItems } from '../../shared/components/dashboard-shell/nav-menu';
import { DepartmentDto } from '../../models/department.model';

interface SimpleEmployee {
  employeeId: number;
  employeeName: string;
}

@Component({
  selector: 'app-departments',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    DashboardShellComponent,
    TableSkeletonComponent,
  ],
  templateUrl: './departments.html',
  styleUrl: './departments.scss',
})
export class DepartmentsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly departmentService = inject(DepartmentApiService);
  private readonly employeeService = inject(EmployeeService);
  private readonly toast = inject(ToastService);

  readonly navItems = signal<NavItem[]>(getNavItems('ADMIN'));

  // ── State Signals ────────────────────────────────────────────
  readonly isLoading = signal(true);
  readonly isActionLoading = signal(false);
  readonly departments = signal<DepartmentDto[]>([]);
  readonly activeStatus = signal<string>('all');
  readonly safetyChecked = signal<boolean>(false);

  // ── Dropdown Choices Signal ──────────────────────────────────
  readonly eligibleHeads = signal<SimpleEmployee[]>([]);

  // ── Modal State Signals ──────────────────────────────────────
  readonly isCreateModalOpen = signal(false);
  readonly isEditModalOpen = signal(false);
  readonly isViewModalOpen = signal(false);
  readonly selectedDept = signal<DepartmentDto | null>(null);

  // ── Forms ────────────────────────────────────────────────────
  readonly createForm: FormGroup = this.fb.group({
    departmentName: ['', [Validators.required, Validators.maxLength(100)]],
    departmentHeadEmployeeId: [''],
  });

  readonly editForm: FormGroup = this.fb.group({
    departmentName: ['', [Validators.required, Validators.maxLength(100)]],
    departmentHeadEmployeeId: [''],
    isActive: [true, [Validators.required]],
  });

  get createName() { return this.createForm.get('departmentName')!; }
  get createHead() { return this.createForm.get('departmentHeadEmployeeId')!; }

  get editName() { return this.editForm.get('departmentName')!; }
  get editHead() { return this.editForm.get('departmentHeadEmployeeId')!; }
  get editIsActive() { return this.editForm.get('isActive')!; }

  ngOnInit(): void {
    this.loadDepartments();
    this.loadEligibleHeads();
  }

  loadDepartments(): void {
    this.isLoading.set(true);

    const isActiveParam =
      this.activeStatus() === 'active'
        ? true
        : this.activeStatus() === 'inactive'
        ? false
        : null;

    this.departmentService.getDepartments(isActiveParam).subscribe({
      next: (list) => {
        this.departments.set(list);
        this.isLoading.set(false);
      },
      error: () => {
        this.toast.error('Failed to load departments.');
        this.isLoading.set(false);
      },
    });
  }

  loadEligibleHeads(): void {
    // Load active employees with role 'EMPLOYEE' (roleId = 1)
    this.employeeService.getEmployees(1, 1000, true, 1, null, null).subscribe({
      next: (res) => {
        const mapped = res.items.map((emp) => ({
          employeeId: emp.employeeId,
          employeeName: emp.employeeName,
        }));
        this.eligibleHeads.set(mapped);
      },
      error: () => {
        this.toast.error('Failed to load eligible department heads.');
      },
    });
  }

  // ── Filtering Actions ────────────────────────────────────────
  onStatusChange(val: string): void {
    this.activeStatus.set(val);
    this.loadDepartments();
  }

  resetFilters(): void {
    this.activeStatus.set('all');
    this.loadDepartments();
  }

  // ── View Modal Actions ───────────────────────────────────────
  openViewModal(dept: DepartmentDto): void {
    this.isActionLoading.set(true);
    this.departmentService.getDepartmentById(dept.departmentId).subscribe({
      next: (detailed) => {
        this.selectedDept.set(detailed);
        this.isViewModalOpen.set(true);
        this.isActionLoading.set(false);
      },
      error: () => {
        this.toast.error('Failed to retrieve department details.');
        this.isActionLoading.set(false);
      },
    });
  }

  closeViewModal(): void {
    this.isViewModalOpen.set(false);
    this.selectedDept.set(null);
  }

  // ── Create Modal Actions ─────────────────────────────────────
  openCreateModal(): void {
    this.createForm.reset({
      departmentName: '',
      departmentHeadEmployeeId: '',
    });
    this.isCreateModalOpen.set(true);
  }

  closeCreateModal(): void {
    this.isCreateModalOpen.set(false);
  }

  onCreateSubmit(): void {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }

    this.isActionLoading.set(true);
    const headId = this.createHead.value;
    const dto = {
      departmentName: this.createName.value.trim(),
      departmentHeadEmployeeId: headId ? Number(headId) : null,
    };

    this.departmentService.createDepartment(dto).subscribe({
      next: (created) => {
        this.toast.success(`Successfully created department ${created.departmentName}`);
        this.isActionLoading.set(false);
        this.closeCreateModal();
        this.loadDepartments();
        this.loadEligibleHeads(); // reload eligible heads since one may have been assigned
      },
      error: (err) => {
        const message = err?.error?.message || err?.error || 'Failed to create department.';
        this.toast.error(message);
        this.isActionLoading.set(false);
      },
    });
  }

  // ── Edit Modal Actions ───────────────────────────────────────
  openEditModal(dept: DepartmentDto): void {
    this.selectedDept.set(dept);
    this.editForm.reset({
      departmentName: dept.departmentName,
      departmentHeadEmployeeId: dept.departmentHeadEmployeeId || '',
      isActive: dept.isActive,
    });
    this.safetyChecked.set(false);
    this.isEditModalOpen.set(true);
  }

  closeEditModal(): void {
    this.isEditModalOpen.set(false);
    this.selectedDept.set(null);
    this.safetyChecked.set(false);
  }

  onEditSubmit(): void {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }

    const dept = this.selectedDept();
    if (!dept) return;

    this.isActionLoading.set(true);
    const headId = this.editHead.value;
    const dto = {
      departmentName: this.editName.value.trim(),
      departmentHeadEmployeeId: headId ? Number(headId) : null,
      isActive: this.editIsActive.value === true || String(this.editIsActive.value) === 'true',
    };

    this.departmentService.updateDepartment(dept.departmentId, dto).subscribe({
      next: (updated) => {
        this.toast.success(`Successfully updated department ${updated.departmentName}`);
        this.isActionLoading.set(false);
        this.closeEditModal();
        this.loadDepartments();
        this.loadEligibleHeads(); // reload eligible list
      },
      error: (err) => {
        const message = err?.error?.message || err?.error || 'Failed to update department.';
        this.toast.error(message);
        this.isActionLoading.set(false);
      },
    });
  }

  // Helper to merge current head into dropdown list
  getEditEligibleHeads(currentHeadId?: number | null): SimpleEmployee[] {
    const list = [...this.eligibleHeads()];
    const dept = this.selectedDept();

    if (dept && dept.departmentHeadEmployeeId && dept.departmentHeadEmployeeName) {
      const exists = list.some((emp) => emp.employeeId === dept.departmentHeadEmployeeId);
      if (!exists) {
        list.unshift({
          employeeId: dept.departmentHeadEmployeeId,
          employeeName: dept.departmentHeadEmployeeName,
        });
      }
    }
    return list;
  }
}
