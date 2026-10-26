import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';

import { ADMIN_LOGIN_URL, AuthService } from './auth.service';

/** Libera a área admin só com token válido; senão, vai para o login. */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  if (auth.isAuthenticated()) {
    return true;
  }
  return inject(Router).createUrlTree([ADMIN_LOGIN_URL], {
    queryParams: { returnUrl: state.url },
  });
};

/** Quem já está logado não precisa ver o login de novo. */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.isAuthenticated() ? inject(Router).createUrlTree(['/admin']) : true;
};
