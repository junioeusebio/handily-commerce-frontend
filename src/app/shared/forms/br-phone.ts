import { Directive, ElementRef, HostListener, inject } from '@angular/core';
import {
  NgControl,
  type AbstractControl,
  type ValidationErrors,
  type ValidatorFn,
} from '@angular/forms';

/** Mantém só dígitos (máx. 11: DDD + 9 dígitos). */
export function phoneDigits(value: string | null | undefined): string {
  return (value ?? '').replace(/\D/g, '').slice(0, 11);
}

/** Formata telefone BR enquanto digita: `(11) 1234-5678` ou `(11) 91234-5678`. */
export function formatBrPhone(value: string | null | undefined): string {
  const d = phoneDigits(value);
  if (!d) {
    return '';
  }
  if (d.length <= 2) {
    return `(${d}`;
  }
  const ddd = d.slice(0, 2);
  const rest = d.slice(2);
  const split = d.length === 11 ? 5 : 4;
  if (rest.length <= split) {
    return `(${ddd}) ${rest}`;
  }
  return `(${ddd}) ${rest.slice(0, split)}-${rest.slice(split)}`;
}

/** Valida telefone BR com 10 ou 11 dígitos (vazio fica para o `required`). */
export const brPhoneValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const raw = String(control.value ?? '');
  if (!raw.trim()) {
    return null;
  }
  const len = raw.replace(/\D/g, '').length;
  return len === 10 || len === 11 ? null : { brPhone: true };
};

/** Aplica a máscara de telefone BR no input (usar com `formControlName`). */
@Directive({ selector: 'input[appPhoneMask]' })
export class PhoneMask {
  private readonly el = inject<ElementRef<HTMLInputElement>>(ElementRef);
  private readonly ngControl = inject(NgControl, { optional: true, self: true });

  @HostListener('input')
  protected onInput(): void {
    const formatted = formatBrPhone(this.el.nativeElement.value);
    this.el.nativeElement.value = formatted;
    const control = this.ngControl?.control;
    if (control && control.value !== formatted) {
      control.setValue(formatted);
    }
  }
}
