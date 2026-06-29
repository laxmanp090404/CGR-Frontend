import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmployeeService } from '../../services/employee.service';
import { LookupService, DepartmentLookupDto } from '../../services/lookup.service';
import { TokenStorageService } from '../../services/auth.api.service';
import { DashboardShellComponent } from '../../shared/components/dashboard-shell/dashboard-shell';
import { getNavItems } from '../../shared/components/dashboard-shell/nav-menu';

@Component({
  selector: 'app-gro-workload',
  standalone: true,
  imports: [CommonModule, FormsModule, DashboardShellComponent],
  templateUrl: './gro-workload.html',
  styleUrl: './gro-workload.scss'
})
export class GroWorkloadComponent implements OnInit {
  private readonly employeeService = inject(EmployeeService);
  private readonly lookupService = inject(LookupService);
  private readonly tokenStorage = inject(TokenStorageService);

  readonly userRole = signal<string | null>(null);
  readonly navItems = computed(() => {
    const role = this.userRole();
    return role ? getNavItems(role as any) : [];
  });

  // State Signals
  readonly workloads = signal<any[]>([]);
  readonly departments = signal<DepartmentLookupDto[]>([]);
  readonly isLoading = signal(true);
  readonly error = signal<string | null>(null);

  // Filters & Sorting Signals
  readonly searchQuery = signal('');
  readonly selectedDepartmentId = signal<number | null>(null);
  readonly sortBy = signal<string>('workload-desc'); // workload-desc, workload-asc, complaints-desc, name-asc

  // Computed filtered & sorted list
  readonly filteredWorkloads = computed(() => {
    let list = [...this.workloads()];
    const query = this.searchQuery().trim().toLowerCase();
    const deptId = this.selectedDepartmentId();
    const sort = this.sortBy();

    // 1. Filter by search query
    if (query) {
      list = list.filter(w => w.employeeName.toLowerCase().includes(query));
    }

    // 2. Filter by department
    if (deptId) {
      list = list.filter(w => w.departmentId === deptId);
    }

    // 3. Sort
    list.sort((a, b) => {
      switch (sort) {
        case 'workload-desc':
          return b.weightedScore - a.weightedScore;
        case 'workload-asc':
          return a.weightedScore - b.weightedScore;
        case 'complaints-desc':
          return b.activeComplaintCount - a.activeComplaintCount;
        case 'name-asc':
          return a.employeeName.localeCompare(b.employeeName);
        case 'name-desc':
          return b.employeeName.localeCompare(a.employeeName);
        default:
          return 0;
      }
    });

    return list;
  });

  readonly isAdmin = computed(() => this.userRole() === 'ADMIN');

  ngOnInit(): void {
    const role = this.tokenStorage.getRole();
    this.userRole.set(role);
    
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);
    this.error.set(null);

    // If admin, load departments lookup
    if (this.isAdmin()) {
      this.lookupService.getDepartments(true).subscribe({
        next: (depts) => this.departments.set(depts),
        error: () => this.error.set('Failed to load departments lookup.')
      });
    }

    this.employeeService.getGroWorkload().subscribe({
      next: (data) => {
        this.workloads.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'Failed to retrieve GRO workload data.');
        this.isLoading.set(false);
      }
    });
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.selectedDepartmentId.set(null);
    this.sortBy.set('workload-desc');
  }

  getWorkloadClass(score: number): string {
    if (score >= 40) return 'load-heavy';
    if (score >= 15) return 'load-medium';
    return 'load-low';
  }

  getWorkloadLabel(score: number): string {
    if (score >= 40) return 'High Load';
    if (score >= 15) return 'Medium Load';
    return 'Optimal';
  }
}
