import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { baseUrl } from '../../environment';
import { ComplaintDashboardDto, ComplaintCommentDto, CreateComplaintCommentDto, PagedResultDto } from '../models/complaint.model';

@Injectable({ providedIn: 'root' })
export class ComplaintService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = `${baseUrl}/api/Complaint`;

  getPagedComplaints(
    page = 1,
    pageSize = 10,
    statusId?: number | null,
    priorityId?: number | null,
    categoryId?: number | null,
    departmentId?: number | null,
    search?: string | null,
    raisedByMe?: boolean | null,
    sortBy?: string | null,
    handledByMe?: boolean | null
  ): Observable<PagedResultDto<ComplaintDashboardDto>> {
    const params: Record<string, string> = {
      page: String(page),
      pageSize: String(pageSize),
    };
    if (statusId != null) params['statusId'] = String(statusId);
    if (priorityId != null) params['priorityId'] = String(priorityId);
    if (categoryId != null) params['categoryId'] = String(categoryId);
    if (departmentId != null) params['departmentId'] = String(departmentId);
    if (search) params['search'] = search;
    if (raisedByMe != null) params['raisedByMe'] = String(raisedByMe);
    if (sortBy) params['sortBy'] = sortBy;
    if (handledByMe != null) params['handledByMe'] = String(handledByMe);

    return this.http.get<PagedResultDto<ComplaintDashboardDto>>(this.apiBase, { params });
  }

  getMyWorkQueue(
    page = 1,
    pageSize = 10,
    statusId?: number | null,
    priorityId?: number | null,
    categoryId?: number | null,
    departmentId?: number | null,
    search?: string | null,
    sortBy?: string | null
  ): Observable<PagedResultDto<ComplaintDashboardDto>> {
    const params: Record<string, string> = {
      page: String(page),
      pageSize: String(pageSize),
    };
    if (statusId != null) params['statusId'] = String(statusId);
    if (priorityId != null) params['priorityId'] = String(priorityId);
    if (categoryId != null) params['categoryId'] = String(categoryId);
    if (departmentId != null) params['departmentId'] = String(departmentId);
    if (search) params['search'] = search;
    if (sortBy) params['sortBy'] = sortBy;

    return this.http.get<PagedResultDto<ComplaintDashboardDto>>(`${this.apiBase}/my-work-queue`, { params });
  }

  createComplaint(
    title: string,
    description: string,
    categoryId: number,
    attachments?: File[]
  ): Observable<any> {
    const formData = new FormData();
    formData.append('complaintTitle', title);
    formData.append('complaintDescription', description);
    formData.append('categoryId', String(categoryId));
    if (attachments && attachments.length > 0) {
      attachments.forEach((file) => {
        formData.append('attachments', file, file.name);
      });
    }
    return this.http.post(this.apiBase, formData);
  }

  getComplaintById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiBase}/${id}`);
  }

  getComplaintHistory(id: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiBase}/${id}/history`);
  }

  getComplaintEscalations(id: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiBase}/${id}/escalations`);
  }

  getAttachmentBlob(filePath: string): Observable<Blob> {
    return this.http.get(`${this.apiBase}/attachments`, {
      params: { filePath },
      responseType: 'blob'
    });
  }

  getComments(complaintId: number): Observable<ComplaintCommentDto[]> {
    return this.http.get<ComplaintCommentDto[]>(
      `${baseUrl}/api/ComplaintComment/complaint/${complaintId}`
    );
  }

  addComment(complaintId: number, dto: CreateComplaintCommentDto): Observable<ComplaintCommentDto> {
    return this.http.post<ComplaintCommentDto>(
      `${baseUrl}/api/ComplaintComment/complaint/${complaintId}`,
      dto
    );
  }

  
  startProgress(complaintId: number): Observable<void> {
    return this.http.put<void>(`${this.apiBase}/${complaintId}/start-progress`, {});
  }

  resolveComplaint(complaintId: number, resolutionRemarks: string): Observable<void> {
    return this.http.put<void>(`${this.apiBase}/${complaintId}/resolve`, { resolutionRemarks });
  }

  closeComplaint(complaintId: number, remarks: string): Observable<void> {
    return this.http.put<void>(`${this.apiBase}/${complaintId}/close`, { remarks });
  }

  reopenComplaint(complaintId: number, reopenRemarks: string): Observable<void> {
    return this.http.put<void>(`${this.apiBase}/${complaintId}/reopen`, { reopenRemarks });
  }

  escalateComplaint(complaintId: number, remarks: string): Observable<void> {
    return this.http.put<void>(`${this.apiBase}/${complaintId}/escalate`, { remarks });
  }
}
