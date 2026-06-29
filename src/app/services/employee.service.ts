import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { baseUrl } from '../../environment';
import { EmployeeDto, UpdateEmployeeDto } from '../models/employee.model';
import { PagedResultDto } from '../models/complaint.model';

@Injectable({ providedIn: 'root' })
export class EmployeeService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = `${baseUrl}/api/Employee`;

  getEmployees(
    page = 1,
    pageSize = 10,
    isActive?: boolean | null,
    roleId?: number | null,
    departmentId?: number | null,
    search?: string | null
  ): Observable<PagedResultDto<EmployeeDto>> {
    let params = new HttpParams()
      .set('page', String(page))
      .set('pageSize', String(pageSize));

    if (isActive !== undefined && isActive !== null) {
      params = params.set('isActive', String(isActive));
    }
    if (roleId) {
      params = params.set('roleId', String(roleId));
    }
    if (departmentId) {
      params = params.set('departmentId', String(departmentId));
    }
    if (search && search.trim()) {
      params = params.set('search', search.trim());
    }

    return this.http.get<PagedResultDto<EmployeeDto>>(this.apiBase, { params });
  }

  getGroWorkload(departmentId?: number | null): Observable<any[]> {
    let url = `${this.apiBase}/gro-workload`;
    if (departmentId) {
      url += `?departmentId=${departmentId}`;
    }
    return this.http.get<any[]>(url);
  }

  getEmployeeById(employeeId: number): Observable<EmployeeDto> {
    return this.http.get<EmployeeDto>(`${this.apiBase}/${employeeId}`);
  }

  updateEmployee(employeeId: number, dto: UpdateEmployeeDto): Observable<EmployeeDto> {
    return this.http.put<EmployeeDto>(`${this.apiBase}/${employeeId}`, dto);
  }

  deactivateEmployee(employeeId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiBase}/${employeeId}`);
  }

  restoreEmployee(employeeId: number): Observable<void> {
    return this.http.patch<void>(`${this.apiBase}/${employeeId}/restore`, {});
  }
}
