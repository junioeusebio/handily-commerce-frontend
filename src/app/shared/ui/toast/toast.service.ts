import { Injectable, OnDestroy, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastOptions {
  message: string;
  type?: ToastType;
  /** Tempo até fechar sozinho (ms). Padrão 10000. Use 0 para não fechar sozinho. */
  durationMs?: number;
}

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

export const TOAST_DEFAULT_DURATION_MS = 10_000;

/** Fila global de notificações (toasts). Renderizada por `<app-toast-container>`. */
@Injectable({ providedIn: 'root' })
export class ToastService implements OnDestroy {
  private readonly items = signal<readonly Toast[]>([]);
  private readonly timers = new Map<number, ReturnType<typeof setTimeout>>();
  private nextId = 1;

  readonly toasts = this.items.asReadonly();

  show({ message, type = 'info', durationMs = TOAST_DEFAULT_DURATION_MS }: ToastOptions): number {
    const id = this.nextId++;
    this.items.update((list) => [...list, { id, message, type }]);
    if (durationMs > 0) {
      this.timers.set(
        id,
        setTimeout(() => this.dismiss(id), durationMs),
      );
    }
    return id;
  }

  dismiss(id: number): void {
    const timer = this.timers.get(id);
    if (timer !== undefined) {
      clearTimeout(timer);
      this.timers.delete(id);
    }
    this.items.update((list) => list.filter((t) => t.id !== id));
  }

  ngOnDestroy(): void {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
  }
}
