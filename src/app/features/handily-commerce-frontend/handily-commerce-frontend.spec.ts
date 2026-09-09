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
});
