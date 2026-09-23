import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  HostListener,
  inject,
  Injector,
  input,
  model,
  output,
  viewChild,
} from '@angular/core';

@Component({
  selector: 'app-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './modal.html',
})
export class Modal {
  private readonly injector = inject(Injector);
  private readonly dialogRef = viewChild<ElementRef<HTMLDialogElement>>('dialogEl');

  /** Two-way open state for the dialog. */
  readonly open = model(false);
  readonly titleId = input('modal-title');
  readonly dialogId = input('app-modal');
  readonly labelledBy = input<string | null>(null);
  readonly initialFocusSelector = input<string | null>(null);
  readonly panelClass = input('');

  readonly closed = output<void>();

  /** Tracks the element that opened the dialog so focus can return. */
  private trigger: HTMLElement | null = null;

  constructor() {
    effect(() => {
      const isOpen = this.open();
      afterNextRender(
        () => {
          const dialog = this.dialogRef()?.nativeElement;
          if (!dialog) {
            return;
          }
          if (isOpen) {
            if (!dialog.open) {
              dialog.showModal();
            }
            const selector = this.initialFocusSelector();
            const focusTarget = selector
              ? (dialog.querySelector(selector) as HTMLElement | null)
              : null;
            (focusTarget ?? dialog).focus();
          } else if (dialog.open) {
            dialog.close();
          }
        },
        { injector: this.injector },
      );
    });
  }

  /** Open from a click trigger and remember it for focus restore. */
  openFrom(event?: Event): void {
    const target = event?.currentTarget;
    this.trigger = target instanceof HTMLElement ? target : null;
    this.open.set(true);
  }

  close(): void {
    this.open.set(false);
    this.closed.emit();
    const trigger = this.trigger;
    this.trigger = null;
    queueMicrotask(() => trigger?.focus());
  }

  protected onDialogClick(event: MouseEvent): void {
    this.dismissIfBackdrop(event);
  }

  protected onDialogKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }
    event.preventDefault();
    this.dismissIfBackdrop(event);
  }

  protected onDialogCancel(event: Event): void {
    event.preventDefault();
    this.close();
  }

  private dismissIfBackdrop(event: Event): void {
    if (event.target === event.currentTarget) {
      this.close();
    }
  }

  @HostListener('document:keydown', ['$event'])
  protected onDocumentKeydown(event: KeyboardEvent): void {
    if (!this.open()) {
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
      return;
    }
    if (event.key === 'Tab') {
      this.trapFocus(event);
    }
  }

  private trapFocus(event: KeyboardEvent): void {
    const panel = this.dialogRef()?.nativeElement;
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
}
