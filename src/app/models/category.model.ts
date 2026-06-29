export interface EscalationRuleEntryDto {
  priorityId: number;
  escalationLevel: number;
  escalateAfterHours: number;
}

export interface CategoryDto {
  categoryId: number;
  categoryName: string;
  departmentId: number;
  departmentName: string;
  defaultPriorityId: number;
  defaultPriorityName: string;
  slaHours: number;
  isActive: boolean;
  createdAt: string;
  escalationRules: EscalationRuleEntryDto[];
}

export interface CreateCategoryDto {
  categoryName: string;
  departmentId: number;
  defaultPriorityId: number;
  slaHours: number;
  escalationRules: EscalationRuleEntryDto[];
}

export interface UpdateCategoryDto {
  categoryName: string;
  departmentId: number;
  defaultPriorityId: number;
  slaHours: number;
  isActive: boolean;
  escalationRules: EscalationRuleEntryDto[];
}
