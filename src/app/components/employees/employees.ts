import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { EmployeeService } from '../../services/employee.service';
import { LookupService, DepartmentLookupDto } from '../../services/lookup.service';
import { ToastService } from '../../shared/services/toast.service';
import { DashboardShellComponent, NavItem } from '../../shared/components/dashboard-shell/dashboard-shell';
import { TableSkeletonComponent } from '../../shared/components/table-skeleton/table-skeleton';
import { getNavItems } from '../../shared/components/dashboard-shell/nav-menu';
import { EmployeeDto } from '../../models/employee.model';

@Component({
  selector: 'app-employees',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    DashboardShellComponent,
    TableSkeletonComponent,
  ],
  templateUrl: './employees.html',
  styleUrl: './employees.scss',
})
export class EmployeesComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly employeeService = inject(EmployeeService);
  private readonly lookupService = inject(LookupService);
  private readonly toast = inject(ToastService);

  readonly navItems = signal<NavItem[]>(getNavItems('ADMIN'));

  // ── State Signals ────────────────────────────────────────────
  readonly isLoading = signal(true);
  readonly isActionLoading = signal(false);
  readonly employees = signal<EmployeeDto[]>([]);
  readonly totalCount = signal(0);
  readonly totalPages = signal(0);
  readonly currentPage = signal(1);
  readonly pageSize = 10;

  // ── Filter Signals ───────────────────────────────────────────
  readonly search = signal('');
  readonly activeStatus = signal<string>('all');
  readonly selectedRoleId = signal<number | null>(null);
  readonly selectedDeptId = signal<number | null>(null);

  // ── Lookup Signals ───────────────────────────────────────────
  readonly roles = signal<any[]>([]);
  readonly departments = signal<DepartmentLookupDto[]>([]);

  // ── Modal State Signals ──────────────────────────────────────
  readonly isEditModalOpen = signal(false);
  readonly selectedEmployee = signal<EmployeeDto | null>(null);
  readonly isConfirmModalOpen = signal(false);
  readonly confirmAction = signal<'deactivate' | 'restore' | null>(null);
  readonly employeeToToggle = signal<EmployeeDto | null>(null);

  // ── Forms ────────────────────────────────────────────────────
  readonly editForm: FormGroup = this.fb.group({
    employeeName: ['', [Validators.required, Validators.minLength(2)]],
    email:        ['', [Validators.required, Validators.email]],
    mobileNumber: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
  });

  get employeeName() { return this.editForm.get('employeeName')!; }
  get email()        { return this.editForm.get('email')!; }
  get mobileNumber() { return this.editForm.get('mobileNumber')!; }

  ngOnInit(): void {
    this.loadLookups();
    this.loadEmployees();
  }

  loadLookups(): void {
    this.lookupService.getRoles().subscribe({
      next: (list) => this.roles.set(list),
      error: () => this.toast.error('Failed to load roles list.'),
    });

    this.lookupService.getDepartments().subscribe({
      next: (list) => this.departments.set(list),
      error: () => this.toast.error('Failed to load departments list.'),
    });
  }

  loadEmployees(): void {
    this.isLoading.set(true);

    const isActiveParam =
      this.activeStatus() === 'active'
        ? true
        : this.activeStatus() === 'inactive'
        ? false
        : null;

    this.employeeService
      .getEmployees(
        this.currentPage(),
        this.pageSize,
        isActiveParam,
        this.selectedRoleId(),
        this.selectedDeptId(),
        this.search()
      )
      .subscribe({
        next: (res) => {
          this.employees.set(res.items);
          this.totalCount.set(res.totalCount);
          this.totalPages.set(Math.ceil(res.totalCount / this.pageSize));
          this.isLoading.set(false);
        },
        error: () => {
          this.toast.error('Failed to load employees list.');
          this.isLoading.set(false);
        },
      });
  }

  // ── Filtering Actions ────────────────────────────────────────
  onSearchChange(val: string): void {
    this.search.set(val);
    this.currentPage.set(1);
    this.loadEmployees();
  }

  onStatusChange(val: string): void {
    this.activeStatus.set(val);
    this.currentPage.set(1);
    this.loadEmployees();
  }

  onRoleChange(val: string): void {
    const parsed = val ? Number(val) : null;
    this.selectedRoleId.set(parsed);
    this.currentPage.set(1);
    this.loadEmployees();
  }

  onDeptChange(val: string): void {
    const parsed = val ? Number(val) : null;
    this.selectedDeptId.set(parsed);
    this.currentPage.set(1);
    this.loadEmployees();
  }

  // ── Pagination Actions ───────────────────────────────────────
  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    this.loadEmployees();
  }

  get pages(): number[] {
    const count = this.totalPages();
    const arr: number[] = [];
    for (let i = 1; i <= count; i++) {
      arr.push(i);
    }
    return arr;
  }

  // ── Edit Modal Actions ───────────────────────────────────────
  openEditModal(emp: EmployeeDto): void {
    this.selectedEmployee.set(emp);
    this.editForm.reset({
      employeeName: emp.employeeName,
      email: emp.email,
      mobileNumber: emp.mobileNumber,
    });
    this.isEditModalOpen.set(true);
  }

  closeEditModal(): void {
    this.isEditModalOpen.set(false);
    this.selectedEmployee.set(null);
  }

  onEditSubmit(): void {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }

    const emp = this.selectedEmployee();
    if (!emp) return;

    this.isActionLoading.set(true);
    const dto = {
      employeeName: this.employeeName.value.trim(),
      email: this.email.value.trim(),
      mobileNumber: this.mobileNumber.value.trim(),
    };

    this.employeeService.updateEmployee(emp.employeeId, dto).subscribe({
      next: (updated) => {
        this.toast.success(`Successfully updated ${updated.employeeName}`);
        this.isActionLoading.set(false);
        this.closeEditModal();
        this.loadEmployees();
      },
      error: (err) => {
        const message = err?.error?.message || 'Failed to update employee.';
        this.toast.error(message);
        this.isActionLoading.set(false);
      },
    });
  }

  // ── Status Confirm Modal Actions ─────────────────────────────
  openConfirmModal(emp: EmployeeDto, action: 'deactivate' | 'restore'): void {
    this.employeeToToggle.set(emp);
    this.confirmAction.set(action);
    this.isConfirmModalOpen.set(true);
  }

  closeConfirmModal(): void {
    this.isConfirmModalOpen.set(false);
    this.employeeToToggle.set(null);
    this.confirmAction.set(null);
  }

  onConfirmActionSubmit(): void {
    const emp = this.employeeToToggle();
    const action = this.confirmAction();
    if (!emp || !action) return;

    this.isActionLoading.set(true);

    if (action === 'deactivate') {
      this.employeeService.deactivateEmployee(emp.employeeId).subscribe({
        next: () => {
          this.toast.success(`Successfully deactivated employee ${emp.employeeName}`);
          this.isActionLoading.set(false);
          this.closeConfirmModal();
          this.loadEmployees();
        },
        error: (err) => {
          const message = err?.error?.message || err?.error || 'Failed to deactivate employee.';
          this.toast.error(message);
          this.isActionLoading.set(false);
        },
      });
    } else {
      this.employeeService.restoreEmployee(emp.employeeId).subscribe({
        next: () => {
          this.toast.success(`Successfully restored employee ${emp.employeeName}`);
          this.isActionLoading.set(false);
          this.closeConfirmModal();
          this.loadEmployees();
        },
        error: (err) => {
          const message = err?.error?.message || err?.error || 'Failed to restore employee.';
          this.toast.error(message);
          this.isActionLoading.set(false);
        },
      });
    }
  }
}
