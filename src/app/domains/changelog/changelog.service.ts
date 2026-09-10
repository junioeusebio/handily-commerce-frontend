import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { APP_ENVIRONMENT, resolveApiRoot } from '@core';

import type { ChangelogItem } from './changelog.model';

/**
 * Reads release notes from the Handily Commerce API.
 * FE only displays; BE generates items from Major/Mirror releases.
 */
@Injectable({ providedIn: 'root' })
export class ChangelogService {
  private readonly http = inject(HttpClient);
  private readonly env = inject(APP_ENVIRONMENT);

  /** `GET ${resolveApiRoot(env)}/changelog` */
  list(): Observable<ChangelogItem[]> {
    const url = `${resolveApiRoot(this.env)}/changelog`;
    return this.http.get<ChangelogItem[]>(url);
  }
}
