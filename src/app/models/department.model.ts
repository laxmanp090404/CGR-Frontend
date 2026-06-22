export interface DepartmentDto {
  departmentId: number;
  departmentName: string;
  departmentHeadEmployeeId?: number;
  departmentHeadEmployeeName?: string;
  isActive: boolean;
  createdAt: string;
}
