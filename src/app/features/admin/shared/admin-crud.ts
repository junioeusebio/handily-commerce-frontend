import { DestroyRef, Directive, inject, signal, type OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, type Observable } from 'rxjs';

import { ADMIN_LIMITS } from '@domains';
import { ToastService } from '@shared';

import { ADMIN_INPUT, errorMessage, validationErrors } from './admin-errors';

/**
 * Estado e fluxo comuns às telas de CRUD do admin (listar, criar/editar em modal,
 * apagar com confirmação). Cada tela define como listar, apagar e o rótulo.
 */
@Directive()
export abstract class AdminCrudPage<T extends { id: string }> implements OnInit {
  protected readonly toast = inject(ToastService);
  protected readonly destroyRef = inject(DestroyRef);

  protected readonly limits = ADMIN_LIMITS;
  protected readonly inputClass = ADMIN_INPUT;

  protected readonly items = signal<T[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  /** null = criando; senão o id em edição. */
  protected readonly editingId = signal<string | null>(null);
  protected readonly formOpen = signal(false);
  protected readonly saving = signal(false);
  protected readonly serverErrors = signal<Record<string, string>>({});
  protected readonly formError = signal<string | null>(null);

  protected readonly toDelete = signal<T | null>(null);
  protected readonly confirmOpen = signal(false);
  protected readonly deleting = signal(false);

  /** Ex.: `{ created: 'Curso criado.', updated: 'Curso atualizado.', deleted: 'Curso apagado.' }`. */
  protected abstract readonly messages: { created: string; updated: string; deleted: string };
  protected abstract fetch(): Observable<T[]>;
  protected abstract remove(id: string): Observable<unknown>;

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.fetch()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (list) => {
          this.items.set(list);
          this.loading.set(false);
        },
        error: (err: unknown) => {
          this.error.set(errorMessage(err));
          this.loading.set(false);
        },
      });
  }

  protected openForm(editingId: string | null): void {
    this.editingId.set(editingId);
    this.serverErrors.set({});
    this.formError.set(null);
    this.formOpen.set(true);
  }

  /** Mensagem de validação do cliente para um controle (BE tem prioridade via `serverErrors`). */
  protected clientError(
    errors: Record<string, { requiredLength?: number; min?: number; max?: number }> | null,
    extra: Record<string, string> = {},
  ): string | null {
    const e = errors ?? {};
    if (e['required']) return 'Campo obrigatório.';
    if (e['maxlength']) return `No máximo ${e['maxlength'].requiredLength} caracteres.`;
    for (const [key, msg] of Object.entries(extra)) {
      if (e[key]) return msg;
    }
    if (e['min']) return `Valor mínimo: ${e['min'].min}.`;
    if (e['max']) return `Valor máximo: ${e['max'].max}.`;
    return null;
  }

  protected submit(req: Observable<unknown>): void {
    const editing = this.editingId();
    this.saving.set(true);
    this.serverErrors.set({});
    this.formError.set(null);
    req
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.formOpen.set(false);
          this.toast.show({
            message: editing ? this.messages.updated : this.messages.created,
            type: 'success',
          });
          this.load();
        },
        error: (err: unknown) => {
          this.serverErrors.set(validationErrors(err));
          this.formError.set(errorMessage(err));
        },
      });
  }

  protected askDelete(item: T): void {
    this.toDelete.set(item);
    this.confirmOpen.set(true);
  }

  protected confirmDelete(): void {
    const item = this.toDelete();
    if (!item || this.deleting()) {
      return;
    }
    this.deleting.set(true);
    this.remove(item.id)
      .pipe(
        finalize(() => this.deleting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.confirmOpen.set(false);
          this.toast.show({ message: this.messages.deleted, type: 'success' });
          this.load();
        },
        error: (err: unknown) => this.toast.show({ message: errorMessage(err), type: 'error' }),
      });
  }
}
