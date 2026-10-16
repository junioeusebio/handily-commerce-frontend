import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { APP_ENVIRONMENT, resolveApiRoot } from '@core';

import type { LeadCreated, LeadRequest } from './lead.model';

/**
 * Grava contatos do "Fale conosco" na Handily Commerce API.
 * BE valida e persiste (`POST {apiRoot}/leads`); FE só envia.
 */
@Injectable({ providedIn: 'root' })
export class LeadService {
  private readonly http = inject(HttpClient);
  private readonly env = inject(APP_ENVIRONMENT);

  /** `POST ${resolveApiRoot(env)}/leads` → 201 `{ id }` */
  create(lead: LeadRequest): Observable<LeadCreated> {
    return this.http.post<LeadCreated>(`${resolveApiRoot(this.env)}/leads`, lead);
  }
}
