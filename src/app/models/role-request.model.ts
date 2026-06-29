
export interface RoleRequestDto {
  roleRequestId: number;
  employeeId: number;
  employeeName: string;
  currentRoleId: number;
  currentRoleName: string;
  requestedRoleId: number;
  requestedRoleName: string;
  requestStatusId: number;
  requestStatusName: string;
  reviewedBy?: number | null;
  reviewedByName?: string | null;
  remarks?: string | null;
  createdAt: string;
  reviewedAt?: string | null;
  currentDepartmentName?: string | null;
}

export interface CreateRoleRequestDto {
  requestedRoleId: number;
}

export interface ApproveRoleRequestDto {
  assignDepartmentId?: number | null;
  remarks?: string | null;
}

export interface RejectRoleRequestDto {
  remarks?: string | null;
}

export interface ManualRoleChangeDto {
  targetRoleId: number;
  departmentId?: number | null;
  remarks?: string | null;
}
