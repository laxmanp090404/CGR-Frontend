import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { Signup } from './signup';
import { AuthApiService } from '../../../services/auth.api.service';
import { DepartmentApiService } from '../../../services/department.api.service';
import { ToastService } from '../../../shared/services/toast.service';
import { RegisterResponse } from '../../../models/auth.model';

describe('Signup Component', () => {
  let component: Signup;
  let fixture: ComponentFixture<Signup>;

  const authServiceMock = {
    register: vi.fn(),
  };

  const departmentServiceMock = {
    getActiveDepartments: vi.fn(),
  };

  const toastServiceMock = {
    success: vi.fn(),
    error: vi.fn(),
  };

  const routerMock = {
    navigate: vi.fn(),
  };

  const mockDepartments = [
    { departmentId: 1, departmentName: 'Engineering', isActive: true, createdAt: '' },
    { departmentId: 2, departmentName: 'HR', isActive: true, createdAt: '' },
  ];

  beforeEach(async () => {
    authServiceMock.register.mockReset();
    departmentServiceMock.getActiveDepartments.mockReset();
    toastServiceMock.success.mockReset();
    toastServiceMock.error.mockReset();
    routerMock.navigate.mockReset();

    departmentServiceMock.getActiveDepartments.mockReturnValue(of(mockDepartments));

    await TestBed.configureTestingModule({
      imports: [Signup],
      providers: [
        { provide: AuthApiService, useValue: authServiceMock },
        { provide: DepartmentApiService, useValue: departmentServiceMock },
        { provide: ToastService, useValue: toastServiceMock },
        { provide: Router, useValue: routerMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Signup);
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
    expect(component.departments()).toEqual(mockDepartments);
    expect(component.form.value).toEqual({
      employeeName: '',
      email: '',
      mobileNumber: '',
      password: '',
      role: 'EMPLOYEE',
      departmentId: '',
    });
  });

  // 3. Form validation
  it('should validate form fields correctly', () => {
    // Empty form is invalid
    expect(component.form.valid).toBe(false);
    expect(component.employeeName.hasError('required')).toBe(true);
    expect(component.email.hasError('required')).toBe(true);
    expect(component.mobileNumber.hasError('required')).toBe(true);
    expect(component.password.hasError('required')).toBe(true);

    // Invalid format states
    component.employeeName.setValue('A');
    component.email.setValue('invalid-email');
    component.mobileNumber.setValue('12345');
    component.password.setValue('12345');
    expect(component.form.valid).toBe(false);
    expect(component.employeeName.hasError('minlength')).toBe(true);
    expect(component.email.hasError('email')).toBe(true);
    expect(component.mobileNumber.hasError('pattern')).toBe(true);
    expect(component.password.hasError('minlength')).toBe(true);

    // Valid inputs (employee role, department is optional)
    component.employeeName.setValue('Jane Smith');
    component.email.setValue('jane@company.com');
    component.mobileNumber.setValue('9876543210');
    component.password.setValue('secure123');
    component.departmentId.setValue('');
    expect(component.form.valid).toBe(true);
  });

  it('should require departmentId if role is GRO and be optional if role is EMPLOYEE', () => {
    component.employeeName.setValue('Jane Smith');
    component.email.setValue('jane@company.com');
    component.mobileNumber.setValue('9876543210');
    component.password.setValue('secure123');
    
    // Default is EMPLOYEE: optional
    component.departmentId.setValue('');
    expect(component.form.valid).toBe(true);

    // Switch to GRO: required
    const groRadio = fixture.debugElement.query(By.css('#role-gro')).nativeElement;
    groRadio.click();
    fixture.detectChanges();

    expect(component.form.valid).toBe(false);
    expect(component.departmentId.hasError('required')).toBe(true);

    // Fill departmentId: valid
    component.departmentId.setValue('1');
    fixture.detectChanges();
    expect(component.form.valid).toBe(true);

    // Switch back to EMPLOYEE: optional again
    const employeeRadio = fixture.debugElement.query(By.css('#role-employee')).nativeElement;
    employeeRadio.click();
    fixture.detectChanges();

    component.departmentId.setValue('');
    fixture.detectChanges();
    expect(component.form.valid).toBe(true);
  });

  // 4. User interactions (click, input, submit)
  it('should toggle password field type on click', () => {
    const passwordInput = fixture.debugElement.query(By.css('#signup-password')).nativeElement;
    const toggleBtn = fixture.debugElement.query(By.css('#signup-password-toggle'));

    expect(passwordInput.type).toBe('password');

    toggleBtn.triggerEventHandler('click', null);
    fixture.detectChanges();

    expect(component.showPassword()).toBe(true);
    expect(passwordInput.type).toBe('text');
  });

  it('should update role when selecting a radio card', () => {
    const employeeRadio = fixture.debugElement.query(By.css('#role-employee')).nativeElement;
    const groRadio = fixture.debugElement.query(By.css('#role-gro')).nativeElement;

    expect(component.role.value).toBe('EMPLOYEE');

    groRadio.click();
    fixture.detectChanges();
    expect(component.role.value).toBe('GRO');

    employeeRadio.click();
    fixture.detectChanges();
    expect(component.role.value).toBe('EMPLOYEE');
  });

  it('should not call auth service if form is invalid on submit', () => {
    component.onSubmit();
    expect(component.employeeName.touched).toBe(true);
    expect(component.email.touched).toBe(true);
    expect(component.mobileNumber.touched).toBe(true);
    expect(component.password.touched).toBe(true);
    expect(authServiceMock.register).not.toHaveBeenCalled();
  });

  // 5. Service calls and responses & 7. Error and loading states
  it('should handle successful registration by storing session, showing toast, and navigating (Employee)', () => {
    const mockResponse: RegisterResponse = {
      token: 'jwt-token-xyz',
      employeeName: 'Jane Smith',
      role: 'EMPLOYEE',
      employeeId: 101,
    };
    authServiceMock.register.mockReturnValue(of(mockResponse));

    component.form.setValue({
      employeeName: 'Jane Smith',
      email: 'jane@company.com',
      mobileNumber: '9876543210',
      password: 'password123',
      role: 'EMPLOYEE',
      departmentId: '',
    });

    component.onSubmit();

    expect(authServiceMock.register).toHaveBeenCalledWith({
      employeeName: 'Jane Smith',
      email: 'jane@company.com',
      mobileNumber: '9876543210',
      password: 'password123',
      requestGroRole: false,
      departmentId: undefined,
    });

    fixture.detectChanges();

    expect(component.isLoading()).toBe(false);
    expect(toastServiceMock.success).toHaveBeenCalledWith('Account created! Welcome, Jane Smith.');
    expect(routerMock.navigate).toHaveBeenCalledWith(['/employee/dashboard']);
  });

  it('should handle successful registration by requesting GRO role correctly with departmentId', () => {
    const mockResponse: RegisterResponse = {
      token: 'jwt-token-abc',
      employeeName: 'Officer Bob',
      role: 'GRO',
      employeeId: 202,
    };
    authServiceMock.register.mockReturnValue(of(mockResponse));

    component.form.setValue({
      employeeName: 'Officer Bob',
      email: 'bob@company.com',
      mobileNumber: '1234567890',
      password: 'password12345',
      role: 'GRO',
      departmentId: '2',
    });

    component.onSubmit();

    expect(authServiceMock.register).toHaveBeenCalledWith({
      employeeName: 'Officer Bob',
      email: 'bob@company.com',
      mobileNumber: '1234567890',
      password: 'password12345',
      requestGroRole: true,
      departmentId: 2,
    });

    fixture.detectChanges();

    expect(routerMock.navigate).toHaveBeenCalledWith(['/gro/dashboard']);
  });

  it('should handle failed registration by displaying API error and disabling loading', () => {
    const errorResponse = new HttpErrorResponse({
      error: { message: 'An account with this email already exists.' },
      status: 409,
      statusText: 'Conflict',
    });
    authServiceMock.register.mockReturnValue(throwError(() => errorResponse));

    component.form.setValue({
      employeeName: 'Duplicated User',
      email: 'duplicate@company.com',
      mobileNumber: '1234567890',
      password: 'password123',
      role: 'EMPLOYEE',
      departmentId: '',
    });

    component.onSubmit();

    fixture.detectChanges();

    expect(component.isLoading()).toBe(false);
    expect(component.apiError()).toBe('An account with this email already exists.');
    expect(toastServiceMock.success).not.toHaveBeenCalled();
    expect(routerMock.navigate).not.toHaveBeenCalled();
  });

  // 6. Conditional UI rendering
  it('should conditionally render API error banner', () => {
    let banner = fixture.debugElement.query(By.css('#signup-api-error'));
    expect(banner).toBeNull();

    component.apiError.set('Conflict error occurred.');
    fixture.detectChanges();

    banner = fixture.debugElement.query(By.css('#signup-api-error'));
    expect(banner).toBeTruthy();
    expect(banner.nativeElement.textContent).toContain('Conflict error occurred.');
  });

  it('should conditionally apply selection class to role options', () => {
    const options = fixture.debugElement.queryAll(By.css('.role-option'));
    expect(options.length).toBe(2);

    // Initial state: first option (Employee) is selected
    expect(options[0].nativeElement.classList.contains('role-option--selected')).toBe(true);
    expect(options[1].nativeElement.classList.contains('role-option--selected')).toBe(false);

    // Set role to GRO by clicking the radio card
    const groRadio = fixture.debugElement.query(By.css('#role-gro')).nativeElement;
    groRadio.click();
    fixture.detectChanges();

    expect(options[0].nativeElement.classList.contains('role-option--selected')).toBe(false);
    expect(options[1].nativeElement.classList.contains('role-option--selected')).toBe(true);
  });
});
