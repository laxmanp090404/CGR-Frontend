import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { ComplaintService } from '../../../../services/complaint.service';
import { LookupService, CategoryDto, DepartmentLookupDto } from '../../../../services/lookup.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { DashboardShellComponent, NavItem } from '../../../../shared/components/dashboard-shell/dashboard-shell';

@Component({
  selector: 'app-raise-complaint',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, DashboardShellComponent],
  templateUrl: './raise-complaint.html',
  styleUrl: './raise-complaint.scss',
})
export class RaiseComplaintComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly complaintService = inject(ComplaintService);
  private readonly lookupService = inject(LookupService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly isLoading = signal(false);
  readonly departments = signal<DepartmentLookupDto[]>([]);
  readonly categories = signal<CategoryDto[]>([]);
  readonly selectedDeptId = signal<number | null>(null);
  readonly selectedFiles = signal<File[]>([]);
  readonly isDragOver = signal<boolean>(false);

  readonly form: FormGroup = this.fb.group({
    complaintTitle: ['', [Validators.required, Validators.maxLength(250)]],
    departmentId: ['', [Validators.required]],
    categoryId: ['', [Validators.required]],
    complaintDescription: ['', [Validators.required]],
  });

  readonly navItems = signal<NavItem[]>([
    { label: 'Dashboard', route: '/dept-head/dashboard', icon: 'dashboard' },
    { label: 'Raise a Complaint', route: '/dept-head/raise-complaint', icon: 'raise' },
    { label: 'My Filed Complaints', route: '/dept-head/my-filed-complaints', icon: 'requests' },
    { label: 'Department Complaints', route: '/dept-head/department-complaints', icon: 'departments' },
    { label: 'My Work Queue', route: '/dept-head/my-work-queue', icon: 'work-queue' },
  ]);

  readonly filteredCategories = computed(() => {
    const deptId = this.selectedDeptId();
    const allCats = this.categories();
    if (!deptId) return [];
    return allCats.filter((c) => c.departmentId === deptId);
  });

  get complaintTitle() { return this.form.get('complaintTitle')!; }
  get departmentId() { return this.form.get('departmentId')!; }
  get categoryId() { return this.form.get('categoryId')!; }
  get complaintDescription() { return this.form.get('complaintDescription')!; }

  ngOnInit(): void {
    this.lookupService.getDepartments(true).subscribe({
      next: (list) => this.departments.set(list),
      error: () => this.toast.error('Failed to load active departments.'),
    });

    this.lookupService.getCategories(true).subscribe({
      next: (list) => this.categories.set(list),
      error: () => this.toast.error('Failed to load active categories.'),
    });

    // Listen to department changes to filter categories reactively and reset selection
    this.form.get('departmentId')?.valueChanges.subscribe((val) => {
      this.selectedDeptId.set(val ? Number(val) : null);
      this.form.get('categoryId')?.setValue('');
    });
  }

  validateAndAddFiles(filesList: File[]): void {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png'];

    const validated: File[] = [];
    let hasInvalid = false;

    filesList.forEach((file) => {
      const mimeType = file.type.toLowerCase();
      const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

      const isValidMime = allowedMimeTypes.includes(mimeType);
      const isValidExt = allowedExtensions.includes(extension);

      // Verify that it is not webp or gif since user requested to exclude them explicitly
      const isForbiddenWebpOrGif = mimeType.includes('webp') || mimeType.includes('gif') || extension === '.webp' || extension === '.gif';

      if ((isValidMime || isValidExt) && !isForbiddenWebpOrGif) {
        validated.push(file);
      } else {
        hasInvalid = true;
      }
    });

    if (hasInvalid) {
      this.toast.error('Only PDF, JPG, JPEG, and PNG files are allowed.');
    }

    if (validated.length > 0) {
      this.selectedFiles.update((existing) => [...existing, ...validated]);
    }
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.validateAndAddFiles(Array.from(input.files));
      input.value = ''; // Reset file input so same file can be re-selected
    }
  }

  removeFile(index: number): void {
    this.selectedFiles.update((files) => files.filter((_, i) => i !== index));
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);

    if (event.dataTransfer && event.dataTransfer.files) {
      this.validateAndAddFiles(Array.from(event.dataTransfer.files));
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);

    const title = this.complaintTitle.value.trim();
    const description = this.complaintDescription.value.trim();
    const catId = Number(this.categoryId.value);
    const attachments = this.selectedFiles();

    this.complaintService.createComplaint(title, description, catId, attachments).subscribe({
      next: () => {
        this.toast.success('Complaint filed successfully!');
        this.isLoading.set(false);
        this.router.navigate(['/dept-head/dashboard']);
      },
      error: (err) => {
        const errorMsg = err?.error?.message || 'Failed to file complaint. Please try again.';
        this.toast.error(errorMsg);
        this.isLoading.set(false);
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/dept-head/dashboard']);
  }
}
