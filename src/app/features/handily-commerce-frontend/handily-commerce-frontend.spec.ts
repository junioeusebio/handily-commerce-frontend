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

  async function openChangelogModal(
    fixture: ReturnType<typeof TestBed.createComponent<HandilyCommerceFrontend>>,
    http: HttpTestingController,
  ): Promise<HTMLDialogElement> {
    const root = fixture.nativeElement as HTMLElement;
    (root.querySelector('button[aria-haspopup="dialog"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const dialog = root.querySelector('dialog#changelog-dialog') as HTMLDialogElement;
    expect(dialog).toBeTruthy();
    return dialog;
  }

  it('should create', () => {
    const fixture = TestBed.createComponent(HandilyCommerceFrontend);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the title, WEB version, API version, and ping status', async () => {
    const fixture = TestBed.createComponent(HandilyCommerceFrontend);
    const http = TestBed.inject(HttpTestingController);

    fixture.detectChanges();
    flushBootstrap(http);

    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Handily Commerce');
    expect(compiled.querySelector('img[alt="Handily Commerce"]')).toBeTruthy();
    expect(compiled.querySelector('.app-versions')?.textContent).toContain('WEB: ' + APP_VERSION);
    expect(compiled.querySelector('.app-versions')?.textContent).toContain('API: v1');
    expect(compiled.querySelector('.app-versions')?.textContent).toContain('· ok');
    expect(compiled.querySelector('button[aria-haspopup="dialog"]')?.textContent).toContain(
      "What's new",
    );

    http.verify();
  });

  it('should show erro when apiVersion request fails', async () => {
    const fixture = TestBed.createComponent(HandilyCommerceFrontend);
    const http = TestBed.inject(HttpTestingController);

    fixture.detectChanges();

    // Initial request + 2 retries (retry count: 2) for apiVersion; ping succeeds once.
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

  it('should open the changelog modal and list items', async () => {
    const fixture = TestBed.createComponent(HandilyCommerceFrontend);
    const http = TestBed.inject(HttpTestingController);
    const root = fixture.nativeElement as HTMLElement;

    fixture.detectChanges();
    flushBootstrap(http);

    await openChangelogModal(fixture, http);

    expect(root.querySelector('dialog#changelog-dialog')?.textContent).toContain('—');

    const changelogReq = http.expectOne(`${resolveApiRoot(testEnv)}/changelog`);
    expect(changelogReq.request.method).toBe('GET');
    changelogReq.flush([
      { title: '0.4.0', summary: "What's new modal" },
      { title: '0.3.0', summary: 'Prior release' },
    ]);

    fixture.detectChanges();
    await fixture.whenStable();

    const dialog = root.querySelector('dialog#changelog-dialog') as HTMLDialogElement;
    expect(dialog?.textContent).toContain('0.4.0');
    expect(dialog?.textContent).toContain("What's new modal");
    expect(dialog?.textContent).toContain('0.3.0');
    expect(dialog?.tagName).toBe('DIALOG');
    expect(dialog?.getAttribute('aria-modal')).toBe('true');

    http.verify();
  });

  it('should show erro in the modal when changelog request fails', async () => {
    const fixture = TestBed.createComponent(HandilyCommerceFrontend);
    const http = TestBed.inject(HttpTestingController);
    const root = fixture.nativeElement as HTMLElement;

    fixture.detectChanges();
    flushBootstrap(http);

    await openChangelogModal(fixture, http);

    for (let i = 0; i < 3; i++) {
      const req = http.expectOne(`${resolveApiRoot(testEnv)}/changelog`);
      req.flush('fail', { status: 503, statusText: 'Service Unavailable' });
    }

    fixture.detectChanges();
    await fixture.whenStable();

    expect(root.querySelector('dialog#changelog-dialog')?.textContent).toContain('erro');
    http.verify();
  });

  it('should close the modal on Escape and via the close button', async () => {
    const fixture = TestBed.createComponent(HandilyCommerceFrontend);
    const http = TestBed.inject(HttpTestingController);
    const root = fixture.nativeElement as HTMLElement;

    fixture.detectChanges();
    flushBootstrap(http);

    await openChangelogModal(fixture, http);
    http.expectOne(`${resolveApiRoot(testEnv)}/changelog`).flush([]);
    fixture.detectChanges();
    expect(root.querySelector('dialog#changelog-dialog')).toBeTruthy();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    expect(root.querySelector('dialog#changelog-dialog')).toBeFalsy();

    await openChangelogModal(fixture, http);
    http.expectOne(`${resolveApiRoot(testEnv)}/changelog`).flush([]);
    fixture.detectChanges();

    (root.querySelector('button[aria-label="Close what\'s new"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(root.querySelector('dialog#changelog-dialog')).toBeFalsy();

    http.verify();
  });

  it('should show empty copy when changelog returns []', async () => {
    const fixture = TestBed.createComponent(HandilyCommerceFrontend);
    const http = TestBed.inject(HttpTestingController);
    const root = fixture.nativeElement as HTMLElement;

    fixture.detectChanges();
    flushBootstrap(http);

    await openChangelogModal(fixture, http);
    http.expectOne(`${resolveApiRoot(testEnv)}/changelog`).flush([]);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(root.querySelector('dialog#changelog-dialog')?.textContent).toContain(
      'No release notes yet.',
    );
    http.verify();
  });

  it('should ignore keyboard handling when the modal is closed', () => {
    const fixture = TestBed.createComponent(HandilyCommerceFrontend);
    const http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    flushBootstrap(http);

    const component = fixture.componentInstance as unknown as {
      onDocumentKeydown: (event: KeyboardEvent) => void;
      changelogOpen: { (): boolean };
    };
    expect(component.changelogOpen()).toBe(false);
    component.onDocumentKeydown(new KeyboardEvent('keydown', { key: 'Escape' }));
    component.onDocumentKeydown(new KeyboardEvent('keydown', { key: 'Tab' }));
    expect(component.changelogOpen()).toBe(false);
    http.verify();
  });

  it('should close when the dialog backdrop is clicked', async () => {
    const fixture = TestBed.createComponent(HandilyCommerceFrontend);
    const http = TestBed.inject(HttpTestingController);
    const root = fixture.nativeElement as HTMLElement;

    fixture.detectChanges();
    flushBootstrap(http);

    const dialog = await openChangelogModal(fixture, http);
    http.expectOne(`${resolveApiRoot(testEnv)}/changelog`).flush([]);
    fixture.detectChanges();

    // Click the dialog element itself (backdrop / target === currentTarget).
    dialog.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();
    expect(root.querySelector('dialog#changelog-dialog')).toBeFalsy();
    http.verify();
  });

  it('should close when Enter or Space is pressed on the dialog backdrop', async () => {
    const fixture = TestBed.createComponent(HandilyCommerceFrontend);
    const http = TestBed.inject(HttpTestingController);
    const root = fixture.nativeElement as HTMLElement;

    fixture.detectChanges();
    flushBootstrap(http);

    let dialog = await openChangelogModal(fixture, http);
    http.expectOne(`${resolveApiRoot(testEnv)}/changelog`).flush([]);
    fixture.detectChanges();

    dialog.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
    );
    fixture.detectChanges();
    expect(root.querySelector('dialog#changelog-dialog')).toBeFalsy();

    dialog = await openChangelogModal(fixture, http);
    http.expectOne(`${resolveApiRoot(testEnv)}/changelog`).flush([]);
    fixture.detectChanges();

    dialog.dispatchEvent(
      new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true }),
    );
    fixture.detectChanges();
    expect(root.querySelector('dialog#changelog-dialog')).toBeFalsy();

    http.verify();
  });

  it('should trap Tab focus inside the open modal', async () => {
    const fixture = TestBed.createComponent(HandilyCommerceFrontend);
    const http = TestBed.inject(HttpTestingController);
    const root = fixture.nativeElement as HTMLElement;

    fixture.detectChanges();
    flushBootstrap(http);

    await openChangelogModal(fixture, http);
    http.expectOne(`${resolveApiRoot(testEnv)}/changelog`).flush([
      { title: '1.0.0', summary: 'Ship it' },
    ]);
    fixture.detectChanges();
    await fixture.whenStable();

    const component = fixture.componentInstance as unknown as {
      onDocumentKeydown: (event: KeyboardEvent) => void;
      trapFocus: (event: KeyboardEvent) => void;
    };

    const panel = root.querySelector('dialog#changelog-dialog') as HTMLElement;
    const buttons = panel.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThan(0);
    const first = buttons[0] as HTMLButtonElement;
    const last = buttons[buttons.length - 1] as HTMLButtonElement;

    last.focus();
    const tabEvent = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    Object.defineProperty(tabEvent, 'target', { value: last });
    component.onDocumentKeydown(tabEvent);
    expect(document.activeElement).toBe(first);

    first.focus();
    const shiftTab = new KeyboardEvent('keydown', {
      key: 'Tab',
      bubbles: true,
      cancelable: true,
      shiftKey: true,
    });
    component.onDocumentKeydown(shiftTab);
    expect(document.activeElement).toBe(last);

    // Mid-list Tab should not wrap.
    if (buttons.length > 1) {
      first.focus();
      const midTab = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
      component.onDocumentKeydown(midTab);
      expect(document.activeElement).toBe(first);
    }

    http.verify();
  });
});
