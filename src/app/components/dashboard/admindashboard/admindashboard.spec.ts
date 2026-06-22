import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { Admindashboard } from './admindashboard';
import { AnalyticsService } from '../../../services/analytics.service';
import { ToastService } from '../../../shared/services/toast.service';

describe('Admindashboard', () => {
  let component: Admindashboard;
  let fixture: ComponentFixture<Admindashboard>;

  const analyticsServiceMock = {
    getAdminDashboard: vi.fn().mockReturnValue(of({
      totalComplaints: 0, openComplaints: 0, resolvedComplaints: 0,
      closedComplaints: 0, rejectedComplaints: 0, externallyEscalatedComplaints: 0,
      pendingComplaintRequests: 0, pendingRoleRequests: 0,
      activeEmployees: 0, activeDepartments: 0, overdueComplaints: 0,
      avgResolutionHours: null, slaCompliancePercent: null
    })),
    getStatusDistribution: vi.fn().mockReturnValue(of([])),
    getTopCategories: vi.fn().mockReturnValue(of([])),
    getComplaintSummary: vi.fn().mockReturnValue(of({
      totalComplaints: 0, escalatedComplaints: 0, slaBreachedComplaints: 0,
      averageResolutionHours: null, byCategory: [], byDepartment: [], byPriority: []
    })),
    getDepartmentDashboard: vi.fn().mockReturnValue(of([]))
  };

  const toastServiceMock = {
    error: vi.fn(),
    success: vi.fn()
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Admindashboard],
      providers: [
        provideRouter([]),
        { provide: AnalyticsService, useValue: analyticsServiceMock },
        { provide: ToastService, useValue: toastServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Admindashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
