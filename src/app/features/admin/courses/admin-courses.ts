import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import {
  ADMIN_LIMITS,
  AdminService,
  BNCC_AXIS_LABELS,
  type BnccAxis,
  type Course,
  type CourseUpsert,
} from '@domains';
import { Button, Loading, Modal } from '@shared';

import { AdminCrudPage } from '../shared/admin-crud';

/** Slug kebab-case (igual ao BE). */
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

type CourseField = 'id' | 'title' | 'axis' | 'summary' | 'audience' | 'workloadHours' | 'sortOrder';

@Component({
  selector: 'app-admin-courses',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button, Loading, Modal, ReactiveFormsModule],
  templateUrl: './admin-courses.html',
})
export class AdminCourses extends AdminCrudPage<Course> {
  private readonly api = inject(AdminService);

  protected readonly messages = {
    created: 'Curso criado.',
    updated: 'Curso atualizado.',
    deleted: 'Curso apagado.',
  };
  protected readonly axes = Object.entries(BNCC_AXIS_LABELS) as [BnccAxis, string][];
  protected readonly axisLabel: Readonly<Record<string, string>> = BNCC_AXIS_LABELS;

  protected readonly form = inject(NonNullableFormBuilder).group({
    id: [
      '',
      [
        Validators.required,
        Validators.maxLength(ADMIN_LIMITS.courseId),
        Validators.pattern(SLUG_PATTERN),
      ],
    ],
    title: ['', [Validators.required, Validators.maxLength(ADMIN_LIMITS.courseTitle)]],
    axis: ['pensamento-computacional' as BnccAxis, Validators.required],
    summary: ['', [Validators.required, Validators.maxLength(ADMIN_LIMITS.courseSummary)]],
    audience: ['', [Validators.required, Validators.maxLength(ADMIN_LIMITS.courseAudience)]],
    workloadHours: [
      null as number | null,
      [Validators.min(1), Validators.max(ADMIN_LIMITS.workloadHoursMax)],
    ],
    sortOrder: [null as number | null, [Validators.min(0)]],
  });

  protected fetch() {
    return this.api.courses();
  }

  protected remove(id: string) {
    return this.api.deleteCourse(id);
  }

  protected labelFor(axis: string): string {
    return this.axisLabel[axis] ?? axis;
  }

  protected openCreate(): void {
    this.form.reset();
    this.form.controls.id.enable();
    this.openForm(null);
  }

  protected openEdit(course: Course): void {
    this.form.reset({
      id: course.id,
      title: course.title,
      axis: course.axis,
      summary: course.summary,
      audience: course.audience,
      workloadHours: course.workloadHours ?? null,
      sortOrder: null,
    });
    this.form.controls.id.disable();
    this.openForm(course.id);
  }

  protected errorFor(field: CourseField): string | null {
    const server = this.serverErrors()[field];
    if (server) {
      return server;
    }
    const c = this.form.controls[field];
    if (!c.invalid || !(c.touched || c.dirty)) {
      return null;
    }
    return this.clientError(c.errors, {
      pattern: 'Use letras minúsculas, números e hífens (ex.: robotica-basica).',
    });
  }

  protected save(event: Event): void {
    event.preventDefault();
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const body: CourseUpsert = {
      id: v.id.trim(),
      title: v.title.trim(),
      axis: v.axis,
      summary: v.summary.trim(),
      audience: v.audience.trim(),
      workloadHours: v.workloadHours ?? null,
      ...(v.sortOrder !== null ? { sortOrder: v.sortOrder } : {}),
    };
    const editing = this.editingId();
    this.submit(editing ? this.api.updateCourse(editing, body) : this.api.createCourse(body));
  }
}
