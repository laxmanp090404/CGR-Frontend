import { Component, inject, signal, computed, OnInit, HostListener, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { DepartmentApiService } from '../../services/department.api.service';
import { EmployeeService } from '../../services/employee.service';
import { ToastService } from '../../shared/services/toast.service';
import { DashboardShellComponent, NavItem } from '../../shared/components/dashboard-shell/dashboard-shell';
import { TableSkeletonComponent } from '../../shared/components/table-skeleton/table-skeleton';
import { getNavItems } from '../../shared/components/dashboard-shell/nav-menu';
import { DepartmentDto } from '../../models/department.model';
import { HasUnsavedChanges } from '../../guards/deactivate.guard';

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
    FormsModule,
    RouterModule,
    DashboardShellComponent,
    TableSkeletonComponent,
  ],
  templateUrl: './departments.html',
  styleUrl: './departments.scss',
})
export class DepartmentsComponent implements OnInit, HasUnsavedChanges {
  private readonly fb = inject(FormBuilder);
  private readonly departmentService = inject(DepartmentApiService);
  private readonly employeeService = inject(EmployeeService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dropdownSearchSubject = new Subject<string>();

  readonly navItems = signal<NavItem[]>(getNavItems('ADMIN'));

  readonly isLoading = signal(true);
  readonly isActionLoading = signal(false);
  readonly departments = signal<DepartmentDto[]>([]);
  readonly activeStatus = signal<string>('all');
  readonly safetyChecked = signal<boolean>(false);

  readonly eligibleHeads = signal<SimpleEmployee[]>([]);

  readonly dropdownSearchText = signal<string>('');
  readonly dropdownPage = signal<number>(1);
  readonly dropdownHasMore = signal<boolean>(true);
  readonly dropdownIsLoading = signal<boolean>(false);
  readonly isDropdownOpen = signal<boolean>(false);

  readonly selectedHeadName = computed(() => {
    const isEdit = this.isEditModalOpen();
    const form = isEdit ? this.editForm : this.createForm;
    const value = form.get('departmentHeadEmployeeId')?.value;
    if (!value) return 'None - No head assigned';
    
    const found = this.eligibleHeads().find(h => h.employeeId === Number(value));
    if (found) return found.employeeName;

    const dept = this.selectedDept();
    if (isEdit && dept && dept.departmentHeadEmployeeId === Number(value)) {
      return dept.departmentHeadEmployeeName || 'None - No head assigned';
    }

    return 'None - No head assigned';
  });

  readonly isCreateModalOpen = signal(false);
  readonly isEditModalOpen = signal(false);
  readonly isViewModalOpen = signal(false);
  readonly selectedDept = signal<DepartmentDto | null>(null);

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
    this.setupDropdownSearchStream();
    this.loadDepartments();
  }

  setupDropdownSearchStream(): void {
    this.dropdownSearchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      this.loadEligibleHeads(true);
    });
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

  loadEligibleHeads(reset: boolean = false): void {
    if (reset) {
      this.dropdownPage.set(1);
      this.dropdownHasMore.set(true);
      this.eligibleHeads.set([]);
    }

    if (!this.dropdownHasMore() || this.dropdownIsLoading()) {
      return;
    }

    this.dropdownIsLoading.set(true);
    const page = this.dropdownPage();
    const searchVal = this.dropdownSearchText().trim();

    this.employeeService.getEmployees(page, 10, true, 1, null, searchVal).subscribe({
      next: (res) => {
        const mapped = res.items.map((emp) => ({
          employeeId: emp.employeeId,
          employeeName: emp.employeeName,
        }));

        if (page === 1) {
          this.eligibleHeads.set(mapped);
        } else {
          this.eligibleHeads.update(current => [...current, ...mapped]);
        }

        const totalFetched = this.eligibleHeads().length;
        this.dropdownHasMore.set(totalFetched < res.totalCount);
        this.dropdownPage.update(p => p + 1);
        this.dropdownIsLoading.set(false);
      },
      error: () => {
        this.toast.error('Failed to load eligible department heads.');
        this.dropdownIsLoading.set(false);
      },
    });
  }

  onSearchTextChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const text = input.value;
    this.dropdownSearchText.set(text);
    this.dropdownSearchSubject.next(text);
  }

  toggleDropdown(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    const current = this.isDropdownOpen();
    if (!current) {
      this.dropdownSearchText.set('');
      this.loadEligibleHeads(true);
    }
    this.isDropdownOpen.set(!current);
  }

  selectHead(emp: SimpleEmployee | null): void {
    const form = this.isEditModalOpen() ? this.editForm : this.createForm;
    form.get('departmentHeadEmployeeId')?.setValue(emp ? String(emp.employeeId) : '');
    this.isDropdownOpen.set(false);
  }

  onDropdownScroll(event: Event): void {
    const target = event.target as HTMLElement;
    const threshold = 10; 
    const isAtBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + threshold;
    if (isAtBottom && !this.dropdownIsLoading() && this.dropdownHasMore()) {
      this.loadEligibleHeads(false);
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.custom-select-container')) {
      this.isDropdownOpen.set(false);
    }
  }

  onStatusChange(val: string): void {
    this.activeStatus.set(val);
    this.loadDepartments();
  }

  resetFilters(): void {
    this.activeStatus.set('all');
    this.loadDepartments();
  }

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

  openCreateModal(): void {
    this.createForm.reset({
      departmentName: '',
      departmentHeadEmployeeId: '',
    });
    this.dropdownSearchText.set('');
    this.dropdownPage.set(1);
    this.dropdownHasMore.set(true);
    this.eligibleHeads.set([]);
    this.isDropdownOpen.set(false);
    this.isCreateModalOpen.set(true);
  }

  closeCreateModal(): void {
    if (this.isCreateModalOpen() && this.createForm.dirty) {
      if (confirm('You have unsaved changes in the creation form. Are you sure you want to discard them?')) {
        this.createForm.reset();
        this.isCreateModalOpen.set(false);
      }
    } else {
      this.isCreateModalOpen.set(false);
    }
  }

  hasUnsavedChanges(): boolean {
    return this.isCreateModalOpen() && this.createForm.dirty;
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
        this.createForm.reset();
        this.closeCreateModal();
        this.loadDepartments();
      },
      error: (err) => {
        const message = err?.error?.message || err?.error || 'Failed to create department.';
        this.toast.error(message);
        this.isActionLoading.set(false);
      },
    });
  }

  openEditModal(dept: DepartmentDto): void {
    this.selectedDept.set(dept);
    this.editForm.reset({
      departmentName: dept.departmentName,
      departmentHeadEmployeeId: dept.departmentHeadEmployeeId || '',
      isActive: dept.isActive,
    });
    this.dropdownSearchText.set('');
    this.dropdownPage.set(1);
    this.dropdownHasMore.set(true);
    this.eligibleHeads.set([]);
    this.isDropdownOpen.set(false);
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
      },
      error: (err) => {
        const message = err?.error?.message || err?.error || 'Failed to update department.';
        this.toast.error(message);
        this.isActionLoading.set(false);
      },
    });
  }

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
