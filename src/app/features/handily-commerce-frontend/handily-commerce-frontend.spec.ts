import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import {
  APP_VERSION,
  provideAppEnvironment,
  resolveApiRoot,
  type AppEnvironment,
} from '@core';

import { HandilyCommerceFrontend } from './handily-commerce-frontend';

const testEnv: AppEnvironment = {
  production: false,
  apiBaseUrl: 'http://localhost:5228/api',
  apiVersion: 'v1',
};

describe('HandilyCommerceFrontend', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HandilyCommerceFrontend],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAppEnvironment(testEnv),
      ],
    }).compileComponents();
  });

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

  /** Matches ngOnInit: apiVersion + ping (order not guaranteed). */
  function flushBootstrap(
    http: HttpTestingController,
    opts: {
      version?: { version: string } | null;
      ping?: { service: string; apiVersion: string; status: string } | null;
    } = {},
  ): void {
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
    flushBootstrap(http);

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

    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.app-versions')?.textContent).toContain('· erro');
    http.verify();
  });

  it('should show loading dashes before the responses', () => {
    const fixture = TestBed.createComponent(HandilyCommerceFrontend);
    const http = TestBed.inject(HttpTestingController);

    fixture.detectChanges();
    const text = fixture.nativeElement.querySelector('.app-versions')?.textContent ?? '';
    expect(text).toContain('API: —');
    expect(text).toContain('· —');

    flushBootstrap(http);
    http.verify();
  });

  it('should open the lead dialog with Nome, Contato, and Solicitação fields', async () => {
    const fixture = TestBed.createComponent(HandilyCommerceFrontend);
    const http = TestBed.inject(HttpTestingController);
    const root = fixture.nativeElement as HTMLElement;

    fixture.detectChanges();
    flushBootstrap(http);

    await openLeadModal(fixture);

    const dialog = root.querySelector('dialog#lead-dialog') as HTMLDialogElement;
    expect(dialog?.textContent).toContain('Solicitar orçamento');
    expect(dialog?.querySelector('#lead-nome')).toBeTruthy();
    expect(dialog?.querySelector('#lead-contato')).toBeTruthy();
    expect(dialog?.querySelector('#lead-solicitacao')).toBeTruthy();
    expect(dialog?.getAttribute('aria-modal')).toBe('true');
    expect(dialog?.textContent).toContain('ajksys@protonmail.com');

    http.verify();
  });

  it('should close the lead dialog on Escape and via Cancel', async () => {
    const fixture = TestBed.createComponent(HandilyCommerceFrontend);
    const http = TestBed.inject(HttpTestingController);
    const root = fixture.nativeElement as HTMLElement;

    fixture.detectChanges();
    flushBootstrap(http);

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

  it('should keep lead closed when Escape is pressed while closed', () => {
    const fixture = TestBed.createComponent(HandilyCommerceFrontend);
    const http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    flushBootstrap(http);

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
    flushBootstrap(http);

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
    flushBootstrap(http);

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
    flushBootstrap(http);

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

  it('should open mailto on lead form submit', async () => {
    const fixture = TestBed.createComponent(HandilyCommerceFrontend);
    const http = TestBed.inject(HttpTestingController);
    const root = fixture.nativeElement as HTMLElement;

    fixture.detectChanges();
    flushBootstrap(http);

    await openLeadModal(fixture);

    const dialog = root.querySelector('dialog#lead-dialog') as HTMLDialogElement;
    (dialog.querySelector('#lead-nome') as HTMLInputElement).value = 'Maria Silva';
    (dialog.querySelector('#lead-contato') as HTMLInputElement).value = 'maria@prefeitura.gov.br';
    (dialog.querySelector('#lead-solicitacao') as HTMLTextAreaElement).value =
      'Cursos BNCC para a rede municipal.';

    let assignedHref = '';
    const originalLocation = window.location;
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        ...originalLocation,
        set href(value: string) {
          assignedHref = value;
        },
        get href() {
          return assignedHref;
        },
      },
    });

    try {
      (dialog.querySelector('form') as HTMLFormElement).requestSubmit();
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      expect(assignedHref).toContain('mailto:ajksys@protonmail.com');
      expect(assignedHref).toContain(encodeURIComponent('Orçamento Handily — Maria Silva'));
      expect(assignedHref).toContain(encodeURIComponent('Maria Silva'));
      expect(root.querySelector('dialog#lead-dialog')).toBeFalsy();
    } finally {
      Object.defineProperty(window, 'location', {
        configurable: true,
        value: originalLocation,
      });
    }

    http.verify();
  });

  it('should open lead from secondary CTAs and honor dialog cancel event', async () => {
    const fixture = TestBed.createComponent(HandilyCommerceFrontend);
    const http = TestBed.inject(HttpTestingController);
    const root = fixture.nativeElement as HTMLElement;

    fixture.detectChanges();
    flushBootstrap(http);

    const labels = [
      'Saiba mais',
      'Quero uma proposta',
      'Fale conosco',
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

  it('should render FAQ and solutions sections', async () => {
    const fixture = TestBed.createComponent(HandilyCommerceFrontend);
    const http = TestBed.inject(HttpTestingController);
    const root = fixture.nativeElement as HTMLElement;

    fixture.detectChanges();
    flushBootstrap(http);
    fixture.detectChanges();

    expect(root.querySelector('#solucoes')).toBeTruthy();
    expect(root.querySelector('#bncc')).toBeTruthy();
    expect(root.querySelector('#depoimentos')).toBeTruthy();
    expect(root.querySelector('#faq')).toBeTruthy();
    expect(root.textContent).toContain('Pensamento Computacional');
    expect(root.textContent).toContain('O que é a Handily?');

    http.verify();
  });
});
