import { HttpTestingController, type TestRequest } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { adminTestProviders, API_ROOT } from '@features/admin/shared/admin-testing';

import { AuthService } from './auth.service';

describe('AuthService', () => {
  let auth: AuthService;
  let http: HttpTestingController;
  let navigate: ReturnType<typeof vi.spyOn>;
  const inAMinute = () => new Date(Date.now() + 60_000).toISOString();

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: adminTestProviders() });
    auth = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  });

  afterEach(() => {
    http.verify();
    vi.useRealTimers();
  });

  function login(expiresAt: string, accessToken = 'tok'): void {
    auth.login({ email: 'a@b.c', password: 'x' }).subscribe();
    const req = http.expectOne(`${API_ROOT}/auth/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.withCredentials).toBe(true);
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({ accessToken, expiresAt });
  }

  /** Confere o request de sessão (cookie + header CSRF) e devolve-o para o flush. */
  function expectSessionCall(path: 'refresh' | 'logout'): TestRequest {
    const req = http.expectOne(`${API_ROOT}/auth/${path}`);
    expect(req.request.method).toBe('POST');
    expect(req.request.withCredentials).toBe(true);
    expect(req.request.headers.get('X-Requested-With')).toBe('handily');
    expect(req.request.headers.has('Authorization')).toBe(false);
    return req;
  }

  it('starts logged out', () => {
    expect(auth.isAuthenticated()).toBe(false);
    expect(auth.token()).toBeNull();
  });

  it('keeps the token in memory after login', () => {
    login(inAMinute());
    expect(auth.isAuthenticated()).toBe(true);
    expect(auth.token()).toBe('tok');
  });

  it('ignores invalid login payloads', () => {
    login('not-a-date');
    expect(auth.isAuthenticated()).toBe(false);
  });

  it('treats an expired token as logged out', () => {
    login(new Date(Date.now() - 1000).toISOString());
    expect(auth.isAuthenticated()).toBe(false);
    expect(auth.token()).toBeNull();
  });

  it('refresh restores the session from the cookie', () => {
    let result: boolean | undefined;
    auth.refresh().subscribe((ok) => (result = ok));
    expectSessionCall('refresh').flush({ accessToken: 'new', expiresAt: inAMinute() });
    expect(result).toBe(true);
    expect(auth.token()).toBe('new');
  });

  it('refresh emits false and clears the session on 401', () => {
    login(inAMinute());
    let result: boolean | undefined;
    auth.refresh().subscribe((ok) => (result = ok));
    expectSessionCall('refresh').flush(null, { status: 401, statusText: 'Unauthorized' });
    expect(result).toBe(false);
    expect(auth.token()).toBeNull();
  });

  it('refresh emits false on an empty payload', () => {
    let result: boolean | undefined;
    auth.refresh().subscribe((ok) => (result = ok));
    expectSessionCall('refresh').flush(null);
    expect(result).toBe(false);
  });

  it('shares a single refresh between concurrent callers', () => {
    const results: boolean[] = [];
    auth.refresh().subscribe((ok) => results.push(ok));
    auth.refresh().subscribe((ok) => results.push(ok));
    expectSessionCall('refresh').flush({ accessToken: 'new', expiresAt: inAMinute() });
    expect(results).toEqual([true, true]);
    auth.refresh().subscribe();
    expectSessionCall('refresh').flush({ accessToken: 'again', expiresAt: inAMinute() });
    expect(auth.token()).toBe('again');
  });

  it('renews the token at expiresAt', () => {
    vi.useFakeTimers();
    login(new Date(Date.now() + 5000).toISOString());
    vi.advanceTimersByTime(5001);
    expectSessionCall('refresh').flush({ accessToken: 'new', expiresAt: inAMinute() });
    expect(auth.token()).toBe('new');
    expect(navigate).not.toHaveBeenCalled();
  });

  it('goes to login when the renewal at expiresAt fails', () => {
    vi.useFakeTimers();
    login(new Date(Date.now() + 5000).toISOString());
    vi.advanceTimersByTime(5001);
    expectSessionCall('refresh').flush(null, { status: 401, statusText: 'Unauthorized' });
    expect(auth.token()).toBeNull();
    expect(navigate).toHaveBeenCalledWith(['/admin/login'], { queryParams: undefined });
  });

  it('logout revokes the session in the BE and keeps returnUrl', () => {
    login(inAMinute());
    auth.logout('/admin/leads');
    expectSessionCall('logout').flush(null, { status: 204, statusText: 'No Content' });
    expect(auth.isAuthenticated()).toBe(false);
    expect(navigate).toHaveBeenCalledWith(['/admin/login'], {
      queryParams: { returnUrl: '/admin/leads' },
    });
  });

  it('logout clears local state even when the BE fails', () => {
    login(inAMinute());
    auth.logout();
    expectSessionCall('logout').flush(null, { status: 500, statusText: 'x' });
    expect(auth.token()).toBeNull();
    expect(navigate).toHaveBeenCalledWith(['/admin/login'], { queryParams: undefined });
  });

  it('me() calls /auth/me with the bearer token', () => {
    login(inAMinute());
    auth.me().subscribe();
    const req = http.expectOne(`${API_ROOT}/auth/me`);
    expect(req.request.headers.get('Authorization')).toBe('Bearer tok');
    req.flush({ email: 'a@b.c' });
  });
});
