import { Component, inject, signal, input, output, effect, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { LookupService, PriorityDto, ComplaintStatusDto, CategoryDto, DepartmentLookupDto } from '../../../services/lookup.service';
import { ComplaintFilterParams } from '../../../models/complaint.model';

function parseId(val: any): number | null {
  if (val === null || val === undefined || val === 'null' || val === '') return null;
  const num = Number(val);
  return isNaN(num) ? null : num;
}

@Component({
  selector: 'app-complaint-filter',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './complaint-filter.html',
  styleUrl: './complaint-filter.scss',
})
export class ComplaintFilterComponent implements OnInit {
  private readonly lookupService = inject(LookupService);

  // Signal Inputs for Initial/Controlled Values
  readonly statusId = input<number | null>(null);
  readonly priorityId = input<number | null>(null);
  readonly categoryId = input<number | null>(null);
  readonly departmentId = input<number | null>(null);
  readonly search = input<string>('');
  readonly raisedByMe = input<boolean>(false);
  readonly pageSize = input<number>(10);

  // Configuration control inputs
  readonly showDepartmentFilter = input<boolean>(true);
  readonly showRaisedByMeFilter = input<boolean>(true);
  readonly showCategoryFilter = input<boolean>(true);
  readonly disableDepartmentFilter = input<boolean>(false);

  // Output event emitter
  readonly filterChange = output<ComplaintFilterParams>();

  // Local state signals
  readonly localSearch = signal<string>('');
  readonly localStatusId = signal<number | null>(null);
  readonly localPriorityId = signal<number | null>(null);
  readonly localCategoryId = signal<number | null>(null);
  readonly localDepartmentId = signal<number | null>(null);
  readonly localRaisedByMe = signal<boolean>(false);
  readonly localPageSize = signal<number>(10);
  readonly isCustomPageSize = signal<boolean>(false);
  readonly pageSizeDropdownValue = signal<string>('10');

  // Lookup lists data
  readonly priorities = signal<PriorityDto[]>([]);
  readonly statuses = signal<ComplaintStatusDto[]>([]);
  readonly categories = signal<CategoryDto[]>([]);
  readonly departments = signal<DepartmentLookupDto[]>([]);

  // Computed signal to filter categories by selected department
  readonly filteredCategories = computed(() => {
    const deptId = this.localDepartmentId();
    const allCats = this.categories();
    if (!deptId) return allCats;
    return allCats.filter((c) => c.departmentId === Number(deptId));
  });

  constructor() {
    // Sync initial/incoming inputs to local signals
    effect(() => {
      this.localSearch.set(this.search() ?? '');
    });
    effect(() => {
      this.localStatusId.set(this.statusId() ?? null);
    });
    effect(() => {
      this.localPriorityId.set(this.priorityId() ?? null);
    });
    effect(() => {
      this.localCategoryId.set(this.categoryId() ?? null);
    });
    effect(() => {
      this.localDepartmentId.set(this.departmentId() ?? null);
    });
    effect(() => {
      this.localRaisedByMe.set(this.raisedByMe() ?? false);
    });
    effect(() => {
      const size = this.pageSize() ?? 10;
      this.localPageSize.set(size);
      if ([5, 10, 20, 50].includes(size)) {
        this.isCustomPageSize.set(false);
        this.pageSizeDropdownValue.set(String(size));
      } else {
        this.isCustomPageSize.set(true);
        this.pageSizeDropdownValue.set('custom');
      }
    });
  }

  ngOnInit(): void {
    this.lookupService.getPriorities().subscribe({
      next: (list) => this.priorities.set(list),
    });
    this.lookupService.getComplaintStatuses().subscribe({
      next: (list) => this.statuses.set(list),
    });
    this.lookupService.getCategories(true).subscribe({
      next: (list) => this.categories.set(list),
    });
    this.lookupService.getDepartments(true).subscribe({
      next: (list) => this.departments.set(list),
    });
  }

  onFilterChange(): void {
    this.filterChange.emit({
      statusId: parseId(this.localStatusId()),
      priorityId: parseId(this.localPriorityId()),
      categoryId: parseId(this.localCategoryId()),
      departmentId: parseId(this.localDepartmentId()),
      search: this.localSearch().trim(),
      raisedByMe: this.localRaisedByMe(),
      pageSize: Number(this.localPageSize()) || 10,
    });
  }
  onDropdownPageSizeChange(value: string): void {
    this.pageSizeDropdownValue.set(value);
    if (value === 'custom') {
      this.isCustomPageSize.set(true);
    } else {
      this.isCustomPageSize.set(false);
      const size = Number(value);
      this.localPageSize.set(size);
      this.onFilterChange();
    }
  }

  onCustomPageSizeChange(value: any): void {
    const size = Number(value);
    if (size > 0) {
      this.localPageSize.set(size);
      this.onFilterChange();
    }
  }

  resetFilters(): void {
    this.localSearch.set('');
    this.localStatusId.set(null);
    this.localPriorityId.set(null);
    this.localCategoryId.set(null);
    if (!this.disableDepartmentFilter()) {
      this.localDepartmentId.set(null);
    } else {
      this.localDepartmentId.set(this.departmentId() ?? null);
    }
    this.localRaisedByMe.set(false);
    this.isCustomPageSize.set(false);
    this.pageSizeDropdownValue.set('10');
    this.localPageSize.set(10);
    this.onFilterChange();
  }
}
