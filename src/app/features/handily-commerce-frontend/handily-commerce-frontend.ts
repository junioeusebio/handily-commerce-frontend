import { NgOptimizedImage } from '@angular/common';
import {
  afterNextRender,
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  inject,
  Injector,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, of, retry } from 'rxjs';

import { APP_VERSION } from '@core';
import { ApiStatusService, ChangelogService, type ChangelogItem } from '@domains';

@Component({
  selector: 'app-handily-commerce-frontend',
  imports: [NgOptimizedImage],
  templateUrl: './handily-commerce-frontend.html',
  styleUrl: './handily-commerce-frontend.scss',
})
export class HandilyCommerceFrontend implements OnInit {
  private readonly apiStatus = inject(ApiStatusService);
  private readonly changelogApi = inject(ChangelogService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);

  private readonly openButton = viewChild<ElementRef<HTMLButtonElement>>('openChangelogBtn');
  private readonly closeButton = viewChild<ElementRef<HTMLButtonElement>>('closeChangelogBtn');
  private readonly modalPanel = viewChild<ElementRef<HTMLDialogElement>>('changelogPanel');

  protected readonly feVersion = APP_VERSION;
  /** `—` while loading, API version string on success, `erro` on failure. */
  protected readonly apiVersionLabel = signal('—');
  /** `—` while loading, `ok` when ping succeeds, `erro` on failure. */
  protected readonly apiStatusLabel = signal('—');

  protected readonly changelogOpen = signal(false);
  /** `idle` until opened; then `loading` / `ok` / `error` (empty list is still `ok`). */
  protected readonly changelogStatus = signal<'idle' | 'loading' | 'ok' | 'error'>('idle');
  protected readonly changelogItems = signal<ChangelogItem[]>([]);

  ngOnInit(): void {
    this.loadApiVersion();
    this.loadPingStatus();
  }

  protected openChangelog(): void {
    this.changelogOpen.set(true);
    this.loadChangelog();
    afterNextRender(
      () => {
        this.modalPanel()?.nativeElement.showModal();
        this.closeButton()?.nativeElement.focus();
      },
      { injector: this.injector },
    );
  }

  protected closeChangelog(): void {
    const dialog = this.modalPanel()?.nativeElement;
    if (dialog?.open) {
      dialog.close();
    }
    this.changelogOpen.set(false);
    queueMicrotask(() => this.openButton()?.nativeElement.focus());
  }

  /** Backdrop dismiss: interaction on the dialog itself (not its children). */
  protected onDialogClick(event: MouseEvent): void {
    this.dismissIfBackdrop(event);
  }

  /** Keyboard equivalent for backdrop dismiss (Enter / Space). */
  protected onDialogKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }
    event.preventDefault();
    this.dismissIfBackdrop(event);
  }

  private dismissIfBackdrop(event: Event): void {
    if (event.target === event.currentTarget) {
      this.closeChangelog();
    }
  }

  /** Escape: keep Angular state in sync with the native dialog. */
  protected onDialogCancel(event: Event): void {
    event.preventDefault();
    this.closeChangelog();
  }

  @HostListener('document:keydown', ['$event'])
  protected onDocumentKeydown(event: KeyboardEvent): void {
    if (!this.changelogOpen()) {
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      this.closeChangelog();
      return;
    }
    if (event.key === 'Tab') {
      this.trapFocus(event);
    }
  }

  private trapFocus(event: KeyboardEvent): void {
    const panel = this.modalPanel()?.nativeElement;
    if (!panel) {
      return;
    }
    const focusable = panel.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    if (focusable.length === 0) {
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement as HTMLElement | null;

    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  private loadApiVersion(): void {
    this.apiStatus
      .apiVersion()
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

  private loadPingStatus(): void {
    this.apiStatus
      .ping()
      .pipe(
        retry({ count: 2 }),
        catchError(() => of(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((body) => {
        if (body?.status === 'ok') {
          this.apiStatusLabel.set('ok');
        } else {
          this.apiStatusLabel.set('erro');
        }
      });
  }

  private loadChangelog(): void {
    this.changelogStatus.set('loading');
    this.changelogItems.set([]);

    this.changelogApi
      .list()
      .pipe(
        retry({ count: 2 }),
        catchError(() => of(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((items) => {
        if (items) {
          this.changelogItems.set(items);
          this.changelogStatus.set('ok');
        } else {
          this.changelogItems.set([]);
          this.changelogStatus.set('error');
        }
      });
  }
}
