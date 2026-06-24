import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { baseUrl } from '../../environment';
import { PagedResultDto } from '../models/complaint.model';
import {
  ComplaintRequestDto,
  CreateComplaintRequestDto,
  ReviewComplaintRequestDto,
} from '../models/complaint-request.model';

@Injectable({ providedIn: 'root' })
export class ComplaintRequestService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = `${baseUrl}/api/complaint-requests`;

  /**
   * Create a rejection request for a complaint.
   * Only GROs and Department Heads can call this, and they must be the current handler.
   */
  createRequest(complaintId: number, remarks: string): Observable<ComplaintRequestDto> {
    const payload: CreateComplaintRequestDto = {
      requestTypeId: 1, // 1 represents Rejection
      remarks: remarks,
    };
    return this.http.post<ComplaintRequestDto>(`${this.apiBase}/complaints/${complaintId}`, payload);
  }

  /**
   * Review a rejection request (Approve or Reject).
   * Only Admin can call this.
   */
  reviewRequest(requestId: number, approve: boolean, remarks?: string): Observable<void> {
    const payload: ReviewComplaintRequestDto = {
      approve,
      remarks,
    };
    return this.http.put<void>(`${this.apiBase}/${requestId}/review`, payload);
  }

  /**
   * Get a paged list of complaint rejection requests.
   * Admin sees all, GRO & Dept Head see only the requests they raised.
   */
  getPagedRequests(
    page = 1,
    pageSize = 10,
    statusId?: number | null
  ): Observable<PagedResultDto<ComplaintRequestDto>> {
    let params = new HttpParams()
      .set('page', String(page))
      .set('pageSize', String(pageSize));

    if (statusId != null) {
      params = params.set('statusId', String(statusId));
    }

    return this.http.get<PagedResultDto<ComplaintRequestDto>>(this.apiBase, { params });
  }
}
