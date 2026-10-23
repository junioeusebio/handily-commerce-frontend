import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize, map } from 'rxjs';

import { LeadService, type LeadCreated } from '@domains';
import { Button, Modal, ToastService } from '@shared';

export const LEAD_SUCCESS_MESSAGE = 'Recebemos seu contato! Em breve retornamos por e-mail.';

/** Payload alinhado ao contrato `POST /api/v1/leads` (BE). */
export interface LeadPayload {
  name: string;
  email: string;
  municipality: string;
  message: string;
}

export type LeadField = keyof LeadPayload;

export const LEAD_MAX = { name: 120, email: 254, municipality: 120, message: 2000 } as const;

const LABELS: Record<LeadField, string> = {
  name: 'Nome',
  email: 'E-mail',
  municipality: 'Município',
  message: 'Mensagem',
};

@Component({
  selector: 'app-lead-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button, Modal, ReactiveFormsModule],
  templateUrl: './lead-dialog.html',
})
export class LeadDialog {
  private readonly modal = viewChild.required(Modal);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly leads = inject(LeadService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toast = inject(ToastService);

  readonly open = model(false);
  readonly contactEmail = input('ajksys@protonmail.com');

  /** Emitido após o BE gravar o lead (201). */
  readonly submitted = output<LeadCreated>();

  /** Envio em andamento (desabilita o botão e mostra "Enviando…"). */
  readonly sending = signal(false);
  /** Resultado do último envio com erro (sucesso fecha o modal e mostra toast). */
  readonly result = signal<'error' | null>(null);
  /** Erros por campo vindos do 400 (ValidationProblem) do BE. */
  private readonly serverErrors = signal<Partial<Record<LeadField, string>>>({});

  protected readonly max = LEAD_MAX;

  protected readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(LEAD_MAX.name)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(LEAD_MAX.email)]],
    municipality: ['', [Validators.required, Validators.maxLength(LEAD_MAX.municipality)]],
    message: ['', [Validators.maxLength(LEAD_MAX.message)]],
  });

  /** Status do form como signal (ponte Reactive Forms → signals). */
  private readonly status = toSignal(this.form.statusChanges, {
    initialValue: this.form.status,
  });

  /** Valores aparados: só espaços não contam como preenchido. */
  private readonly hasBlankRequired = toSignal(
    this.form.valueChanges.pipe(map(() => this.blankRequired())),
    { initialValue: true },
  );

  private readonly clearServerErrors = this.form.valueChanges
    .pipe(takeUntilDestroyed())
    .subscribe(() => {
      if (Object.keys(this.serverErrors()).length) {
        this.serverErrors.set({});
      }
    });

  readonly canSubmit = computed(
    () => this.status() === 'VALID' && !this.hasBlankRequired() && !this.sending(),
  );

  /**
   * Abre o diálogo a partir de um gatilho.
   * @param prefill quando informado, substitui o texto da Mensagem (ex.: curso escolhido).
   */
  openFrom(event?: Event, prefill?: string): void {
    if (prefill !== undefined) {
      this.form.controls.message.setValue(prefill);
    }
    this.result.set(null);
    this.serverErrors.set({});
    this.modal().openFrom(event);
  }

  close(): void {
    this.modal().close();
  }

  /** Mensagem de erro do campo, só depois de tocado/alterado. */
  protected errorFor(field: LeadField): string | null {
    const server = this.serverErrors()[field];
    if (server) {
      return server;
    }
    const control = this.form.controls[field];
    if (!control.invalid || !(control.touched || control.dirty)) {
      return null;
    }
    const errors = control.errors ?? {};
    if (errors['required']) {
      return `Informe ${field === 'email' ? 'o e-mail' : field === 'municipality' ? 'o município' : 'o nome'}.`;
    }
    if (errors['email']) {
      return 'Informe um e-mail válido.';
    }
    if (errors['maxlength']) {
      return `${LABELS[field]} deve ter no máximo ${errors['maxlength'].requiredLength} caracteres.`;
    }
    return null;
  }

  protected onSubmit(event: Event): void {
    event.preventDefault();
    if (!this.canSubmit()) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const message = v.message.trim();
    this.sending.set(true);
    this.result.set(null);
    this.serverErrors.set({});
    this.leads
      .create({
        name: v.name.trim(),
        email: v.email.trim(),
        municipality: v.municipality.trim(),
        ...(message ? { message } : {}),
      })
      .pipe(
        finalize(() => this.sending.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (created) => {
          this.form.reset();
          this.close();
          this.toast.show({ message: LEAD_SUCCESS_MESSAGE, type: 'success' });
          this.submitted.emit(created);
        },
        error: (err: unknown) => {
          this.serverErrors.set(fieldErrors(err));
          this.result.set('error');
        },
      });
  }

  private blankRequired(): boolean {
    const v = this.form.getRawValue();
    return !v.name.trim() || !v.email.trim() || !v.municipality.trim();
  }
}

/** Mapeia `errors` do ValidationProblem (400) para o primeiro erro de cada campo. */
function fieldErrors(err: unknown): Partial<Record<LeadField, string>> {
  if (!(err instanceof HttpErrorResponse) || err.status !== 400) {
    return {};
  }
  const errors = (err.error as { errors?: Record<string, string[]> } | null)?.errors ?? {};
  const out: Partial<Record<LeadField, string>> = {};
  for (const [key, msgs] of Object.entries(errors)) {
    const field = (key.charAt(0).toLowerCase() + key.slice(1)) as LeadField;
    if (field in LABELS && msgs?.[0]) {
      out[field] = msgs[0];
    }
  }
  return out;
}
