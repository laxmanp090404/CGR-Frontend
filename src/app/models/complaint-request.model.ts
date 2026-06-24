export interface ComplaintRequestDto {
  requestId: number;
  complaintId: number;
  complaintTitle: string | null;
  requestTypeId: number;
  requestTypeName: string;
  requestedBy: number;
  requestedByName: string;
  reviewedBy: number | null;
  reviewedByName: string | null;
  requestStatusId: number;
  requestStatusName: string;
  remarks: string | null;
  createdAt: string;
  reviewedAt: string | null;
}

export interface CreateComplaintRequestDto {
  requestTypeId: number;
  remarks?: string;
}

export interface ReviewComplaintRequestDto {
  approve: boolean;
  remarks?: string;
}
