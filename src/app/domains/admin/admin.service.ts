import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { APP_ENVIRONMENT, resolveApiRoot } from '@core';

import type { Course } from '../course/course.model';
import type {
  AdminLead,
  AdminSummary,
  CourseUpsert,
  LeadPatch,
  LeadQuery,
  Paged,
  Product,
  ProductUpsert,
} from './admin.model';

/**
 * Cliente da API admin (BE #35). O Bearer é anexado pelo `authInterceptor`.
 * Listas de cursos/produtos usam os GET públicos.
 */
@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly env = inject(APP_ENVIRONMENT);

  private get root(): string {
    return resolveApiRoot(this.env);
  }

  private admin(path: string): string {
    return `${this.root}/admin/${path}`;
  }

  summary(): Observable<AdminSummary> {
    return this.http.get<AdminSummary>(this.admin('summary'));
  }

  leads(query: LeadQuery): Observable<Paged<AdminLead>> {
    let params = new HttpParams().set('page', query.page).set('pageSize', query.pageSize);
    if (query.status) {
      params = params.set('status', query.status);
    }
    return this.http.get<Paged<AdminLead>>(this.admin('leads'), { params });
  }

  lead(id: string): Observable<AdminLead> {
    return this.http.get<AdminLead>(this.admin(`leads/${encodeURIComponent(id)}`));
  }

  updateLead(id: string, patch: LeadPatch): Observable<AdminLead> {
    return this.http.patch<AdminLead>(this.admin(`leads/${encodeURIComponent(id)}`), patch);
  }

  deleteLead(id: string): Observable<void> {
    return this.http.delete<void>(this.admin(`leads/${encodeURIComponent(id)}`));
  }

  courses(): Observable<Course[]> {
    return this.http.get<Course[]>(`${this.root}/courses`);
  }

  createCourse(body: CourseUpsert): Observable<Course> {
    return this.http.post<Course>(this.admin('courses'), body);
  }

  updateCourse(id: string, body: CourseUpsert): Observable<Course> {
    return this.http.put<Course>(this.admin(`courses/${encodeURIComponent(id)}`), body);
  }

  deleteCourse(id: string): Observable<void> {
    return this.http.delete<void>(this.admin(`courses/${encodeURIComponent(id)}`));
  }

  products(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.root}/products`);
  }

  createProduct(body: ProductUpsert): Observable<Product> {
    return this.http.post<Product>(this.admin('products'), body);
  }

  updateProduct(id: string, body: ProductUpsert): Observable<Product> {
    return this.http.put<Product>(this.admin(`products/${encodeURIComponent(id)}`), body);
  }

  deleteProduct(id: string): Observable<void> {
    return this.http.delete<void>(this.admin(`products/${encodeURIComponent(id)}`));
  }
}
