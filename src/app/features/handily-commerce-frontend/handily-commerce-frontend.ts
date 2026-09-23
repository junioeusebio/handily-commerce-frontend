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
import { ApiStatusService } from '@domains';

@Component({
  selector: 'app-handily-commerce-frontend',
  imports: [NgOptimizedImage],
  templateUrl: './handily-commerce-frontend.html',
  styleUrl: './handily-commerce-frontend.scss',
})
export class HandilyCommerceFrontend implements OnInit {
  private readonly apiStatus = inject(ApiStatusService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);

  private readonly leadDialog = viewChild<ElementRef<HTMLDialogElement>>('leadDialog');
  private readonly nomeInput = viewChild<ElementRef<HTMLInputElement>>('nomeInput');
  private leadTrigger: HTMLElement | null = null;

  protected readonly feVersion = APP_VERSION;
  /** `—` while loading, API version string on success, `erro` on failure. */
  protected readonly apiVersionLabel = signal('—');
  /** `—` while loading, `ok` when ping succeeds, `erro` on failure. */
  protected readonly apiStatusLabel = signal('—');
  protected readonly leadOpen = signal(false);

  protected readonly contactEmail = 'ajksys@protonmail.com';

  ngOnInit(): void {
    this.loadApiVersion();
    this.loadPingStatus();
  }

  protected openLead(event?: Event): void {
    const target = event?.currentTarget;
    this.leadTrigger = target instanceof HTMLElement ? target : null;
    this.leadOpen.set(true);
    afterNextRender(
      () => {
        this.leadDialog()?.nativeElement.showModal();
        this.nomeInput()?.nativeElement.focus();
      },
      { injector: this.injector },
    );
  }

  protected closeLead(): void {
    const dialog = this.leadDialog()?.nativeElement;
    if (dialog?.open) {
      dialog.close();
    }
    this.leadOpen.set(false);
    const trigger = this.leadTrigger;
    this.leadTrigger = null;
    queueMicrotask(() => trigger?.focus());
  }

  protected onLeadSubmit(event: Event): void {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const data = new FormData(form);
    const nome = String(data.get('nome') ?? '').trim();
    const contato = String(data.get('contato') ?? '').trim();
    const solicitacao = String(data.get('solicitacao') ?? '').trim();
    if (!nome || !contato || !solicitacao) {
      return;
    }
    const subject = encodeURIComponent(`Orçamento Handily — ${nome}`);
    const body = encodeURIComponent(
      `Nome: ${nome}\nContato: ${contato}\n\nSolicitação:\n${solicitacao}`,
    );
    window.location.href = `mailto:${this.contactEmail}?subject=${subject}&body=${body}`;
    this.closeLead();
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
      this.closeLead();
    }
  }

  /** Escape: keep Angular state in sync with the native dialog. */
  protected onDialogCancel(event: Event): void {
    event.preventDefault();
    this.closeLead();
  }

  @HostListener('document:keydown', ['$event'])
  protected onDocumentKeydown(event: KeyboardEvent): void {
    if (!this.leadOpen()) {
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      this.closeLead();
      return;
    }
    if (event.key === 'Tab') {
      this.trapFocus(event);
    }
  }

  private trapFocus(event: KeyboardEvent): void {
    const panel = this.leadDialog()?.nativeElement;
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
}
