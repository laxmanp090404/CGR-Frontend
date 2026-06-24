export interface PagedResultDto<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ComplaintDashboardDto {
  complaintId: number;
  complaintTitle: string;
  statusName: string;
  priorityName: string;
  categoryName: string;
  departmentName: string;
  createdAt: string;
  raisedByName:string | null;
  currentHandlerName: string | null;
}
export interface CreateComplaintRequest {
  complaintTitle: string;
  complaintDescription: string;
  categoryId: number;
  attachments?: File[];
}
export interface ComplaintFilterParams {
  statusId: number | null;
  priorityId: number | null;
  categoryId: number | null;
  departmentId: number | null;
  search: string;
  raisedByMe: boolean;
  pageSize: number;
}

export interface ComplaintCommentDto {
  commentId: number;
  complaintId: number;
  commentText: string;
  commentedBy: number;
  commentedByName: string;
  isInternal: boolean;
  createdAt: string;
}

export interface CreateComplaintCommentDto {
  commentText: string;
  isInternal: boolean;
}
