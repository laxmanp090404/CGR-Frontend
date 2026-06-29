import { inject, Injectable, signal, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { baseUrl } from '../../environment';
import { TokenStorageService } from './auth.api.service';
import {
  AdminDashboardDto,
  MyDashboardDto,
  GroDashboardDto,
  DepartmentDashboardDto,
  StatusDistributionDto,
  TopCategoryDto,
  ComplaintAnalyticsDto,
} from '../models/analytics.model';

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = `${baseUrl}/api/analytics`;
  private readonly tokenStorage = inject(TokenStorageService);

  readonly pendingComplaintRequests = signal<number | null>(null);
  readonly pendingRoleRequests = signal<number | null>(null);

  constructor() {
    effect(() => {
      const session = this.tokenStorage.session();
      if (!session) {
        this.pendingComplaintRequests.set(null);
        this.pendingRoleRequests.set(null);
      }
    });
  }

  getAdminDashboard(): Observable<AdminDashboardDto> {
    return this.http.get<AdminDashboardDto>(`${this.apiBase}/admin-dashboard`);
  }

  getMyDashboard(): Observable<MyDashboardDto> {
    return this.http.get<MyDashboardDto>(`${this.apiBase}/my-dashboard`);
  }

  getGroDashboard(): Observable<GroDashboardDto> {
    return this.http.get<GroDashboardDto>(`${this.apiBase}/gro-dashboard`);
  }

  getDepartmentDashboard(): Observable<DepartmentDashboardDto[]> {
    return this.http.get<DepartmentDashboardDto[]>(`${this.apiBase}/department-dashboard`);
  }

  getStatusDistribution(): Observable<StatusDistributionDto[]> {
    return this.http.get<StatusDistributionDto[]>(`${this.apiBase}/status-distribution`);
  }

  getTopCategories(n = 5): Observable<TopCategoryDto[]> {
    return this.http.get<TopCategoryDto[]>(`${this.apiBase}/top-categories?n=${n}`);
  }

  getComplaintSummary(): Observable<ComplaintAnalyticsDto> {
    return this.http.get<ComplaintAnalyticsDto>(`${this.apiBase}/complaint-summary`);
  }
}
