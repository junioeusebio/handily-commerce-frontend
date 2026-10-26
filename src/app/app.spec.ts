import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { DeferBlockState, TestBed } from '@angular/core/testing';

import { APP_VERSION, provideAppEnvironment, resolveApiRoot, type AppEnvironment } from '@core';

import { Router, provideRouter } from '@angular/router';

import { App } from './app';
import { routes } from './app.routes';

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
        provideRouter(routes),
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

  it('should render Handily institutional home', async () => {
    const fixture = TestBed.createComponent(App);
    const http = TestBed.inject(HttpTestingController);

    await TestBed.inject(Router).navigateByUrl('/');
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

    const deferBlocks = await fixture.getDeferBlocks();
    for (const block of deferBlocks) {
      await block.render(DeferBlockState.Complete);
    }
    fixture.detectChanges();

    http.expectOne(`${resolveApiRoot(testEnv)}/courses`).flush([]);

    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain(
      'Tecnologia e formação para municípios na BNCC Computação',
    );
    expect(compiled.querySelector('.app-versions')?.textContent).toContain('WEB: ' + APP_VERSION);
    expect(compiled.querySelector('.app-versions')?.textContent).toContain('API: v1');
    expect(compiled.querySelector('.app-versions')?.textContent).toContain('· ok');

    http.verify();
  });

  it('redirects /admin to the login when there is no session', async () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/admin/leads');
    fixture.detectChanges();
    expect(router.url).toBe('/admin/login?returnUrl=%2Fadmin%2Fleads');
  });

  it('sends unknown paths back to the home', async () => {
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/nao-existe');
    expect(router.url).toBe('/');
  });
});
