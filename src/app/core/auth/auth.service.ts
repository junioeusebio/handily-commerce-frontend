import { HttpClient, HttpHeaders } from '@angular/common/http';
import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, finalize, map, Observable, of, shareReplay, tap } from 'rxjs';

import { APP_ENVIRONMENT, resolveApiRoot } from '../config/app-environment';

/** Corpo de `POST {apiRoot}/auth/login`. */
export interface LoginRequest {
  email: string;
  password: string;
}

/** Resposta 200 de `POST {apiRoot}/auth/login` e `POST {apiRoot}/auth/refresh`. */
export interface LoginResponse {
  accessToken: string;
  expiresAt: string;
}

/** Resposta 200 de `GET {apiRoot}/auth/me`. */
export interface MeResponse {
  email: string;
}

interface Session {
  token: string;
  expiresAtMs: number;
}

export const ADMIN_LOGIN_URL = '/admin/login';

/** Opções das chamadas que usam o cookie de sessão (refresh/logout). */
const SESSION_REQUEST = {
  withCredentials: true,
  headers: new HttpHeaders({ 'X-Requested-With': 'handily' }),
};

/**
 * Sessão do admin. O access token fica **só em memória** (signal); a sessão
 * sobrevive ao F5 via cookie HttpOnly do BE, renovado em `refresh()`.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly env = inject(APP_ENVIRONMENT);
  private readonly router = inject(Router);

  private readonly session = signal<Session | null>(null);
  private expiryTimer: ReturnType<typeof setTimeout> | null = null;
  private refreshing: Observable<boolean> | null = null;

  /** Token atual (ou null). */
  readonly token = computed(() => this.session()?.token ?? null);

  constructor() {
    inject(DestroyRef).onDestroy(() => this.clearTimer());
  }

  get apiRoot(): string {
    return resolveApiRoot(this.env);
  }

  /** True quando há token e ele ainda não expirou. */
  isAuthenticated(): boolean {
    const s = this.session();
    if (!s) {
      return false;
    }
    if (s.expiresAtMs <= Date.now()) {
      this.clear();
      return false;
    }
    return true;
  }

  login(body: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.apiRoot}/auth/login`, body, { withCredentials: true })
      .pipe(tap((res) => this.start(res)));
  }

  /**
   * Troca o cookie de sessão por um novo access token. Emite `true` se deu certo.
   * Chamadas simultâneas compartilham o mesmo request (só um refresh por vez).
   */
  refresh(): Observable<boolean> {
    this.refreshing ??= this.http
      .post<LoginResponse>(`${this.apiRoot}/auth/refresh`, null, SESSION_REQUEST)
      .pipe(
        map((res) => this.start(res)),
        catchError(() => {
          this.clear();
          return of(false);
        }),
        finalize(() => (this.refreshing = null)),
        shareReplay(1),
      );
    return this.refreshing;
  }

  me(): Observable<MeResponse> {
    return this.http.get<MeResponse>(`${this.apiRoot}/auth/me`);
  }

  /** Encerra a sessão no BE (erros ignorados), limpa o estado local e volta para o login. */
  logout(returnUrl?: string): void {
    this.http
      .post<void>(`${this.apiRoot}/auth/logout`, null, SESSION_REQUEST)
      .subscribe({ error: () => undefined });
    this.signOut(returnUrl);
  }

  /** Encerra só localmente (sessão já inválida no BE) e volta para o login. */
  signOut(returnUrl?: string): void {
    this.clear();
    void this.router.navigate([ADMIN_LOGIN_URL], {
      queryParams: returnUrl ? { returnUrl } : undefined,
    });
  }

  private start(res: LoginResponse): boolean {
    const expiresAtMs = res?.accessToken ? Date.parse(res.expiresAt) : Number.NaN;
    if (Number.isNaN(expiresAtMs)) {
      this.clear();
      return false;
    }
    this.session.set({ token: res.accessToken, expiresAtMs });
    this.clearTimer();
    const delay = Math.max(0, expiresAtMs - Date.now());
    // setTimeout aceita até ~24,8 dias; o BE limita a 1440 min.
    this.expiryTimer = setTimeout(() => this.renewOrSignOut(), Math.min(delay, 2_147_000_000));
    return true;
  }

  /** Token expirou: tenta renovar pelo cookie; se não der, volta para o login. */
  private renewOrSignOut(): void {
    this.refresh().subscribe((ok) => {
      if (!ok) {
        this.signOut();
      }
    });
  }

  private clear(): void {
    this.clearTimer();
    this.session.set(null);
  }

  private clearTimer(): void {
    if (this.expiryTimer !== null) {
      clearTimeout(this.expiryTimer);
      this.expiryTimer = null;
    }
  }
}
