import { Component, inject, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';

import { AuthApiService } from '../../../services/auth.api.service';
import { DepartmentApiService } from '../../../services/department.api.service';
import { ToastService } from '../../../shared/services/toast.service';
import { ROLE_DASHBOARD_ROUTE } from '../../../models/auth.model';
import { DepartmentDto } from '../../../models/department.model';
import { catchAuthError } from '../../../rxjs/auth.operator';

@Component({
  selector: 'app-signup',
  imports: [ReactiveFormsModule],
  templateUrl: './signup.html',
  styleUrl: './signup.scss',
})
export class Signup {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthApiService);
  private readonly departmentService = inject(DepartmentApiService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  // ── State signals ────────────────────────────────────────────
  readonly isLoading = signal(false);
  readonly apiError = signal<string | null>(null);
  readonly showPassword = signal(false);
  readonly departments = signal<DepartmentDto[]>([]);

  // ── Form ─────────────────────────────────────────────────────
  readonly form: FormGroup = this.fb.group({
    employeeName: ['', [Validators.required, Validators.minLength(2)]],
    email:        ['', [Validators.required, Validators.email]],
    mobileNumber: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
    password:     ['', [Validators.required, Validators.minLength(6)]],
    role:         ['EMPLOYEE', [Validators.required]],
    departmentId: [''],
  });

  get employeeName() { return this.form.get('employeeName')!; }
  get email()        { return this.form.get('email')!; }
  get mobileNumber() { return this.form.get('mobileNumber')!; }
  get password()     { return this.form.get('password')!; }
  get role()         { return this.form.get('role')!; }
  get departmentId() { return this.form.get('departmentId')!; }

  constructor() {
    // Fetch departments
    this.departmentService.getActiveDepartments().subscribe({
      next: (list) => this.departments.set(list),
      error: () => this.toast.error('Failed to load departments. Please reload.'),
    });

    // Listen for role changes to update validation
    this.role.valueChanges.subscribe((role) => {
      const deptCtrl = this.departmentId;
      if (role === 'GRO') {
        deptCtrl.setValidators([Validators.required]);
      } else {
        deptCtrl.clearValidators();
      }
      deptCtrl.updateValueAndValidity();
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword.update((v) => !v);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.apiError.set(null);

    const requestGroRole = this.role.value === 'GRO';
    const departmentIdValue = this.departmentId.value ? Number(this.departmentId.value) : undefined;

    this.authService
      .register({
        employeeName:   this.employeeName.value.trim(),
        email:          this.email.value.trim(),
        mobileNumber:   this.mobileNumber.value.trim(),
        password:       this.password.value,
        requestGroRole,
        departmentId:   departmentIdValue,
      })
      .pipe(catchAuthError())
      .subscribe({
        next: (res) => {
          this.isLoading.set(false);
          this.toast.success('Account created! Welcome, ' + res.employeeName + '.');
          this.router.navigate([ROLE_DASHBOARD_ROUTE[res.role]]);
        },
        error: (msg: string) => {
          this.apiError.set(msg);
          this.isLoading.set(false);
        },
      });
  }
}
