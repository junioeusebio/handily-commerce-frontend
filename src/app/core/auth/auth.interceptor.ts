import { HttpErrorResponse, type HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { AuthService } from './auth.service';

/** True para rotas que exigem Bearer: `{apiRoot}/admin/**` e `{apiRoot}/auth/me`. */
export function needsAuth(url: string, apiRoot: string): boolean {
  const path = url.split('?')[0];
  return (
    path === `${apiRoot}/admin` ||
    path.startsWith(`${apiRoot}/admin/`) ||
    path === `${apiRoot}/auth/me`
  );
}

/**
 * Anexa `Authorization: Bearer` só nas rotas protegidas (nunca nas públicas).
 * Em 401 nessas rotas, encerra a sessão e manda para o login.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  if (!needsAuth(req.url, auth.apiRoot)) {
    return next(req);
  }
  const router = inject(Router);
  const token = auth.token();
  const authed = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;
  return next(authed).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse && err.status === 401) {
        auth.logout(router.url.startsWith('/admin/login') ? undefined : router.url);
      }
      return throwError(() => err);
    }),
  );
};
