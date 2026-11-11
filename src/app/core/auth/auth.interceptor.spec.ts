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
  const SUMMARY = `${API_ROOT}/admin/summary`;
  const REFRESH = `${API_ROOT}/auth/refresh`;
  const unauthorized = { status: 401, statusText: 'Unauthorized' };
  const session = (accessToken: string) => ({
    accessToken,
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
  });

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: adminTestProviders() });
    http = TestBed.inject(HttpTestingController);
    client = TestBed.inject(HttpClient);
    auth = TestBed.inject(AuthService);
    auth.login({ email: 'a@b.c', password: 'x' }).subscribe();
    http.expectOne(`${API_ROOT}/auth/login`).flush(session('tok'));
  });

  afterEach(() => http.verify());

  it('matches only admin and auth/me routes', () => {
    expect(needsAuth(`${API_ROOT}/admin`, API_ROOT)).toBe(true);
    expect(needsAuth(`${API_ROOT}/admin/leads?page=1`, API_ROOT)).toBe(true);
    expect(needsAuth(`${API_ROOT}/auth/me`, API_ROOT)).toBe(true);
    expect(needsAuth(`${API_ROOT}/administrator`, API_ROOT)).toBe(false);
    expect(needsAuth(`${API_ROOT}/courses`, API_ROOT)).toBe(false);
    expect(needsAuth(`${API_ROOT}/auth/login`, API_ROOT)).toBe(false);
    expect(needsAuth(REFRESH, API_ROOT)).toBe(false);
    expect(needsAuth(`${API_ROOT}/auth/logout`, API_ROOT)).toBe(false);
  });

  it('adds Bearer to admin requests', () => {
    client.get(SUMMARY).subscribe();
    const req = http.expectOne(SUMMARY);
    expect(req.request.headers.get('Authorization')).toBe('Bearer tok');
    req.flush({});
  });

  it('never adds Bearer to public requests', () => {
    client.get(`${API_ROOT}/courses`).subscribe();
    const req = http.expectOne(`${API_ROOT}/courses`);
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush([]);
  });

  it('refreshes once on 401 and retries with the new token', () => {
    const signOut = vi.spyOn(auth, 'signOut');
    let body: unknown;
    client.get(SUMMARY).subscribe((b) => (body = b));
    http.expectOne(SUMMARY).flush(null, unauthorized);
    http.expectOne(REFRESH).flush(session('new'));
    const retry = http.expectOne(SUMMARY);
    expect(retry.request.headers.get('Authorization')).toBe('Bearer new');
    retry.flush({ ok: true });
    expect(body).toEqual({ ok: true });
    expect(signOut).not.toHaveBeenCalled();
  });

  it('shares one refresh between concurrent 401s', () => {
    const done: string[] = [];
    client.get(SUMMARY).subscribe(() => done.push('summary'));
    client.get(`${API_ROOT}/admin/leads`).subscribe(() => done.push('leads'));
    http.expectOne(SUMMARY).flush(null, unauthorized);
    http.expectOne(`${API_ROOT}/admin/leads`).flush(null, unauthorized);
    http.expectOne(REFRESH).flush(session('new'));
    http.expectOne(SUMMARY).flush({});
    http.expectOne(`${API_ROOT}/admin/leads`).flush([]);
    expect(done).toEqual(['summary', 'leads']);
  });

  it('signs out when the refresh fails', () => {
    const signOut = vi.spyOn(auth, 'signOut').mockImplementation(() => undefined);
    let failed = false;
    client.get(SUMMARY).subscribe({ error: () => (failed = true) });
    http.expectOne(SUMMARY).flush(null, unauthorized);
    http.expectOne(REFRESH).flush(null, unauthorized);
    expect(failed).toBe(true);
    expect(signOut).toHaveBeenCalledTimes(1);
  });

  it('signs out when the retry is still unauthorized (no loop)', () => {
    const signOut = vi.spyOn(auth, 'signOut').mockImplementation(() => undefined);
    let failed = false;
    client.get(SUMMARY).subscribe({ error: () => (failed = true) });
    http.expectOne(SUMMARY).flush(null, unauthorized);
    http.expectOne(REFRESH).flush(session('new'));
    http.expectOne(SUMMARY).flush(null, unauthorized);
    expect(failed).toBe(true);
    expect(signOut).toHaveBeenCalledTimes(1);
  });

  it('keeps other retry errors without signing out', () => {
    const signOut = vi.spyOn(auth, 'signOut');
    let status = 0;
    client.get(SUMMARY).subscribe({ error: (e: { status: number }) => (status = e.status) });
    http.expectOne(SUMMARY).flush(null, unauthorized);
    http.expectOne(REFRESH).flush(session('new'));
    http.expectOne(SUMMARY).flush(null, { status: 500, statusText: 'x' });
    expect(status).toBe(500);
    expect(signOut).not.toHaveBeenCalled();
  });

  it('does not refresh on other errors', () => {
    const signOut = vi.spyOn(auth, 'signOut');
    client.get(SUMMARY).subscribe({ error: () => undefined });
    http.expectOne(SUMMARY).flush(null, { status: 500, statusText: 'x' });
    http.expectNone(REFRESH);
    expect(signOut).not.toHaveBeenCalled();
  });

  it('sends no header when logged out', () => {
    vi.spyOn(auth, 'token').mockReturnValue(null);
    client.get(`${API_ROOT}/auth/me`).subscribe({ error: () => undefined });
    const req = http.expectOne(`${API_ROOT}/auth/me`);
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });
});
