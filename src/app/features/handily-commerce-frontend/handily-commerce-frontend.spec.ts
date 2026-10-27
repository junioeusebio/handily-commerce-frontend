import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { DeferBlockState, TestBed } from '@angular/core/testing';

import { APP_VERSION, provideAppEnvironment, resolveApiRoot, type AppEnvironment } from '@core';
import type { Course } from '@domains';
import { ToastService } from '@shared';

import { HandilyCommerceFrontend } from './handily-commerce-frontend';

const testEnv: AppEnvironment = {
  production: false,
  apiBaseUrl: 'http://localhost:5228/api',
  apiVersion: 'v1',
};

const testCourses: Course[] = [
  {
    id: 'pensamento-computacional-na-pratica',
    title: 'Pensamento Computacional na prática',
    axis: 'pensamento-computacional',
    summary: 'Algoritmos e lógica.',
    audience: 'Professores dos anos iniciais do Ensino Fundamental',
    workloadHours: 40,
  },
];

describe('HandilyCommerceFrontend', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HandilyCommerceFrontend],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideAppEnvironment(testEnv)],
    }).compileComponents();
  });

  async function renderDeferredSections(
    fixture: ReturnType<typeof TestBed.createComponent<HandilyCommerceFrontend>>,
  ): Promise<void> {
    const blocks = await fixture.getDeferBlocks();
    expect(blocks.length).toBe(3);
    for (const block of blocks) {
      await block.render(DeferBlockState.Complete);
    }
    fixture.detectChanges();
  }

  function flushApiVersion(
    http: HttpTestingController,
    body: { version: string } | null = { version: 'v1' },
  ): void {
    const req = http.expectOne(`${resolveApiRoot(testEnv)}/apiVersion`);
    if (body) {
      req.flush(body);
    } else {
      req.flush('fail', { status: 503, statusText: 'Service Unavailable' });
    }
  }

  function flushPing(
    http: HttpTestingController,
    body: { service: string; apiVersion: string; status: string } | null = {
      service: 'handily-commerce-backend',
      apiVersion: 'v1',
      status: 'ok',
    },
  ): void {
    const req = http.expectOne(`${resolveApiRoot(testEnv)}/ping`);
    if (body) {
      req.flush(body);
    } else {
      req.flush('fail', { status: 503, statusText: 'Service Unavailable' });
    }
  }

  function flushCourses(http: HttpTestingController, body: Course[] = testCourses): void {
    http.expectOne(`${resolveApiRoot(testEnv)}/courses`).flush(body);
  }

  /** Matches ngOnInit: apiVersion + ping (order not guaranteed), plus the courses section. */
  async function flushBootstrap(
    http: HttpTestingController,
    opts: {
      version?: { version: string } | null;
      ping?: { service: string; apiVersion: string; status: string } | null;
    } = {},
    fixture: ReturnType<typeof TestBed.createComponent<HandilyCommerceFrontend>>,
  ): Promise<void> {
    await renderDeferredSections(fixture);
    flushCourses(http);
    const versionBody = opts.version === undefined ? { version: 'v1' } : opts.version;
    const pingBody =
      opts.ping === undefined
        ? {
            service: 'handily-commerce-backend',
            apiVersion: 'v1',
            status: 'ok',
          }
        : opts.ping;

    const pending = http.match(
      (r) =>
        r.url === `${resolveApiRoot(testEnv)}/apiVersion` ||
        r.url === `${resolveApiRoot(testEnv)}/ping`,
    );
    expect(pending.length).toBe(2);

    for (const req of pending) {
      if (req.request.url.endsWith('/apiVersion')) {
        if (versionBody) {
          req.flush(versionBody);
        } else {
          req.flush('fail', { status: 503, statusText: 'Service Unavailable' });
        }
      } else {
        if (pingBody) {
          req.flush(pingBody);
        } else {
          req.flush('fail', { status: 503, statusText: 'Service Unavailable' });
        }
      }
    }
  }

  async function openLeadModal(
    fixture: ReturnType<typeof TestBed.createComponent<HandilyCommerceFrontend>>,
  ): Promise<HTMLDialogElement> {
    const root = fixture.nativeElement as HTMLElement;
    (root.querySelector('button[aria-haspopup="dialog"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const dialog = root.querySelector('dialog#lead-dialog') as HTMLDialogElement;
    expect(dialog).toBeTruthy();
    return dialog;
  }

  it('should create', () => {
    const fixture = TestBed.createComponent(HandilyCommerceFrontend);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render Handily institutional home, WEB version, API version, and ping status', async () => {
    const fixture = TestBed.createComponent(HandilyCommerceFrontend);
    const http = TestBed.inject(HttpTestingController);

    fixture.detectChanges();
    await flushBootstrap(http, {}, fixture);

    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain(
      'Tecnologia e formação para municípios na BNCC Computação',
    );
    expect(compiled.textContent).toContain('Software · municípios');
    expect(compiled.querySelector('img[alt="Handily"]')).toBeTruthy();
    expect(compiled.querySelector('.app-versions')?.textContent).toContain('WEB: ' + APP_VERSION);
    expect(compiled.querySelector('.app-versions')?.textContent).toContain('API: v1');
    expect(compiled.querySelector('.app-versions')?.textContent).toContain('· ok');
    expect(compiled.querySelector('.app-versions')?.textContent).toContain(
      '© COPYRIGHT 2026 AJKSys Consulting',
    );
    expect(compiled.querySelector('button[aria-haspopup="dialog"]')?.textContent).toContain(
      'Solicitar orçamento',
    );
    expect(compiled.textContent).toContain('ajksys@protonmail.com');
    expect(compiled.textContent?.toLowerCase()).not.toContain("what's new");
    expect(compiled.textContent?.toLowerCase()).not.toContain('prévia');
    expect(compiled.textContent?.toLowerCase()).not.toContain('store');
    expect(compiled.textContent?.toLowerCase()).not.toContain('inspirado em prodam');
    expect(compiled.textContent).not.toContain('handily-commerce-frontend');

    http.verify();
  });

  it('should show erro when apiVersion request fails', async () => {
    const fixture = TestBed.createComponent(HandilyCommerceFrontend);
    const http = TestBed.inject(HttpTestingController);

    fixture.detectChanges();

    for (let i = 0; i < 3; i++) {
      const req = http.expectOne(`${resolveApiRoot(testEnv)}/apiVersion`);
      req.flush('fail', { status: 503, statusText: 'Service Unavailable' });
    }
    flushPing(http);
    await renderDeferredSections(fixture);
    flushCourses(http);

    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.app-versions')?.textContent).toContain(
      'API: erro',
    );
    http.verify();
  });

  it('should show erro when ping request fails', async () => {
    const fixture = TestBed.createComponent(HandilyCommerceFrontend);
    const http = TestBed.inject(HttpTestingController);

    fixture.detectChanges();

    flushApiVersion(http);
    for (let i = 0; i < 3; i++) {
      const req = http.expectOne(`${resolveApiRoot(testEnv)}/ping`);
      req.flush('fail', { status: 503, statusText: 'Service Unavailable' });
    }
    await renderDeferredSections(fixture);
    flushCourses(http);

    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.app-versions')?.textContent).toContain('· erro');
    http.verify();
  });

  it('should show loading dashes before the responses', async () => {
    const fixture = TestBed.createComponent(HandilyCommerceFrontend);
    const http = TestBed.inject(HttpTestingController);

    fixture.detectChanges();
    const text = fixture.nativeElement.querySelector('.app-versions')?.textContent ?? '';
    expect(text).toContain('API: —');
    expect(text).toContain('· —');

    await flushBootstrap(http, {}, fixture);
    http.verify();
  });

  it('should open the lead dialog with Nome, E-mail, Município and Mensagem fields', async () => {
    const fixture = TestBed.createComponent(HandilyCommerceFrontend);
    const http = TestBed.inject(HttpTestingController);
    const root = fixture.nativeElement as HTMLElement;

    fixture.detectChanges();
    await flushBootstrap(http, {}, fixture);

    await openLeadModal(fixture);

    const dialog = root.querySelector('dialog#lead-dialog') as HTMLDialogElement;
    expect(dialog?.textContent).toContain('Solicitar orçamento');
    expect(dialog?.querySelector('#lead-nome')).toBeTruthy();
    expect(dialog?.querySelector('#lead-email')).toBeTruthy();
    expect(dialog?.querySelector('#lead-municipio')).toBeTruthy();
    expect(dialog?.querySelector('#lead-mensagem')).toBeTruthy();
    expect(dialog?.getAttribute('aria-modal')).toBe('true');
    expect(dialog?.textContent).toContain('ajksys@protonmail.com');

    http.verify();
  });

  it('should close the lead dialog on Escape and via Cancel', async () => {
    const fixture = TestBed.createComponent(HandilyCommerceFrontend);
    const http = TestBed.inject(HttpTestingController);
    const root = fixture.nativeElement as HTMLElement;

    fixture.detectChanges();
    await flushBootstrap(http, {}, fixture);

    await openLeadModal(fixture);
    expect(root.querySelector('dialog#lead-dialog')).toBeTruthy();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(root.querySelector('dialog#lead-dialog')).toBeFalsy();

    await openLeadModal(fixture);
    const cancel = Array.from(root.querySelectorAll('dialog#lead-dialog button')).find((b) =>
      (b.textContent ?? '').includes('Cancelar'),
    ) as HTMLButtonElement;
    cancel.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(root.querySelector('dialog#lead-dialog')).toBeFalsy();

    http.verify();
  });

  it('should keep lead closed when Escape is pressed while closed', async () => {
    const fixture = TestBed.createComponent(HandilyCommerceFrontend);
    const http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    await flushBootstrap(http, {}, fixture);

    const component = fixture.componentInstance as unknown as {
      leadOpen: { (): boolean };
    };
    expect(component.leadOpen()).toBe(false);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    expect(component.leadOpen()).toBe(false);
    expect((fixture.nativeElement as HTMLElement).querySelector('dialog#lead-dialog')).toBeFalsy();
    http.verify();
  });

  it('should close when the dialog backdrop is clicked', async () => {
    const fixture = TestBed.createComponent(HandilyCommerceFrontend);
    const http = TestBed.inject(HttpTestingController);
    const root = fixture.nativeElement as HTMLElement;

    fixture.detectChanges();
    await flushBootstrap(http, {}, fixture);

    const dialog = await openLeadModal(fixture);
    dialog.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(root.querySelector('dialog#lead-dialog')).toBeFalsy();
    http.verify();
  });

  it('should close when Enter or Space is pressed on the dialog backdrop', async () => {
    const fixture = TestBed.createComponent(HandilyCommerceFrontend);
    const http = TestBed.inject(HttpTestingController);
    const root = fixture.nativeElement as HTMLElement;

    fixture.detectChanges();
    await flushBootstrap(http, {}, fixture);

    let dialog = await openLeadModal(fixture);
    dialog.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
    );
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(root.querySelector('dialog#lead-dialog')).toBeFalsy();

    dialog = await openLeadModal(fixture);
    dialog.dispatchEvent(
      new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true }),
    );
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(root.querySelector('dialog#lead-dialog')).toBeFalsy();

    http.verify();
  });

  it('should trap Tab focus inside the open lead dialog', async () => {
    const fixture = TestBed.createComponent(HandilyCommerceFrontend);
    const http = TestBed.inject(HttpTestingController);
    const root = fixture.nativeElement as HTMLElement;

    fixture.detectChanges();
    await flushBootstrap(http, {}, fixture);

    await openLeadModal(fixture);

    const panel = root.querySelector('dialog#lead-dialog') as HTMLElement;
    const focusable = panel.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    expect(focusable.length).toBeGreaterThan(1);
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    last.focus();
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }),
    );
    fixture.detectChanges();
    expect(document.activeElement).toBe(first);

    first.focus();
    document.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Tab',
        bubbles: true,
        cancelable: true,
        shiftKey: true,
      }),
    );
    fixture.detectChanges();
    expect(document.activeElement).toBe(last);

    http.verify();
  });

  it('should POST the lead to the API on submit and show success', async () => {
    const fixture = TestBed.createComponent(HandilyCommerceFrontend);
    const http = TestBed.inject(HttpTestingController);
    const root = fixture.nativeElement as HTMLElement;

    fixture.detectChanges();
    await flushBootstrap(http, {}, fixture);

    await openLeadModal(fixture);

    const dialog = root.querySelector('dialog#lead-dialog') as HTMLDialogElement;
    const type = (sel: string, value: string) => {
      const el = dialog.querySelector(sel) as HTMLInputElement;
      el.value = value;
      el.dispatchEvent(new Event('input'));
    };
    type('#lead-nome', 'Maria Silva');
    type('#lead-email', 'maria@prefeitura.gov.br');
    type('#lead-municipio', 'Campinas');
    type('#lead-telefone', '(11) 91234-5678');
    type('#lead-mensagem', 'Cursos BNCC para a rede municipal.');
    fixture.detectChanges();

    (dialog.querySelector('form') as HTMLFormElement).requestSubmit();
    fixture.detectChanges();

    const req = http.expectOne((r) => r.url.endsWith('/leads'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      name: 'Maria Silva',
      email: 'maria@prefeitura.gov.br',
      municipality: 'Campinas',
      phone: '11912345678',
      message: 'Cursos BNCC para a rede municipal.',
    });
    req.flush({ id: 'abc' }, { status: 201, statusText: 'Created' });
    fixture.detectChanges();

    expect(dialog.open).toBe(false);
    expect(TestBed.inject(ToastService).toasts()[0]).toMatchObject({
      message: 'Recebemos seu contato! Em breve retornamos por e-mail.',
      type: 'success',
    });
    http.verify();
  });

  it('should open lead from secondary CTAs and honor dialog cancel event', async () => {
    const fixture = TestBed.createComponent(HandilyCommerceFrontend);
    const http = TestBed.inject(HttpTestingController);
    const root = fixture.nativeElement as HTMLElement;

    fixture.detectChanges();
    await flushBootstrap(http, {}, fixture);

    const labels = [
      'Saiba mais',
      'Fale conosco',
      'Falar sobre sistemas →',
      'Falar sobre gestão →',
      'Solicitar orçamento →',
    ];
    for (const label of labels) {
      const el = Array.from(root.querySelectorAll('button, a')).find((node) =>
        (node.textContent ?? '').trim().includes(label),
      ) as HTMLElement | undefined;
      if (!el || el.tagName === 'A') {
        continue;
      }
      el.click();
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      expect(root.querySelector('dialog#lead-dialog')).toBeTruthy();
      const dialog = root.querySelector('dialog#lead-dialog') as HTMLDialogElement;
      dialog.dispatchEvent(new Event('cancel', { bubbles: true, cancelable: true }));
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      expect(root.querySelector('dialog#lead-dialog')).toBeFalsy();
    }

    const allBudget = Array.from(root.querySelectorAll('button')).filter((b) =>
      (b.textContent ?? '').includes('Solicitar orçamento'),
    );
    expect(allBudget.length).toBeGreaterThan(1);
    allBudget[allBudget.length - 1].click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(root.querySelector('dialog#lead-dialog')).toBeTruthy();
    (root.querySelector('dialog#lead-dialog') as HTMLDialogElement).dispatchEvent(
      new Event('cancel', { bubbles: true, cancelable: true }),
    );
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(root.querySelector('dialog#lead-dialog')).toBeFalsy();

    http.verify();
  });

  it('should defer courses, testimonials and FAQ behind viewport placeholders', async () => {
    const fixture = TestBed.createComponent(HandilyCommerceFrontend);
    const http = TestBed.inject(HttpTestingController);
    const root = fixture.nativeElement as HTMLElement;

    fixture.detectChanges();

    expect(root.querySelector('app-home-courses')).toBeFalsy();
    expect(root.querySelector('app-home-testimonials')).toBeFalsy();
    expect(root.querySelector('app-home-faq')).toBeFalsy();
    expect(root.querySelector('#cursos')).toBeTruthy();
    expect(root.querySelector('#depoimentos')).toBeTruthy();
    expect(root.querySelector('#faq')).toBeTruthy();

    await flushBootstrap(http, {}, fixture);
    fixture.detectChanges();

    expect(root.querySelector('app-home-courses')).toBeTruthy();
    expect(root.querySelector('app-home-testimonials')).toBeTruthy();
    expect(root.querySelector('app-home-faq')).toBeTruthy();

    http.verify();
  });

  it('should render a skip link to the main content as the first focusable element', async () => {
    const fixture = TestBed.createComponent(HandilyCommerceFrontend);
    const http = TestBed.inject(HttpTestingController);
    const root = fixture.nativeElement as HTMLElement;

    fixture.detectChanges();
    await flushBootstrap(http, {}, fixture);
    fixture.detectChanges();

    const firstFocusable = root.querySelector('a[href], button') as HTMLAnchorElement;
    expect(firstFocusable.classList).toContain('skip-link');
    expect(firstFocusable.textContent?.trim()).toBe('Pular para o conteúdo');
    expect(firstFocusable.getAttribute('href')).toBe('#conteudo');
    expect(firstFocusable.classList).toContain('sr-only');
    expect(firstFocusable.classList).toContain('focus:not-sr-only');

    const main = root.querySelector('main#conteudo') as HTMLElement;
    expect(main).toBeTruthy();
    expect(main.getAttribute('tabindex')).toBe('-1');
    main.focus();
    expect(document.activeElement).toBe(main);

    http.verify();
  });

  it('should render FAQ and solutions sections', async () => {
    const fixture = TestBed.createComponent(HandilyCommerceFrontend);
    const http = TestBed.inject(HttpTestingController);
    const root = fixture.nativeElement as HTMLElement;

    fixture.detectChanges();
    await flushBootstrap(http, {}, fixture);
    fixture.detectChanges();

    expect(root.querySelector('#solucoes')).toBeTruthy();
    expect(root.querySelector('#bncc')).toBeTruthy();
    expect(root.querySelector('#depoimentos')).toBeTruthy();
    expect(root.querySelector('#faq')).toBeTruthy();
    expect(root.textContent).toContain('Pensamento Computacional');
    expect(root.textContent).toContain('O que é a Handily?');

    http.verify();
  });

  it('should render H4 API courses and prefill the lead dialog with the chosen course', async () => {
    const fixture = TestBed.createComponent(HandilyCommerceFrontend);
    const http = TestBed.inject(HttpTestingController);
    const root = fixture.nativeElement as HTMLElement;

    fixture.detectChanges();
    await flushBootstrap(http, {}, fixture);
    fixture.detectChanges();

    const section = root.querySelector('#cursos') as HTMLElement;
    expect(section).toBeTruthy();
    expect(root.querySelector('a[href="#cursos"]')).toBeTruthy();
    expect(root.textContent).not.toContain('etapa futura');
    const courseTitle = section.querySelector('h3')?.textContent?.trim() ?? '';
    expect(courseTitle).toBe('Pensamento Computacional na prática');

    const cta = section.querySelector('button') as HTMLButtonElement;
    expect(cta.textContent).toContain('Solicitar orçamento');
    cta.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const dialog = root.querySelector('dialog#lead-dialog') as HTMLDialogElement;
    expect(dialog).toBeTruthy();
    const mensagem = dialog.querySelector('#lead-mensagem') as HTMLTextAreaElement;
    expect(mensagem.value).toContain(courseTitle);

    mensagem.value = 'Texto editado';
    mensagem.dispatchEvent(new Event('input'));
    dialog.dispatchEvent(new Event('cancel', { bubbles: true, cancelable: true }));
    fixture.detectChanges();
    await fixture.whenStable();

    await openLeadModal(fixture);
    expect((root.querySelector('#lead-mensagem') as HTMLTextAreaElement).value).toBe(
      'Texto editado',
    );

    http.verify();
  });

  it('should render H2 institutional sections Quem somos, Serviços and Por que BNCC', async () => {
    const fixture = TestBed.createComponent(HandilyCommerceFrontend);
    const http = TestBed.inject(HttpTestingController);
    const root = fixture.nativeElement as HTMLElement;

    fixture.detectChanges();
    await flushBootstrap(http, {}, fixture);
    fixture.detectChanges();

    expect(root.querySelector('#quem-somos')).toBeTruthy();
    expect(root.querySelector('#servicos')).toBeTruthy();
    expect(root.querySelector('#bncc')).toBeTruthy();
    expect(root.textContent).toContain('Quem somos');
    expect(root.textContent).toContain('AJKSys Consulting');
    expect(root.textContent).toContain('Serviços');
    expect(root.textContent).toContain('Desenvolvimento de sistemas');
    expect(root.textContent).toContain('Administração e gestão para municípios');
    expect(root.textContent).toContain('Por que BNCC agora');
    expect(root.textContent).toContain('2026/2027');
    expect(root.textContent).toContain('Software · municípios');
    expect(root.textContent?.toLowerCase()).not.toContain('store');

    http.verify();
  });
});
