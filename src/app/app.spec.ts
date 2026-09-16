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

import { App } from './app';

const testEnv: AppEnvironment = {
  production: false,
  apiBaseUrl: 'http://localhost:5228/api',
  apiVersion: 'v1',
};

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAppEnvironment(testEnv),
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render Handily Commerce', async () => {
    const fixture = TestBed.createComponent(App);
    const http = TestBed.inject(HttpTestingController);

    fixture.detectChanges();

    const pending = http.match(
      (r) =>
        r.url === `${resolveApiRoot(testEnv)}/apiVersion` ||
        r.url === `${resolveApiRoot(testEnv)}/ping`,
    );
    expect(pending.length).toBe(2);
    for (const req of pending) {
      if (req.request.url.endsWith('/apiVersion')) {
        req.flush({ version: 'v1' });
      } else {
        req.flush({
          service: 'handily-commerce-backend',
          apiVersion: 'v1',
          status: 'ok',
        });
      }
    }

    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Handily Commerce');
    expect(compiled.querySelector('.app-versions')?.textContent).toContain('WEB: ' + APP_VERSION);
    expect(compiled.querySelector('.app-versions')?.textContent).toContain('API: v1');
    expect(compiled.querySelector('.app-versions')?.textContent).toContain('· ok');

    http.verify();
  });
});
