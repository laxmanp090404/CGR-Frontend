export interface EmployeeDto {
  employeeId: number;
  employeeName: string;
  email: string;
  mobileNumber: string;
  roleId: number;
  roleName: string;
  departmentId?: number | null;
  departmentName?: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface UpdateEmployeeDto {
  employeeName: string;
  email: string;
  mobileNumber: string;
}
