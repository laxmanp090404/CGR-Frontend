export interface StatusDistributionDto { 
    statusId: number; 
    statusName: string; 
    count: number;
 }
export interface TopCategoryDto { 
    categoryId: number; 
    categoryName: string; 
    departmentName: string; 
    complaintCount: number; 
}
export interface CategoryBreakdownDto { 
    categoryId: number; 
    categoryName: string; 
    count: number; 
}
export interface DepartmentBreakdownDto { 
    departmentId: number; 
    departmentName: string; 
    count: number; 
}
export interface PriorityBreakdownDto { 
    priorityId: number; 
    priorityName: string; 
    count: number; 
}

export interface AdminDashboardDto {
    totalComplaints: number; openComplaints: number; resolvedComplaints: number;
    closedComplaints: number; rejectedComplaints: number; externallyEscalatedComplaints: number;
    pendingComplaintRequests: number; pendingRoleRequests: number;
    activeEmployees: number; activeDepartments: number; overdueComplaints: number;
    avgResolutionHours: number | null; slaCompliancePercent: number | null;
}
export interface MyDashboardDto {
    totalRaised: number; openComplaints: number; resolvedComplaints: number;
    closedComplaints: number; rejectedComplaints: number; externallyEscalatedComplaints: number;
    avgResolutionHours: number | null; statusBreakdown: StatusDistributionDto[];
}
export interface GroDashboardDto {
    assignedToMe: number; inProgressByMe: number; resolvedByMe: number;
    escalatedByMe: number; overdueAssignedToMe: number; avgResolutionHours: number | null;
}
export interface DepartmentDashboardDto {
    departmentId: number; departmentName: string; totalComplaints: number;
    openComplaints: number; overdueComplaints: number;
    avgResolutionHours: number | null; slaCompliancePercent: number | null;
    statusDistribution: StatusDistributionDto[];
}
export interface ComplaintAnalyticsDto {
    totalComplaints: number; escalatedComplaints: number; slaBreachedComplaints: number;
    averageResolutionHours: number | null;
    byCategory: CategoryBreakdownDto[]; byDepartment: DepartmentBreakdownDto[];
    byPriority: PriorityBreakdownDto[];
}