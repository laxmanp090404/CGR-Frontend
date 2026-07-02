import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { CategoryService } from '../../services/category.service';
import { DepartmentApiService } from '../../services/department.api.service';
import { LookupService, PriorityDto, DepartmentLookupDto } from '../../services/lookup.service';
import { ToastService } from '../../shared/services/toast.service';
import { DashboardShellComponent, NavItem } from '../../shared/components/dashboard-shell/dashboard-shell';
import { TableSkeletonComponent } from '../../shared/components/table-skeleton/table-skeleton';
import { getNavItems } from '../../shared/components/dashboard-shell/nav-menu';
import { CategoryDto, EscalationRuleEntryDto } from '../../models/category.model';
import { HasUnsavedChanges } from '../../guards/deactivate.guard';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    DashboardShellComponent,
    TableSkeletonComponent,
  ],
  templateUrl: './categories.html',
  styleUrl: './categories.scss',
})
export class CategoriesComponent implements OnInit, HasUnsavedChanges {
  private readonly fb = inject(FormBuilder);
  private readonly categoryService = inject(CategoryService);
  private readonly departmentService = inject(DepartmentApiService);
  private readonly lookupService = inject(LookupService);
  private readonly toast = inject(ToastService);

  readonly navItems = signal<NavItem[]>(getNavItems('ADMIN'));

 
  readonly isLoading = signal(true);
  readonly isActionLoading = signal(false);
  readonly categories = signal<CategoryDto[]>([]);
  readonly totalCount = signal(0);
  readonly totalPages = signal(0);
  readonly currentPage = signal(1);
  readonly pageSize = signal<number>(10);
  readonly isCustomPageSize = signal<boolean>(false);
  readonly pageSizeDropdownValue = signal<string>('10');
  readonly localPageSize = signal<number>(10);

  readonly activeStatus = signal<string>('all');
  readonly selectedDeptId = signal<number | null>(null);

  readonly departments = signal<DepartmentLookupDto[]>([]);
  readonly priorities = signal<PriorityDto[]>([]);


  readonly isCreateModalOpen = signal(false);
  readonly isEditModalOpen = signal(false);
  readonly isViewModalOpen = signal(false);
  readonly selectedCategory = signal<CategoryDto | null>(null);

 
  readonly validationErrorMsg = signal<string | null>(null);

  readonly createForm: FormGroup = this.fb.group({
    categoryName: ['', [Validators.required, Validators.maxLength(100)]],
    departmentId: ['', [Validators.required]],
    defaultPriorityId: [1, [Validators.required]],
    slaHours: [24, [Validators.required, Validators.min(1), Validators.max(360)]],
    escalationRules: this.fb.array([]),
  });

  readonly editForm: FormGroup = this.fb.group({
    categoryName: ['', [Validators.required, Validators.maxLength(100)]],
    departmentId: ['', [Validators.required]],
    defaultPriorityId: [1, [Validators.required]],
    slaHours: [24, [Validators.required, Validators.min(1), Validators.max(360)]],
    isActive: [true, [Validators.required]],
    escalationRules: this.fb.array([]),
  });

  get createName() { return this.createForm.get('categoryName')!; }
  get createDept() { return this.createForm.get('departmentId')!; }
  get createPriority() { return this.createForm.get('defaultPriorityId')!; }
  get createSla() { return this.createForm.get('slaHours')!; }
  get createRules() { return this.createForm.get('escalationRules') as FormArray; }

  get editName() { return this.editForm.get('categoryName')!; }
  get editDept() { return this.editForm.get('departmentId')!; }
  get editPriority() { return this.editForm.get('defaultPriorityId')!; }
  get editSla() { return this.editForm.get('slaHours')!; }
  get editIsActive() { return this.editForm.get('isActive')!; }
  get editRules() { return this.editForm.get('escalationRules') as FormArray; }

  ngOnInit(): void {
    this.loadLookups();
    this.loadCategories();
  }

  loadLookups(): void {
    this.departmentService.getActiveDepartments().subscribe({
      next: (list) => this.departments.set(list),
      error: () => this.toast.error('Failed to load active departments.'),
    });

    this.lookupService.getPriorities().subscribe({
      next: (list) => this.priorities.set(list),
      error: () => this.toast.error('Failed to load priorities.'),
    });
  }

  loadCategories(): void {
    this.isLoading.set(true);

    const isActiveParam =
      this.activeStatus() === 'active'
        ? true
        : this.activeStatus() === 'inactive'
        ? false
        : null;

    this.categoryService
      .getCategories(
        this.currentPage(),
        this.pageSize(),
        isActiveParam,
        this.selectedDeptId()
      )
      .subscribe({
        next: (res) => {
          this.categories.set(res.items);
          this.totalCount.set(res.totalCount);
          this.totalPages.set(Math.ceil(res.totalCount / this.pageSize()));
          this.isLoading.set(false);
        },
        error: () => {
          this.toast.error('Failed to load categories.');
          this.isLoading.set(false);
        },
      });
  }

  onStatusChange(val: string): void {
    this.activeStatus.set(val);
    this.currentPage.set(1);
    this.loadCategories();
  }

  onDeptChange(val: string): void {
    const parsed = val ? Number(val) : null;
    this.selectedDeptId.set(parsed);
    this.currentPage.set(1);
    this.loadCategories();
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
      this.loadCategories();
    }
  }

  onCustomPageSizeChange(value: any): void {
    const size = Number(value);
    if (size && size > 0) {
      this.pageSize.set(size);
      this.currentPage.set(1);
      this.loadCategories();
    }
  }

  resetFilters(): void {
    this.activeStatus.set('all');
    this.selectedDeptId.set(null);
    this.pageSize.set(10);
    this.isCustomPageSize.set(false);
    this.pageSizeDropdownValue.set('10');
    this.localPageSize.set(10);
    this.currentPage.set(1);
    this.loadCategories();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    this.loadCategories();
  }

  get pages(): number[] {
    const count = this.totalPages();
    const arr: number[] = [];
    for (let i = 1; i <= count; i++) {
      arr.push(i);
    }
    return arr;
  }

  getPriorityName(id: number | string): string {
    const numericId = Number(id);
    const item = this.priorities().find((p) => p.priorityId === numericId);
    return item ? item.priorityName : 'Unknown';
  }

  getPriorityClass(name: string): string {
    if (!name) return 'priority--low';
    const lower = name.toLowerCase();
    if (lower === 'low') return 'priority--low';
    if (lower === 'medium') return 'priority--medium';
    if (lower === 'high') return 'priority--high';
    return 'priority--critical';
  }

  openViewModal(cat: CategoryDto): void {
    this.isActionLoading.set(true);
    this.categoryService.getCategoryById(cat.categoryId).subscribe({
      next: (detailed) => {
        this.selectedCategory.set(detailed);
        this.isViewModalOpen.set(true);
        this.isActionLoading.set(false);
      },
      error: () => {
        this.toast.error('Failed to retrieve category details.');
        this.isActionLoading.set(false);
      },
    });
  }

  closeViewModal(): void {
    this.isViewModalOpen.set(false);
    this.selectedCategory.set(null);
  }

  openCreateModal(): void {
    this.validationErrorMsg.set(null);
    this.createForm.reset({
      categoryName: '',
      departmentId: '',
      defaultPriorityId: 1, // Low
      slaHours: 24,
    });

    // Populate default 8 escalation rules
    this.createRules.clear();
    const defaultHours = [
      { priorityId: 1, escalationLevel: 1, escalateAfterHours: 72 },
      { priorityId: 1, escalationLevel: 2, escalateAfterHours: 48 },
      { priorityId: 2, escalationLevel: 1, escalateAfterHours: 48 },
      { priorityId: 2, escalationLevel: 2, escalateAfterHours: 24 },
      { priorityId: 3, escalationLevel: 1, escalateAfterHours: 24 },
      { priorityId: 3, escalationLevel: 2, escalateAfterHours: 12 },
      { priorityId: 4, escalationLevel: 1, escalateAfterHours: 12 },
      { priorityId: 4, escalationLevel: 2, escalateAfterHours: 6 },
    ];

    defaultHours.forEach((rule) => {
      this.createRules.push(
        this.fb.group({
          priorityId: [rule.priorityId, Validators.required],
          escalationLevel: [rule.escalationLevel, Validators.required],
          escalateAfterHours: [rule.escalateAfterHours, [Validators.required, Validators.min(1)]],
        })
      );
    });

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

    const rules = this.createRules.value;
    const validationError = this.validateEscalationRules(rules);
    if (validationError) {
      this.validationErrorMsg.set(validationError);
      return;
    }
    this.validationErrorMsg.set(null);

    this.isActionLoading.set(true);
    const dto = {
      categoryName: this.createName.value.trim(),
      departmentId: Number(this.createDept.value),
      defaultPriorityId: Number(this.createPriority.value),
      slaHours: Number(this.createSla.value),
      escalationRules: rules,
    };

    this.categoryService.createCategory(dto).subscribe({
      next: (created) => {
        this.toast.success(`Successfully created category ${created.categoryName}`);
        this.isActionLoading.set(false);
        this.createForm.reset();
        this.closeCreateModal();
        this.loadCategories();
      },
      error: (err) => {
        const message = err?.error?.message || err?.error || 'Failed to create category.';
        this.toast.error(message);
        this.isActionLoading.set(false);
      },
    });
  }

  openEditModal(cat: CategoryDto): void {
    this.validationErrorMsg.set(null);
    this.selectedCategory.set(cat);

    this.editForm.reset({
      categoryName: cat.categoryName,
      departmentId: cat.departmentId,
      defaultPriorityId: cat.defaultPriorityId,
      slaHours: cat.slaHours,
      isActive: cat.isActive,
    });

    this.editRules.clear();
    cat.escalationRules.forEach((rule) => {
      this.editRules.push(
        this.fb.group({
          priorityId: [rule.priorityId, Validators.required],
          escalationLevel: [rule.escalationLevel, Validators.required],
          escalateAfterHours: [rule.escalateAfterHours, [Validators.required, Validators.min(1)]],
        })
      );
    });

    this.isEditModalOpen.set(true);
  }

  closeEditModal(): void {
    this.isEditModalOpen.set(false);
    this.selectedCategory.set(null);
  }

  onEditSubmit(): void {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }

    const rules = this.editRules.value;
    const validationError = this.validateEscalationRules(rules);
    if (validationError) {
      this.validationErrorMsg.set(validationError);
      return;
    }
    this.validationErrorMsg.set(null);

    const cat = this.selectedCategory();
    if (!cat) return;

    this.isActionLoading.set(true);
    const dto = {
      categoryName: this.editName.value.trim(),
      departmentId: Number(this.editDept.value),
      defaultPriorityId: Number(this.editPriority.value),
      slaHours: Number(this.editSla.value),
      isActive: this.editIsActive.value === true || String(this.editIsActive.value) === 'true',
      escalationRules: rules,
    };

    this.categoryService.updateCategory(cat.categoryId, dto).subscribe({
      next: (updated) => {
        this.toast.success(`Successfully updated category ${updated.categoryName}`);
        this.isActionLoading.set(false);
        this.closeEditModal();
        this.loadCategories();
      },
      error: (err) => {
        const message = err?.error?.message || err?.error || 'Failed to update category.';
        this.toast.error(message);
        this.isActionLoading.set(false);
      },
    });
  }

  getRuleControlIndex(formType: 'create' | 'edit', priorityId: number, level: number): number {
    const rules = formType === 'create' ? this.createRules : this.editRules;
    return rules.controls.findIndex(
      (ctrl) => Number(ctrl.get('priorityId')?.value) === priorityId && Number(ctrl.get('escalationLevel')?.value) === level
    );
  }

  getRule(rules: EscalationRuleEntryDto[] | undefined, priorityId: number, level: number): EscalationRuleEntryDto | undefined {
    if (!rules) return undefined;
    return rules.find((r) => r.priorityId === priorityId && r.escalationLevel === level);
  }

  private validateEscalationRules(rules: EscalationRuleEntryDto[]): string | null {
    if (!rules || rules.length !== 8) {
      return 'Exactly 8 escalation rules are required.';
    }

    for (const priorityId of [1, 2, 3, 4]) {
      const level1 = rules.find((r) => r.priorityId === priorityId && r.escalationLevel === 1);
      const level2 = rules.find((r) => r.priorityId === priorityId && r.escalationLevel === 2);

      if (!level1 || !level2) {
        return `Escalation levels 1 and 2 must be configured for all priorities.`;
      }

      if (level2.escalateAfterHours >= level1.escalateAfterHours) {
        const priorityName = this.getPriorityName(priorityId);
        return `Level 2 escalation (${level2.escalateAfterHours}h) must be less than Level 1 (${level1.escalateAfterHours}h) for ${priorityName} priority.`;
      }
    }

    return null;
  }
}
