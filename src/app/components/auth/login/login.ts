import { Component, inject, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';

import { AuthApiService } from '../../../services/auth.api.service';
import { ToastService } from '../../../shared/services/toast.service';
import { ROLE_DASHBOARD_ROUTE } from '../../../models/auth.model';
import { catchAuthError } from '../../../rxjs/auth.operator';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthApiService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  // ── State signals ────────────────────────────────────────────
  readonly isLoading = signal(false);
  readonly apiError = signal<string | null>(null);
  readonly showPassword = signal(false);

  // ── Form ─────────────────────────────────────────────────────
  readonly form: FormGroup = this.fb.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  get email() { return this.form.get('email')!; }
  get password() { return this.form.get('password')!; }

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

    this.authService
      .login({ email: this.email.value.trim(), password: this.password.value })
      .pipe(catchAuthError())
      .subscribe({
        next: (res) => {
          this.isLoading.set(false);
          this.toast.success(`Welcome back, ${res.employeeName}!`);
          this.router.navigate([ROLE_DASHBOARD_ROUTE[res.role]]);
        },
        error: (msg: string) => {
          this.apiError.set(msg);
          this.isLoading.set(false);
        },
      });
  }
}
