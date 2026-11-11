import { HttpErrorResponse, type HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError, type Observable } from 'rxjs';

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

const isUnauthorized = (err: unknown): boolean =>
  err instanceof HttpErrorResponse && err.status === 401;

/**
 * Anexa `Authorization: Bearer` só nas rotas protegidas (nunca nas públicas).
 * Em 401 nessas rotas, faz um refresh (compartilhado) e repete o request uma vez;
 * se o refresh falhar (ou o retry der 401 de novo), encerra a sessão e manda para o login.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  if (!needsAuth(req.url, auth.apiRoot)) {
    return next(req);
  }
  const router = inject(Router);
  const send = () => {
    const token = auth.token();
    return next(token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req);
  };
  const signOut = (err: unknown): Observable<never> => {
    auth.signOut(router.url.startsWith('/admin/login') ? undefined : router.url);
    return throwError(() => err);
  };
  return send().pipe(
    catchError((err: unknown) => {
      if (!isUnauthorized(err)) {
        return throwError(() => err);
      }
      return auth
        .refresh()
        .pipe(
          switchMap((ok) =>
            ok
              ? send().pipe(
                  catchError((retryErr: unknown) =>
                    isUnauthorized(retryErr) ? signOut(retryErr) : throwError(() => retryErr),
                  ),
                )
              : signOut(err),
          ),
        );
    }),
  );
};
