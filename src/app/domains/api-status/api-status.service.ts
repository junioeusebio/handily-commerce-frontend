import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { APP_ENVIRONMENT, resolveApiRoot } from '@core';

import type {
  ApiVersionResponse,
  HealthResponse,
  PingResponse,
} from './api-status.model';

/**
 * Centralizes Handily Commerce API health/ping/version probes.
 * Features should use this instead of raw HttpClient for these endpoints.
 */
@Injectable({ providedIn: 'root' })
export class ApiStatusService {
  private readonly http = inject(HttpClient);
  private readonly env = inject(APP_ENVIRONMENT);

  private apiRoot(): string {
    return resolveApiRoot(this.env);
  }

  /** `GET ${resolveApiRoot(env)}/ping` */
  ping(): Observable<PingResponse> {
    return this.http.get<PingResponse>(`${this.apiRoot()}/ping`);
  }

  /** `GET ${resolveApiRoot(env)}/health` */
  health(): Observable<HealthResponse> {
    return this.http.get<HealthResponse>(`${this.apiRoot()}/health`);
  }

  /** `GET ${resolveApiRoot(env)}/apiVersion` */
  apiVersion(): Observable<ApiVersionResponse> {
    return this.http.get<ApiVersionResponse>(`${this.apiRoot()}/apiVersion`);
  }
}
