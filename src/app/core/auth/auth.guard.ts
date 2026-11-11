import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { map } from 'rxjs';

import { ADMIN_LOGIN_URL, AuthService } from './auth.service';

/**
 * Libera a área admin com token válido. Sem token (ex.: depois do F5), tenta
 * renovar pelo cookie de sessão; se não der, vai para o login.
 */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  if (auth.isAuthenticated()) {
    return true;
  }
  const router = inject(Router);
  return auth
    .refresh()
    .pipe(
      map(
        (ok) =>
          ok || router.createUrlTree([ADMIN_LOGIN_URL], { queryParams: { returnUrl: state.url } }),
      ),
    );
};

/** Quem já está logado não precisa ver o login de novo. */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.isAuthenticated() ? inject(Router).createUrlTree(['/admin']) : true;
};
