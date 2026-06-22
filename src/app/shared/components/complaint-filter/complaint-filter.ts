import { Component, inject, signal, input, output, effect, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { LookupService, PriorityDto, ComplaintStatusDto, CategoryDto, DepartmentLookupDto } from '../../../services/lookup.service';
import { ComplaintFilterParams } from '../../../models/complaint.model';

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
      this.localPageSize.set(this.pageSize() ?? 10);
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
      statusId: this.localStatusId() ? Number(this.localStatusId()) : null,
      priorityId: this.localPriorityId() ? Number(this.localPriorityId()) : null,
      categoryId: this.localCategoryId() ? Number(this.localCategoryId()) : null,
      departmentId: this.localDepartmentId() ? Number(this.localDepartmentId()) : null,
      search: this.localSearch().trim(),
      raisedByMe: this.localRaisedByMe(),
      pageSize: Number(this.localPageSize()),
    });
  }
  onPageSizeChange(value: number | string): void {
  const pageSize = Math.max(1, Number(value) || 1);

  this.localPageSize.set(pageSize);
  this.onFilterChange();
}

  resetFilters(): void {
    this.localSearch.set('');
    this.localStatusId.set(null);
    this.localPriorityId.set(null);
    this.localCategoryId.set(null);
    this.localDepartmentId.set(null);
    this.localRaisedByMe.set(false);
    this.localPageSize.set(10);
    this.onFilterChange();
  }
}
