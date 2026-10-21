import { ChangeDetectionStrategy, Component, computed, inject, output } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { BehaviorSubject, catchError, map, of, startWith, switchMap } from 'rxjs';

import { BNCC_AXIS_LABELS, CourseService, type Course } from '@domains';
import { Button, Card, Loading } from '@shared';

/** Pedido de orçamento disparado a partir de um curso específico. */
export interface CourseLeadRequest {
  event: MouseEvent;
  course: Course;
}

/** Estado de carregamento da lista de cursos vinda da API. */
export type CoursesState =
  { status: 'loading' } | { status: 'error' } | { status: 'ready'; courses: Course[] };

@Component({
  selector: 'app-home-courses',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button, Card, Loading],
  templateUrl: './home-courses.html',
})
export class HomeCourses {
  private readonly courseService = inject(CourseService);
  private readonly reload$ = new BehaviorSubject<void>(undefined);

  protected readonly state = toSignal(
    this.reload$.pipe(
      switchMap(() =>
        this.courseService.list().pipe(
          map((courses): CoursesState => ({ status: 'ready', courses })),
          catchError(() => of<CoursesState>({ status: 'error' })),
          startWith<CoursesState>({ status: 'loading' }),
        ),
      ),
    ),
    { requireSync: true },
  );
  protected readonly readyCourses = computed(() => {
    const state = this.state();
    return state.status === 'ready' ? state.courses : [];
  });
  protected readonly axisLabels = BNCC_AXIS_LABELS;

  readonly requestCourseLead = output<CourseLeadRequest>();

  protected retry(): void {
    this.reload$.next();
  }
}
