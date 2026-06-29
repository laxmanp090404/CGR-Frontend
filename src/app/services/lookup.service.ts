import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { baseUrl } from '../../environment';

export interface PriorityDto {
  priorityId: number;
  priorityName: string;
}

export interface ComplaintStatusDto {
  statusId: number;
  statusName: string;
}

export interface CategoryDto {
  categoryId: number;
  categoryName: string;
  departmentId: number;
  isActive: boolean;
}

export interface DepartmentLookupDto {
  departmentId: number;
  departmentName: string;
}

export interface RequestStatusDto {
  requestStatusId: number;
  statusName: string;
}

@Injectable({ providedIn: 'root' })
export class LookupService {
  private readonly http = inject(HttpClient);

  getPriorities(): Observable<PriorityDto[]> {
    return this.http.get<PriorityDto[]>(`${baseUrl}/api/LookUp/priorities`);
  }

  getComplaintStatuses(): Observable<ComplaintStatusDto[]> {
    return this.http.get<ComplaintStatusDto[]>(`${baseUrl}/api/LookUp/complaint-statuses`);
  }

  getCategories(isActive?: boolean): Observable<CategoryDto[]> {
    const params: Record<string, string> = {};
    if (isActive !== undefined) {
      params['isActive'] = String(isActive);
    }
    return this.http.get<CategoryDto[]>(`${baseUrl}/api/Category`, { params });
  }

  getDepartments(isActive?: boolean): Observable<DepartmentLookupDto[]> {
    const params: Record<string, string> = {};
    if (isActive !== undefined) {
      params['isActive'] = String(isActive);
    }
    return this.http.get<DepartmentLookupDto[]>(`${baseUrl}/api/department`, { params });
  }

  getRoles(): Observable<any[]> {
    return this.http.get<any[]>(`${baseUrl}/api/LookUp/roles`);
  }

  getRequestStatuses(): Observable<RequestStatusDto[]> {
    return this.http.get<RequestStatusDto[]>(`${baseUrl}/api/LookUp/request-statuses`);
  }
}
