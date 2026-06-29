export interface DepartmentDto {
  departmentId: number;
  departmentName: string;
  departmentHeadEmployeeId?: number;
  departmentHeadEmployeeName?: string;
  isActive: boolean;
  createdAt: string;
}

export interface CreateDepartmentDto {
  departmentName: string;
  departmentHeadEmployeeId?: number | null;
}

export interface UpdateDepartmentDto {
  departmentName: string;
  departmentHeadEmployeeId?: number | null;
  isActive: boolean;
}
