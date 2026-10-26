import { TestBed } from '@angular/core/testing';
import {
  Router,
  UrlTree,
  type ActivatedRouteSnapshot,
  type RouterStateSnapshot,
} from '@angular/router';

import { adminTestProviders } from '@features/admin/shared/admin-testing';

import { authGuard, guestGuard } from './auth.guard';
import { AuthService } from './auth.service';

describe('auth guards', () => {
  let auth: AuthService;
  const route = {} as ActivatedRouteSnapshot;
  const state = { url: '/admin/leads' } as RouterStateSnapshot;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: adminTestProviders() });
    auth = TestBed.inject(AuthService);
  });

  const run = (guard: typeof authGuard) => TestBed.runInInjectionContext(() => guard(route, state));

  it('authGuard redirects to login with returnUrl when logged out', () => {
    const result = run(authGuard) as UrlTree;
    expect(TestBed.inject(Router).serializeUrl(result)).toBe(
      '/admin/login?returnUrl=%2Fadmin%2Fleads',
    );
  });

  it('authGuard allows a valid session', () => {
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
