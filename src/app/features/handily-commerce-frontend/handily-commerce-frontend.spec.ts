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

  it('should render the title and WEB version footer', async () => {
    const fixture = TestBed.createComponent(HandilyCommerceFrontend);
    const http = TestBed.inject(HttpTestingController);

    fixture.detectChanges();

    const req = http.expectOne(`${resolveApiRoot(testEnv)}/apiVersion`);
    expect(req.request.method).toBe('GET');
    req.flush({ version: 'v1' });

    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Handily Commerce Frontend');
    expect(compiled.querySelector('p')?.textContent).toContain(
      'Angular Handily Commerce Frontend',
    );
    expect(compiled.querySelector('.app-versions')?.textContent).toContain('WEB: ' + APP_VERSION);
    expect(compiled.querySelector('.app-versions')?.textContent).toContain('API: v1');
    expect(compiled.querySelector('button[aria-haspopup="dialog"]')?.textContent).toContain("What's new");

    http.verify();
  });

  it('should show erro when apiVersion request fails', async () => {
    const fixture = TestBed.createComponent(HandilyCommerceFrontend);
    const http = TestBed.inject(HttpTestingController);

    fixture.detectChanges();

    // Initial request + 2 retries (retry count: 2)
    for (let i = 0; i < 3; i++) {
      const req = http.expectOne(`${resolveApiRoot(testEnv)}/apiVersion`);
      req.flush('fail', { status: 503, statusText: 'Service Unavailable' });
    }

    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.app-versions')?.textContent).toContain(
      'API: erro',
    );
    http.verify();
  });

  it('should show loading dash before the response', () => {
    const fixture = TestBed.createComponent(HandilyCommerceFrontend);
    const http = TestBed.inject(HttpTestingController);

    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.app-versions')?.textContent).toContain(
      'API: —',
    );

    http.expectOne(`${resolveApiRoot(testEnv)}/apiVersion`).flush({ version: 'v1' });
    http.verify();
  });

  it('should open the changelog modal and list items', async () => {
    const fixture = TestBed.createComponent(HandilyCommerceFrontend);
    const http = TestBed.inject(HttpTestingController);
    const root = fixture.nativeElement as HTMLElement;

    fixture.detectChanges();
    flushApiVersion(http);

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
    flushApiVersion(http);

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
    flushApiVersion(http);

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
    flushApiVersion(http);

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
    flushApiVersion(http);

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
    flushApiVersion(http);

    const dialog = await openChangelogModal(fixture, http);
    http.expectOne(`${resolveApiRoot(testEnv)}/changelog`).flush([]);
    fixture.detectChanges();

    // Click the dialog element itself (backdrop / target === currentTarget).
    dialog.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();
    expect(root.querySelector('dialog#changelog-dialog')).toBeFalsy();
    http.verify();
  });

  it('should trap Tab focus inside the open modal', async () => {
    const fixture = TestBed.createComponent(HandilyCommerceFrontend);
    const http = TestBed.inject(HttpTestingController);
    const root = fixture.nativeElement as HTMLElement;

    fixture.detectChanges();
    flushApiVersion(http);

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
