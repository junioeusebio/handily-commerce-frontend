import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Subject, throwError, type Observable } from 'rxjs';

import { CourseService, type Course } from '@domains';

import { HomeCourses, type CourseLeadRequest } from './home-courses';

const stubCourses: Course[] = [
  {
    id: 'pc',
    title: 'Curso PC',
    axis: 'pensamento-computacional',
    summary: 'Resumo PC',
    audience: 'Professores A',
    workloadHours: 40,
  },
  {
    id: 'cd',
    title: 'Curso CD',
    axis: 'cultura-digital',
    summary: 'Resumo CD',
    audience: 'Professores B',
  },
];

@Component({
  imports: [HomeCourses],
  template: `<app-home-courses (requestCourseLead)="requests.push($event)" />`,
})
class Host {
  readonly requests: CourseLeadRequest[] = [];
}

describe('HomeCourses', () => {
  let response$: Subject<Course[]>;
  let list: () => Observable<Course[]>;

  beforeEach(() => {
    response$ = new Subject<Course[]>();
    list = () => response$;
    TestBed.configureTestingModule({
      providers: [{ provide: CourseService, useValue: { list: () => list() } }],
    });
  });

  function render() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    return { fixture, root: fixture.nativeElement as HTMLElement };
  }

  function respond(fixture: ReturnType<typeof render>['fixture'], courses: Course[]): void {
    response$.next(courses);
    response$.complete();
    fixture.detectChanges();
  }

  it('deve exibir estado de carregamento enquanto a API não responde', () => {
    const { root } = render();
    expect(root.querySelector('#cursos')?.getAttribute('aria-busy')).toBe('true');
    expect(root.querySelector('.courses-loading')?.textContent).toContain('Carregando cursos');
    expect(root.querySelectorAll('.loading-skeleton-cards > li').length).toBe(4);
    expect(root.querySelectorAll('article').length).toBe(0);
  });

  it('deve renderizar um card por curso com eixo, resumo e público-alvo', () => {
    const { fixture, root } = render();
    respond(fixture, stubCourses);

    expect(root.querySelector('#cursos')?.getAttribute('aria-busy')).toBe('false');
    expect(root.querySelector('.courses-loading')).toBeNull();
    const titles = Array.from(root.querySelectorAll('h3')).map((h) => h.textContent?.trim());
    expect(titles).toEqual(['Curso PC', 'Curso CD']);
    expect(root.textContent).toContain('Pensamento Computacional');
    expect(root.textContent).toContain('Cultura Digital');
    expect(root.textContent).toContain('Resumo PC');
    expect(root.textContent).toContain('Professores B');
    expect(root.textContent?.toLowerCase()).not.toContain('store');
  });

  it('deve exibir carga horária apenas quando informada', () => {
    const { fixture, root } = render();
    respond(fixture, stubCourses);

    const cards = root.querySelectorAll('article');
    expect(cards[0].textContent).toContain('Carga horária:');
    expect(cards[0].textContent).toContain('40 h');
    expect(cards[1].textContent).not.toContain('Carga horária');
  });

  it('deve emitir requestCourseLead com o curso ao clicar em Solicitar orçamento', () => {
    const { fixture, root } = render();
    respond(fixture, stubCourses);

    const buttons = Array.from(root.querySelectorAll('button')).filter((b) =>
      (b.textContent ?? '').includes('Solicitar orçamento'),
    );
    expect(buttons.length).toBe(2);
    expect(buttons[1].textContent).toContain('Curso CD');

    buttons[1].click();

    const [request] = fixture.componentInstance.requests;
    expect(fixture.componentInstance.requests.length).toBe(1);
    expect(request.course.id).toBe('cd');
    expect(request.event).toBeInstanceOf(MouseEvent);
  });

  it('deve exibir estado vazio quando a API retorna lista vazia', () => {
    const { fixture, root } = render();
    respond(fixture, []);

    expect(root.querySelector('.courses-empty')?.textContent).toContain('Nenhum curso');
    expect(root.querySelectorAll('article').length).toBe(0);
  });

  it('deve exibir erro e recarregar ao clicar em Tentar novamente', () => {
    list = () => throwError(() => new Error('offline'));
    const { fixture, root } = render();

    expect(root.querySelector('.courses-error')?.textContent).toContain(
      'Não foi possível carregar os cursos',
    );
    expect(root.querySelectorAll('article').length).toBe(0);

    response$ = new Subject<Course[]>();
    list = () => response$;
    const retry = Array.from(root.querySelectorAll('button')).find((b) =>
      (b.textContent ?? '').includes('Tentar novamente'),
    ) as HTMLButtonElement;
    retry.click();
    fixture.detectChanges();
    expect(root.querySelector('.courses-loading')).toBeTruthy();

    respond(fixture, stubCourses);
    expect(root.querySelector('.courses-error')).toBeNull();
    expect(root.querySelectorAll('article').length).toBe(2);
  });
});
