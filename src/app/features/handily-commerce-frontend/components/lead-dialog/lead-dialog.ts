import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  model,
  output,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { map } from 'rxjs';

import { Button, Modal } from '@shared';

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

  readonly open = model(false);
  readonly contactEmail = input('ajksys@protonmail.com');

  readonly submitted = output<LeadPayload>();

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

  readonly canSubmit = computed(() => this.status() === 'VALID' && !this.hasBlankRequired());

  /**
   * Abre o diálogo a partir de um gatilho.
   * @param prefill quando informado, substitui o texto da Mensagem (ex.: curso escolhido).
   */
  openFrom(event?: Event, prefill?: string): void {
    if (prefill !== undefined) {
      this.form.controls.message.setValue(prefill);
    }
    this.modal().openFrom(event);
  }

  close(): void {
    this.modal().close();
  }

  /** Mensagem de erro do campo, só depois de tocado/alterado. */
  protected errorFor(field: LeadField): string | null {
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
    this.submitted.emit({
      name: v.name.trim(),
      email: v.email.trim(),
      municipality: v.municipality.trim(),
      message: v.message.trim(),
    });
  }

  private blankRequired(): boolean {
    const v = this.form.getRawValue();
    return !v.name.trim() || !v.email.trim() || !v.municipality.trim();
  }
}
