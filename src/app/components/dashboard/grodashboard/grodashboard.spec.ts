import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { Grodashboard } from './grodashboard';
import { AnalyticsService } from '../../../services/analytics.service';
import { ToastService } from '../../../shared/services/toast.service';

describe('Grodashboard', () => {
  let component: Grodashboard;
  let fixture: ComponentFixture<Grodashboard>;

  const analyticsServiceMock = {
    getGroDashboard: vi.fn().mockReturnValue(of({
      assignedToMe: 0, inProgressByMe: 0, resolvedByMe: 0,
      escalatedByMe: 0, overdueAssignedToMe: 0, avgResolutionHours: null
    })),
    getMyDashboard: vi.fn().mockReturnValue(of({
      totalRaised: 0, openComplaints: 0, resolvedComplaints: 0,
      closedComplaints: 0, rejectedComplaints: 0, externallyEscalatedComplaints: 0,
      avgResolutionHours: null, statusBreakdown: []
    })),
    getStatusDistribution: vi.fn().mockReturnValue(of([]))
  };

  const toastServiceMock = {
    error: vi.fn(),
    success: vi.fn()
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Grodashboard],
      providers: [
        provideRouter([]),
        { provide: AnalyticsService, useValue: analyticsServiceMock },
        { provide: ToastService, useValue: toastServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Grodashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
