import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import {
  Router,
  UrlTree,
  type ActivatedRouteSnapshot,
  type RouterStateSnapshot,
} from '@angular/router';
import { Observable } from 'rxjs';

import { adminTestProviders, API_ROOT } from '@features/admin/shared/admin-testing';

import { authGuard, guestGuard } from './auth.guard';
import { AuthService } from './auth.service';

describe('auth guards', () => {
  let auth: AuthService;
  let http: HttpTestingController;
  const route = {} as ActivatedRouteSnapshot;
  const state = { url: '/admin/leads' } as RouterStateSnapshot;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: adminTestProviders() });
    auth = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  const run = (guard: typeof authGuard) => TestBed.runInInjectionContext(() => guard(route, state));

  /** Roda o authGuard sem token e responde o refresh com `status`. */
  function runWithRefresh(status: 200 | 401): boolean | UrlTree | undefined {
    let result: boolean | UrlTree | undefined;
    (run(authGuard) as Observable<boolean | UrlTree>).subscribe((r) => (result = r));
    const req = http.expectOne(`${API_ROOT}/auth/refresh`);
    if (status === 200) {
      req.flush({ accessToken: 'tok', expiresAt: new Date(Date.now() + 60_000).toISOString() });
    } else {
      req.flush(null, { status, statusText: 'Unauthorized' });
    }
    return result;
  }

  it('authGuard redirects to login with returnUrl when the refresh fails', () => {
    const result = runWithRefresh(401) as UrlTree;
    expect(TestBed.inject(Router).serializeUrl(result)).toBe(
      '/admin/login?returnUrl=%2Fadmin%2Fleads',
    );
  });

  it('authGuard restores the session from the cookie after F5', () => {
    expect(runWithRefresh(200)).toBe(true);
    expect(auth.token()).toBe('tok');
  });

  it('authGuard allows a valid session without calling refresh', () => {
    vi.spyOn(auth, 'isAuthenticated').mockReturnValue(true);
    expect(run(authGuard)).toBe(true);
  });

  it('guestGuard sends logged users to /admin', () => {
    vi.spyOn(auth, 'isAuthenticated').mockReturnValue(true);
    expect(TestBed.inject(Router).serializeUrl(run(guestGuard) as UrlTree)).toBe('/admin');
  });

  it('guestGuard lets visitors see the login', () => {
    expect(run(guestGuard)).toBe(true);
  });
});
