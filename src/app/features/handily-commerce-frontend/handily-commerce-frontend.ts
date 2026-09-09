import { HttpClient } from '@angular/common/http';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, of, retry } from 'rxjs';

import { APP_ENVIRONMENT, APP_VERSION, resolveApiRoot } from '@core';

interface ApiVersionResponse {
  version: string;
}

@Component({
  selector: 'app-handily-commerce-frontend',
  imports: [],
  templateUrl: './handily-commerce-frontend.html',
  styleUrl: './handily-commerce-frontend.css',
})
export class HandilyCommerceFrontend implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly env = inject(APP_ENVIRONMENT);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly title = signal('Handily Commerce Frontend');
  protected readonly feVersion = APP_VERSION;
  /** `—` while loading, API version string on success, `erro` on failure. */
  protected readonly apiVersionLabel = signal('—');

  ngOnInit(): void {
    const url = `${resolveApiRoot(this.env)}/apiVersion`;

    this.http
      .get<ApiVersionResponse>(url)
      .pipe(
        // Brief retries help with transient failures / Render free-tier cold starts.
        retry({ count: 2 }),
        catchError(() => of(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((body) => {
        if (body?.version) {
          this.apiVersionLabel.set(body.version);
        } else {
          this.apiVersionLabel.set('erro');
        }
      });
  }
}
