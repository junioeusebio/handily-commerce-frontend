import { HttpClient } from '@angular/common/http';
import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

import { APP_ENVIRONMENT, resolveApiRoot } from '../config/app-environment';

/** Corpo de `POST {apiRoot}/auth/login`. */
export interface LoginRequest {
  email: string;
  password: string;
}

/** Resposta 200 de `POST {apiRoot}/auth/login`. */
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

/**
 * Sessão do admin. O token fica **só em memória** (signal): recarregar a página
 * exige novo login. Logout automático quando `expiresAt` chega.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly env = inject(APP_ENVIRONMENT);
  private readonly router = inject(Router);

  private readonly session = signal<Session | null>(null);
  private expiryTimer: ReturnType<typeof setTimeout> | null = null;

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
      .post<LoginResponse>(`${this.apiRoot}/auth/login`, body)
      .pipe(tap((res) => this.start(res)));
  }

  me(): Observable<MeResponse> {
    return this.http.get<MeResponse>(`${this.apiRoot}/auth/me`);
  }

  /** Encerra a sessão e volta para o login. */
  logout(returnUrl?: string): void {
    this.clear();
    void this.router.navigate([ADMIN_LOGIN_URL], {
      queryParams: returnUrl ? { returnUrl } : undefined,
    });
  }

  private start(res: LoginResponse): void {
    const expiresAtMs = Date.parse(res.expiresAt);
    if (!res.accessToken || Number.isNaN(expiresAtMs)) {
      this.clear();
      return;
    }
    this.session.set({ token: res.accessToken, expiresAtMs });
    this.clearTimer();
    const delay = Math.max(0, expiresAtMs - Date.now());
    // setTimeout aceita até ~24,8 dias; o BE limita a 1440 min.
    this.expiryTimer = setTimeout(() => this.logout(), Math.min(delay, 2_147_000_000));
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
