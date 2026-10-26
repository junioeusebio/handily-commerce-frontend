import type { BnccAxis, Course } from '../course/course.model';

export type LeadStatus = 'Novo' | 'Contatado' | 'Descartado';
export const LEAD_STATUSES: readonly LeadStatus[] = ['Novo', 'Contatado', 'Descartado'];

/** `GET {apiRoot}/admin/summary`. */
export interface AdminSummary {
  leads: { total: number; novo: number; contatado: number; descartado: number };
  courses: number;
  products: number;
}

export interface AdminLead {
  id: string;
  name: string;
  email: string;
  municipality: string;
  message?: string | null;
  createdAt: string;
  status: LeadStatus;
  internalNote?: string | null;
}

export interface Paged<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

export interface LeadQuery {
  page: number;
  pageSize: number;
  status?: LeadStatus | null;
}

/** `PATCH {apiRoot}/admin/leads/{id}`: ao menos um campo; `""` limpa a nota. */
export interface LeadPatch {
  status?: LeadStatus;
  internalNote?: string;
}

/** Corpo de POST/PUT `{apiRoot}/admin/courses`. */
export interface CourseUpsert {
  id: string;
  title: string;
  axis: BnccAxis;
  summary: string;
  audience: string;
  workloadHours?: number | null;
  sortOrder?: number | null;
}

export type AdminCourse = Course;

export interface ProductItem {
  id: string;
  productId: string;
  name: string;
  unitPrice?: number | null;
}

export interface Product {
  id: string;
  name: string;
  sku?: string | null;
  createdAt: string;
  items: ProductItem[];
}

/** Corpo de POST/PUT `{apiRoot}/admin/products` (PUT substitui todos os itens). */
export interface ProductUpsert {
  name: string;
  sku?: string | null;
  items: { name: string; unitPrice?: number | null }[];
}

/** Limites do contrato BE #35 (validados também no FE). */
export const ADMIN_LIMITS = {
  note: 2000,
  courseId: 100,
  courseTitle: 200,
  courseSummary: 1000,
  courseAudience: 200,
  workloadHoursMax: 10000,
  productName: 200,
  sku: 64,
  itemName: 200,
  maxItems: 100,
} as const;
