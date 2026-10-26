import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
  type OnInit,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

import {
  ADMIN_LIMITS,
  AdminService,
  BNCC_AXIS_LABELS,
  type BnccAxis,
  type Course,
  type CourseUpsert,
} from '@domains';
import { Button, Loading, Modal, ToastService } from '@shared';

import { ADMIN_INPUT, errorMessage, validationErrors } from '../shared/admin-errors';

/** Slug kebab-case (igual ao BE). */
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

type CourseField = 'id' | 'title' | 'axis' | 'summary' | 'audience' | 'workloadHours' | 'sortOrder';

@Component({
  selector: 'app-admin-courses',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button, Loading, Modal, ReactiveFormsModule],
  templateUrl: './admin-courses.html',
})
export class AdminCourses implements OnInit {
  private readonly api = inject(AdminService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly limits = ADMIN_LIMITS;
  protected readonly inputClass = ADMIN_INPUT;
  protected readonly axes = Object.entries(BNCC_AXIS_LABELS) as [BnccAxis, string][];
  protected readonly axisLabel: Readonly<Record<string, string>> = BNCC_AXIS_LABELS;

  protected labelFor(axis: string): string {
    return this.axisLabel[axis] ?? axis;
  }

  protected readonly items = signal<Course[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  /** null = criando; senão o id do curso em edição. */
  protected readonly editingId = signal<string | null>(null);
  protected readonly formOpen = signal(false);
  protected readonly saving = signal(false);
  protected readonly serverErrors = signal<Record<string, string>>({});
  protected readonly formError = signal<string | null>(null);

  protected readonly toDelete = signal<Course | null>(null);
  protected readonly confirmOpen = signal(false);
  protected readonly deleting = signal(false);

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

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api
      .courses()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (list) => {
          this.items.set(list);
          this.loading.set(false);
        },
        error: (err: unknown) => {
          this.error.set(errorMessage(err));
          this.loading.set(false);
        },
      });
  }

  protected openCreate(): void {
    this.editingId.set(null);
    this.form.reset();
    this.form.controls.id.enable();
    this.openForm();
  }

  protected openEdit(course: Course): void {
    this.editingId.set(course.id);
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
    this.openForm();
  }

  private openForm(): void {
    this.serverErrors.set({});
    this.formError.set(null);
    this.formOpen.set(true);
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
    const e = c.errors ?? {};
    if (e['required']) return 'Campo obrigatório.';
    if (e['maxlength']) return `No máximo ${e['maxlength'].requiredLength} caracteres.`;
    if (e['pattern']) return 'Use letras minúsculas, números e hífens (ex.: robotica-basica).';
    if (e['min']) return `Valor mínimo: ${e['min'].min}.`;
    if (e['max']) return `Valor máximo: ${e['max'].max}.`;
    return null;
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
    const req = editing ? this.api.updateCourse(editing, body) : this.api.createCourse(body);
    this.saving.set(true);
    this.serverErrors.set({});
    this.formError.set(null);
    req
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.formOpen.set(false);
          this.toast.show({
            message: editing ? 'Curso atualizado.' : 'Curso criado.',
            type: 'success',
          });
          this.load();
        },
        error: (err: unknown) => {
          this.serverErrors.set(validationErrors(err));
          this.formError.set(errorMessage(err));
        },
      });
  }

  protected askDelete(course: Course): void {
    this.toDelete.set(course);
    this.confirmOpen.set(true);
  }

  protected confirmDelete(): void {
    const course = this.toDelete();
    if (!course || this.deleting()) {
      return;
    }
    this.deleting.set(true);
    this.api
      .deleteCourse(course.id)
      .pipe(
        finalize(() => this.deleting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.confirmOpen.set(false);
          this.toast.show({ message: 'Curso apagado.', type: 'success' });
          this.load();
        },
        error: (err: unknown) => this.toast.show({ message: errorMessage(err), type: 'error' }),
      });
  }
}
