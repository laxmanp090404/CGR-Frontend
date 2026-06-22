import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { Deptheaddashboard } from './deptheaddashboard';
import { AnalyticsService } from '../../../services/analytics.service';
import { ToastService } from '../../../shared/services/toast.service';

describe('Deptheaddashboard', () => {
  let component: Deptheaddashboard;
  let fixture: ComponentFixture<Deptheaddashboard>;

  const analyticsServiceMock = {
    getDepartmentDashboard: vi.fn().mockReturnValue(of([{
      departmentId: 1, departmentName: 'Engineering', totalComplaints: 0,
      openComplaints: 0, overdueComplaints: 0,
      avgResolutionHours: null, slaCompliancePercent: null,
      statusDistribution: []
    }])),
    getMyDashboard: vi.fn().mockReturnValue(of({
      totalRaised: 0, openComplaints: 0, resolvedComplaints: 0,
      closedComplaints: 0, rejectedComplaints: 0, externallyEscalatedComplaints: 0,
      avgResolutionHours: null, statusBreakdown: []
    })),
    getTopCategories: vi.fn().mockReturnValue(of([])),
    getComplaintSummary: vi.fn().mockReturnValue(of({
      totalComplaints: 0, escalatedComplaints: 0, slaBreachedComplaints: 0,
      averageResolutionHours: null, byCategory: [], byDepartment: [], byPriority: []
    }))
  };

  const toastServiceMock = {
    error: vi.fn(),
    success: vi.fn()
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Deptheaddashboard],
      providers: [
        provideRouter([]),
        { provide: AnalyticsService, useValue: analyticsServiceMock },
        { provide: ToastService, useValue: toastServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Deptheaddashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
