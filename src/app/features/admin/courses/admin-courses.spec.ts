import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import type { Course } from '@domains';

import { adminTestProviders, API_ROOT } from '../shared/admin-testing';
import { AdminCourses } from './admin-courses';

const course: Course = {
  id: 'robotica',
  title: 'Robótica',
  axis: 'pensamento-computacional',
  summary: 'Resumo',
  audience: 'Professores',
  workloadHours: 40,
};

describe('AdminCourses', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: adminTestProviders() });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  function setup() {
    const fixture = TestBed.createComponent(AdminCourses);
    fixture.detectChanges();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return {
      fixture,
      c: fixture.componentInstance as any,
      el: fixture.nativeElement as HTMLElement,
    };
  }

  it('lists courses, empty and error states', () => {
    const { fixture, el, c } = setup();
    http.expectOne(`${API_ROOT}/courses`).flush([course]);
    fixture.detectChanges();
    expect(el.textContent).toContain('Robótica');
    expect(el.textContent).toContain('Pensamento Computacional');
    c.load();
    http.expectOne(`${API_ROOT}/courses`).flush([]);
    fixture.detectChanges();
    expect(el.textContent).toContain('Nenhum curso');
    c.load();
    http.expectOne(`${API_ROOT}/courses`).flush(null, { status: 500, statusText: 'x' });
    fixture.detectChanges();
    expect(el.querySelector('[role=alert]')).toBeTruthy();
  });

  it('validates and creates a course, mapping 400 errors', () => {
    const { c } = setup();
    http.expectOne(`${API_ROOT}/courses`).flush([]);
    c.openCreate();
    c.save(new Event('submit'));
    expect(c.errorFor('id')).toBe('Campo obrigatório.');
    c.form.patchValue({ id: 'Bad Slug', workloadHours: 0, sortOrder: -1, title: 'x'.repeat(201) });
    expect(c.errorFor('id')).toContain('minúsculas');
    expect(c.errorFor('workloadHours')).toContain('mínimo');
    expect(c.errorFor('title')).toContain('200');
    c.form.patchValue({ workloadHours: 20000 });
    expect(c.errorFor('workloadHours')).toContain('máximo');
    c.form.patchValue({ summary: 'ok' });
    expect(c.errorFor('summary')).toBeNull();
    c.form.patchValue({
      id: 'novo-curso',
      title: ' Novo ',
      summary: 'S',
      audience: 'A',
      workloadHours: null,
      sortOrder: 2,
    });
    c.save(new Event('submit'));
    let req = http.expectOne(`${API_ROOT}/admin/courses`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      id: 'novo-curso',
      title: 'Novo',
      axis: 'pensamento-computacional',
      summary: 'S',
      audience: 'A',
      workloadHours: null,
      sortOrder: 2,
    });
    req.flush({ errors: { id: ['Já existe'] } }, { status: 400, statusText: 'x' });
    expect(c.errorFor('id')).toBe('Já existe');
    c.save(new Event('submit'));
    req = http.expectOne(`${API_ROOT}/admin/courses`);
    req.flush(course, { status: 201, statusText: 'Created' });
    http.expectOne(`${API_ROOT}/courses`).flush([course]);
    expect(c.formOpen()).toBe(false);
  });

  it('edits with PUT and keeps the id locked', () => {
    const { c } = setup();
    http.expectOne(`${API_ROOT}/courses`).flush([course]);
    c.openEdit(course);
    expect(c.form.controls.id.disabled).toBe(true);
    c.save(new Event('submit'));
    const req = http.expectOne(`${API_ROOT}/admin/courses/robotica`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body.sortOrder).toBeUndefined();
    req.flush(course);
    http.expectOne(`${API_ROOT}/courses`).flush([course]);
  });

  it('prefills Ordem on edit and sends it on PUT', () => {
    const { c } = setup();
    http.expectOne(`${API_ROOT}/courses`).flush([course]);
    c.openEdit({ ...course, sortOrder: 3 });
    expect(c.form.controls.sortOrder.value).toBe(3);
    c.form.patchValue({ sortOrder: 1.5 });
    c.form.controls.sortOrder.markAsDirty();
    expect(c.errorFor('sortOrder')).toBe('Use um número inteiro.');
    c.form.patchValue({ sortOrder: 4 });
    c.save(new Event('submit'));
    const req = http.expectOne(`${API_ROOT}/admin/courses/robotica`);
    expect(req.request.body.sortOrder).toBe(4);
    req.flush(course);
    http.expectOne(`${API_ROOT}/courses`).flush([course]);
  });

  it('lists courses by sortOrder, missing order last', () => {
    const { c } = setup();
    http.expectOne(`${API_ROOT}/courses`).flush([
      { ...course, id: 'sem-ordem' },
      { ...course, id: 'b', sortOrder: 2 },
      { ...course, id: 'a', sortOrder: 0 },
    ]);
    expect(c.sortedItems().map((x: Course) => x.id)).toEqual(['a', 'b', 'sem-ordem']);
  });

  it('deletes after confirmation', () => {
    const { c } = setup();
    http.expectOne(`${API_ROOT}/courses`).flush([course]);
    c.confirmDelete();
    c.askDelete(course);
    c.confirmDelete();
    http
      .expectOne(`${API_ROOT}/admin/courses/robotica`)
      .flush(null, { status: 500, statusText: 'x' });
    c.confirmDelete();
    http.expectOne(`${API_ROOT}/admin/courses/robotica`).flush(null);
    http.expectOne(`${API_ROOT}/courses`).flush([]);
    expect(c.confirmOpen()).toBe(false);
  });
});
