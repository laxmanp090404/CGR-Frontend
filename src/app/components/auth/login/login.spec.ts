import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { Login } from './login';
import { AuthApiService } from '../../../services/auth.api.service';
import { ToastService } from '../../../shared/services/toast.service';
import { LoginResponse } from '../../../models/auth.model';

describe('Login Component', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;

  const authServiceMock = {
    login: vi.fn(),
  };

  const toastServiceMock = {
    success: vi.fn(),
    error: vi.fn(),
  };

  const routerMock = {
    navigate: vi.fn(),
  };

  beforeEach(async () => {
    authServiceMock.login.mockReset();
    toastServiceMock.success.mockReset();
    toastServiceMock.error.mockReset();
    routerMock.navigate.mockReset();

    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        { provide: AuthApiService, useValue: authServiceMock },
        { provide: ToastService, useValue: toastServiceMock },
        { provide: Router, useValue: routerMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // 1. Component creation
  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  // 2. Initial values/state
  it('should initialize with correct default state', () => {
    expect(component.isLoading()).toBe(false);
    expect(component.apiError()).toBeNull();
    expect(component.showPassword()).toBe(false);
    expect(component.form.value).toEqual({ email: '', password: '' });
  });

  // 3. Form validation
  it('should validate form fields correctly', () => {
    const emailCtrl = component.email;
    const passwordCtrl = component.password;

    // Both fields empty (invalid)
    expect(component.form.valid).toBe(false);
    expect(emailCtrl.hasError('required')).toBe(true);
    expect(passwordCtrl.hasError('required')).toBe(true);

    // Invalid email format and too short password
    emailCtrl.setValue('invalid-email');
    passwordCtrl.setValue('123');
    expect(component.form.valid).toBe(false);
    expect(emailCtrl.hasError('email')).toBe(true);
    expect(passwordCtrl.hasError('minlength')).toBe(true);

    // Valid inputs
    emailCtrl.setValue('jane.smith@company.com');
    passwordCtrl.setValue('secret123');
    expect(component.form.valid).toBe(true);
  });

  // 4. User interactions (click, input, submit)
  it('should toggle password field type on click', () => {
    const passwordInput = fixture.debugElement.query(By.css('#login-password')).nativeElement;
    const toggleBtn = fixture.debugElement.query(By.css('#login-password-toggle'));

    expect(passwordInput.type).toBe('password');

    toggleBtn.triggerEventHandler('click', null);
    fixture.detectChanges();

    expect(component.showPassword()).toBe(true);
    expect(passwordInput.type).toBe('text');
  });

  it('should update control value when user types', () => {
    const emailInput = fixture.debugElement.query(By.css('#login-email')).nativeElement;

    emailInput.value = 'user@company.com';
    emailInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(component.email.value).toBe('user@company.com');
  });

  it('should not call auth service if form is invalid on submit', () => {
    component.onSubmit();
    expect(component.email.touched).toBe(true);
    expect(component.password.touched).toBe(true);
    expect(authServiceMock.login).not.toHaveBeenCalled();
  });

  // 5. Service calls and responses & 7. Error and loading states
  it('should handle successful login by storing session, showing toast, and navigating', () => {
    const mockResponse: LoginResponse = {
      token: 'jwt-token-xyz',
      employeeName: 'Jane Smith',
      role: 'ADMIN',
      employeeId: 42,
    };
    authServiceMock.login.mockReturnValue(of(mockResponse));

    component.form.setValue({
      email: 'jane.smith@company.com',
      password: 'password123',
    });

    component.onSubmit();

    expect(authServiceMock.login).toHaveBeenCalledWith({
      email: 'jane.smith@company.com',
      password: 'password123',
    });

    fixture.detectChanges();

    expect(component.isLoading()).toBe(false);
    expect(toastServiceMock.success).toHaveBeenCalledWith('Welcome back, Jane Smith!');
    expect(routerMock.navigate).toHaveBeenCalledWith(['/admin/dashboard']);
  });

  it('should handle failed login by displaying API error and disabling loading', () => {
    const errorResponse = new HttpErrorResponse({
      error: { message: 'Invalid email or password.' },
      status: 401,
      statusText: 'Unauthorized',
    });
    authServiceMock.login.mockReturnValue(throwError(() => errorResponse));

    component.form.setValue({
      email: 'jane.smith@company.com',
      password: 'wrongpassword',
    });

    component.onSubmit();

    fixture.detectChanges();

    expect(component.isLoading()).toBe(false);
    expect(component.apiError()).toBe('Invalid email or password.');
    expect(toastServiceMock.success).not.toHaveBeenCalled();
    expect(routerMock.navigate).not.toHaveBeenCalled();
  });

  // 6. Conditional UI rendering
  it('should conditionally render API error banner', () => {
    let banner = fixture.debugElement.query(By.css('#login-api-error'));
    expect(banner).toBeNull();

    component.apiError.set('Server is unreachable.');
    fixture.detectChanges();

    banner = fixture.debugElement.query(By.css('#login-api-error'));
    expect(banner).toBeTruthy();
    expect(banner.nativeElement.textContent).toContain('Server is unreachable.');
  });

  it('should show loading spinner and disable submit button during loading', () => {
    let spinner = fixture.debugElement.query(By.css('.spinner'));
    const submitBtn = fixture.debugElement.query(By.css('#login-submit-btn')).nativeElement;

    expect(spinner).toBeNull();
    expect(submitBtn.disabled).toBe(false);

    component.isLoading.set(true);
    fixture.detectChanges();

    spinner = fixture.debugElement.query(By.css('.spinner'));
    expect(spinner).toBeTruthy();
    expect(submitBtn.disabled).toBe(true);
    expect(submitBtn.textContent).toContain('Signing in…');
  });
});
