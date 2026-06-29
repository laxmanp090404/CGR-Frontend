import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { baseUrl } from '../../environment';
import { DepartmentDto, CreateDepartmentDto, UpdateDepartmentDto } from '../models/department.model';

@Injectable({ providedIn: 'root' })
export class DepartmentApiService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = `${baseUrl}/api/department`;

  /** GET /api/department?isActive=true */
  getActiveDepartments(): Observable<DepartmentDto[]> {
    return this.http.get<DepartmentDto[]>(`${this.apiBase}?isActive=true`);
  }

  getDepartments(isActive?: boolean | null): Observable<DepartmentDto[]> {
    let params = new HttpParams();
    if (isActive !== undefined && isActive !== null) {
      params = params.set('isActive', String(isActive));
    }
    return this.http.get<DepartmentDto[]>(this.apiBase, { params });
  }

  getDepartmentById(departmentId: number): Observable<DepartmentDto> {
    return this.http.get<DepartmentDto>(`${this.apiBase}/${departmentId}`);
  }

  createDepartment(dto: CreateDepartmentDto): Observable<DepartmentDto> {
    return this.http.post<DepartmentDto>(this.apiBase, dto);
  }

  updateDepartment(departmentId: number, dto: UpdateDepartmentDto): Observable<DepartmentDto> {
    return this.http.put<DepartmentDto>(`${this.apiBase}/${departmentId}`, dto);
  }
}
