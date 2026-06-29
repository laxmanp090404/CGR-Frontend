import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { baseUrl } from '../../environment';
import { PagedResultDto } from '../models/complaint.model';
import {
  RoleRequestDto,
  CreateRoleRequestDto,
  ApproveRoleRequestDto,
  RejectRoleRequestDto,
  ManualRoleChangeDto,
} from '../models/role-request.model';

@Injectable({ providedIn: 'root' })
export class RoleRequestService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = `${baseUrl}/api/RoleRequests`;

  getMyRequests(): Observable<RoleRequestDto[]> {
    return this.http.get<RoleRequestDto[]>(`${this.apiBase}/my`);
  }

  getPagedRequests(
    page = 1,
    pageSize = 20,
    statusId?: number | null
  ): Observable<PagedResultDto<RoleRequestDto>> {
    let params = new HttpParams()
      .set('page', String(page))
      .set('pageSize', String(pageSize));

    if (statusId != null) {
      params = params.set('statusId', String(statusId));
    }

    return this.http.get<PagedResultDto<RoleRequestDto>>(this.apiBase, { params });
  }

  /** Employee — submit a role upgrade request */
  createRoleRequest(dto: CreateRoleRequestDto): Observable<RoleRequestDto> {
    return this.http.post<RoleRequestDto>(this.apiBase, dto);
  }

  /** Admin — approve a pending role request */
  approveRoleRequest(id: number, dto: ApproveRoleRequestDto): Observable<RoleRequestDto> {
    return this.http.put<RoleRequestDto>(`${this.apiBase}/${id}/approve`, dto);
  }

  /** Admin — reject a pending role request */
  rejectRoleRequest(id: number, dto: RejectRoleRequestDto): Observable<RoleRequestDto> {
    return this.http.put<RoleRequestDto>(`${this.apiBase}/${id}/reject`, dto);
  }

  /** Admin — directly change an employee's role */
  manualRoleChange(employeeId: number, dto: ManualRoleChangeDto): Observable<RoleRequestDto> {
    return this.http.post<RoleRequestDto>(`${this.apiBase}/manual/${employeeId}`, dto);
  }
}
