import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { adminTestProviders, API_ROOT } from '@features/admin/shared/admin-testing';

import { AuthService } from './auth.service';

describe('AuthService', () => {
  let auth: AuthService;
  let http: HttpTestingController;
  let navigate: ReturnType<typeof vi.spyOn>;

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
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({ accessToken, expiresAt });
  }

  it('starts logged out', () => {
    expect(auth.isAuthenticated()).toBe(false);
    expect(auth.token()).toBeNull();
  });

  it('keeps the token in memory after login', () => {
    login(new Date(Date.now() + 60_000).toISOString());
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

  it('logs out automatically at expiresAt', () => {
    vi.useFakeTimers();
    login(new Date(Date.now() + 5000).toISOString());
    vi.advanceTimersByTime(5001);
    expect(auth.token()).toBeNull();
    expect(navigate).toHaveBeenCalledWith(['/admin/login'], { queryParams: undefined });
  });

  it('logout clears the session and keeps returnUrl', () => {
    login(new Date(Date.now() + 60_000).toISOString());
    auth.logout('/admin/leads');
    expect(auth.isAuthenticated()).toBe(false);
    expect(navigate).toHaveBeenCalledWith(['/admin/login'], {
      queryParams: { returnUrl: '/admin/leads' },
    });
  });

  it('me() calls /auth/me with the bearer token', () => {
    login(new Date(Date.now() + 60_000).toISOString());
    auth.me().subscribe();
    const req = http.expectOne(`${API_ROOT}/auth/me`);
    expect(req.request.headers.get('Authorization')).toBe('Bearer tok');
    req.flush({ email: 'a@b.c' });
  });
});
