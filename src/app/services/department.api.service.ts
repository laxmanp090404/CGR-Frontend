import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { baseUrl } from '../../environment';
import { DepartmentDto } from '../models/department.model';

@Injectable({ providedIn: 'root' })
export class DepartmentApiService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = `${baseUrl}/api/department`;

  /** GET /api/department?isActive=true */
  getActiveDepartments(): Observable<DepartmentDto[]> {
    return this.http.get<DepartmentDto[]>(`${this.apiBase}?isActive=true`);
  }
}
