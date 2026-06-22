import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { Employeedashboard } from './employeedashboard';
import { AnalyticsService } from '../../../services/analytics.service';
import { ToastService } from '../../../shared/services/toast.service';

describe('Employeedashboard', () => {
  let component: Employeedashboard;
  let fixture: ComponentFixture<Employeedashboard>;

  const analyticsServiceMock = {
    getMyDashboard: vi.fn().mockReturnValue(of({
      totalRaised: 0, openComplaints: 0, resolvedComplaints: 0,
      closedComplaints: 0, rejectedComplaints: 0, externallyEscalatedComplaints: 0,
      avgResolutionHours: null, statusBreakdown: []
    }))
  };

  const toastServiceMock = {
    error: vi.fn(),
    success: vi.fn()
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Employeedashboard],
      providers: [
        provideRouter([]),
        { provide: AnalyticsService, useValue: analyticsServiceMock },
        { provide: ToastService, useValue: toastServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Employeedashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
