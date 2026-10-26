import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { AuthService } from '@core';

import { adminTestProviders, API_ROOT } from '../shared/admin-testing';
import { AdminLogin } from './admin-login';

describe('AdminLogin', () => {
  let http: HttpTestingController;
  let navigate: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: adminTestProviders() });
    http = TestBed.inject(HttpTestingController);
    navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
  });

  afterEach(() => http.verify());

  function setup(returnUrl?: string) {
    const fixture = TestBed.createComponent(AdminLogin);
    if (returnUrl) fixture.componentRef.setInput('returnUrl', returnUrl);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const type = (id: string, v: string) => {
      const input = el.querySelector<HTMLInputElement>(id)!;
      input.value = v;
      input.dispatchEvent(new Event('input'));
    };
    const button = () => el.querySelector<HTMLButtonElement>('button[type=submit]')!;
    return { fixture, el, type, button };
  }

  it('shows the ADMIN badge and keeps the button disabled while invalid', () => {
    const { el, button, fixture, type } = setup();
    expect(el.textContent).toContain('ADMIN');
    expect(button().disabled).toBe(true);
    type('#admin-email', 'nope');
    type('#admin-password', 'x');
    fixture.detectChanges();
    expect(button().disabled).toBe(true);
  });

  it('logs in and goes to returnUrl', () => {
    const { el, fixture, type, button } = setup('/admin/leads');
    type('#admin-email', ' admin@ajksys.com ');
    type('#admin-password', 'secret');
    fixture.detectChanges();
    expect(button().disabled).toBe(false);
    el.querySelector('form')!.dispatchEvent(new Event('submit'));
    const req = http.expectOne(`${API_ROOT}/auth/login`);
    expect(req.request.body).toEqual({ email: 'admin@ajksys.com', password: 'secret' });
    req.flush({ accessToken: 't', expiresAt: new Date(Date.now() + 60_000).toISOString() });
    expect(TestBed.inject(AuthService).isAuthenticated()).toBe(true);
    expect(navigate).toHaveBeenCalledWith('/admin/leads');
  });

  it('ignores returnUrl outside the admin area', () => {
    const { el, fixture, type } = setup('https://evil.example');
    type('#admin-email', 'a@b.co');
    type('#admin-password', 'x');
    fixture.detectChanges();
    el.querySelector('form')!.dispatchEvent(new Event('submit'));
    http
      .expectOne(`${API_ROOT}/auth/login`)
      .flush({ accessToken: 't', expiresAt: new Date(Date.now() + 60_000).toISOString() });
    expect(navigate).toHaveBeenCalledWith('/admin');
  });

  it('shows an error on 401 and on network failure', () => {
    const { el, fixture, type } = setup();
    const submit = () => {
      type('#admin-email', 'a@b.co');
      type('#admin-password', 'x');
      fixture.detectChanges();
      el.querySelector('form')!.dispatchEvent(new Event('submit'));
    };
    submit();
    http.expectOne(`${API_ROOT}/auth/login`).flush(null, { status: 401, statusText: 'x' });
    fixture.detectChanges();
    expect(el.querySelector('[role=alert]')?.textContent).toContain('E-mail ou senha inválidos');
    submit();
    http.expectOne(`${API_ROOT}/auth/login`).error(new ProgressEvent('error'));
    fixture.detectChanges();
    expect(el.querySelector('[role=alert]')?.textContent).toContain('API');
  });

  it('does not submit an invalid form', () => {
    const { el } = setup();
    el.querySelector('form')!.dispatchEvent(new Event('submit'));
    http.expectNone(`${API_ROOT}/auth/login`);
  });
});
