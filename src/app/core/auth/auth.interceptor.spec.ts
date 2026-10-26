import { HttpClient } from '@angular/common/http';
import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { adminTestProviders, API_ROOT } from '@features/admin/shared/admin-testing';

import { needsAuth } from './auth.interceptor';
import { AuthService } from './auth.service';

describe('authInterceptor', () => {
  let http: HttpTestingController;
  let client: HttpClient;
  let auth: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: adminTestProviders() });
    http = TestBed.inject(HttpTestingController);
    client = TestBed.inject(HttpClient);
    auth = TestBed.inject(AuthService);
    auth.login({ email: 'a@b.c', password: 'x' }).subscribe();
    http.expectOne(`${API_ROOT}/auth/login`).flush({
      accessToken: 'tok',
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
    });
  });

  afterEach(() => http.verify());

  it('matches only admin and auth/me routes', () => {
    expect(needsAuth(`${API_ROOT}/admin`, API_ROOT)).toBe(true);
    expect(needsAuth(`${API_ROOT}/admin/leads?page=1`, API_ROOT)).toBe(true);
    expect(needsAuth(`${API_ROOT}/auth/me`, API_ROOT)).toBe(true);
    expect(needsAuth(`${API_ROOT}/administrator`, API_ROOT)).toBe(false);
    expect(needsAuth(`${API_ROOT}/courses`, API_ROOT)).toBe(false);
    expect(needsAuth(`${API_ROOT}/auth/login`, API_ROOT)).toBe(false);
  });

  it('adds Bearer to admin requests', () => {
    client.get(`${API_ROOT}/admin/summary`).subscribe();
    const req = http.expectOne(`${API_ROOT}/admin/summary`);
    expect(req.request.headers.get('Authorization')).toBe('Bearer tok');
    req.flush({});
  });

  it('never adds Bearer to public requests', () => {
    client.get(`${API_ROOT}/courses`).subscribe();
    const req = http.expectOne(`${API_ROOT}/courses`);
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush([]);
  });

  it('logs out on 401 from protected routes', () => {
    const logout = vi.spyOn(auth, 'logout').mockImplementation(() => undefined);
    let failed = false;
    client.get(`${API_ROOT}/admin/summary`).subscribe({ error: () => (failed = true) });
    http
      .expectOne(`${API_ROOT}/admin/summary`)
      .flush(null, { status: 401, statusText: 'Unauthorized' });
    expect(failed).toBe(true);
    expect(logout).toHaveBeenCalled();
  });

  it('does not log out on other errors', () => {
    const logout = vi.spyOn(auth, 'logout');
    client.get(`${API_ROOT}/admin/summary`).subscribe({ error: () => undefined });
    http.expectOne(`${API_ROOT}/admin/summary`).flush(null, { status: 500, statusText: 'x' });
    expect(logout).not.toHaveBeenCalled();
  });

  it('sends no header when logged out', () => {
    vi.spyOn(auth, 'token').mockReturnValue(null);
    client.get(`${API_ROOT}/auth/me`).subscribe({ error: () => undefined });
    const req = http.expectOne(`${API_ROOT}/auth/me`);
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });
});
