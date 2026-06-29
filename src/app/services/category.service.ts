import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { baseUrl } from '../../environment';
import { CategoryDto, CreateCategoryDto, UpdateCategoryDto } from '../models/category.model';
import { PagedResultDto } from '../models/complaint.model';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = `${baseUrl}/api/Category`;

  getCategories(
    page: number,
    pageSize: number,
    isActive?: boolean | null,
    departmentId?: number | null
  ): Observable<PagedResultDto<CategoryDto>> {
    let params = new HttpParams()
      .set('page', String(page))
      .set('pageSize', String(pageSize));

    if (isActive !== undefined && isActive !== null) {
      params = params.set('isActive', String(isActive));
    }
    if (departmentId) {
      params = params.set('departmentId', String(departmentId));
    }

    return this.http.get<PagedResultDto<CategoryDto>>(this.apiBase, { params });
  }

  getCategoryById(categoryId: number): Observable<CategoryDto> {
    return this.http.get<CategoryDto>(`${this.apiBase}/${categoryId}`);
  }

  createCategory(dto: CreateCategoryDto): Observable<CategoryDto> {
    return this.http.post<CategoryDto>(this.apiBase, dto);
  }

  updateCategory(categoryId: number, dto: UpdateCategoryDto): Observable<CategoryDto> {
    return this.http.put<CategoryDto>(`${this.apiBase}/${categoryId}`, dto);
  }
}
