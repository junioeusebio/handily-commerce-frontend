import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';

export type ButtonVariant = 'primary' | 'outline' | 'ghost';

@Component({
  selector: 'app-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './button.html',
})
export class Button {
  readonly variant = input<ButtonVariant>('primary');
  readonly type = input<'button' | 'submit'>('button');
  readonly disabled = input(false);
  readonly ariaHaspopup = input<string | null>(null);
  readonly ariaExpanded = input<boolean | null>(null);
  readonly ariaControls = input<string | null>(null);
  readonly className = input('');

  readonly pressed = output<MouseEvent>();

  protected classes(): string {
    const base =
      'inline-flex items-center justify-center rounded-full px-[1.15rem] py-[0.6rem] text-sm font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60';
    const byVariant: Record<ButtonVariant, string> = {
      primary:
        'border-0 bg-[#f97316] text-white hover:bg-[#ea580c] focus-visible:outline-[#f97316]',
      outline:
        'border border-white/45 bg-transparent text-white hover:bg-white/5 focus-visible:outline-white',
      ghost:
        'border border-[#d7e0ec] bg-white text-[#0c1c33] hover:bg-[#f3f6fa] focus-visible:outline-[#1e5bb8]',
    };
    return `${base} ${byVariant[this.variant()]} ${this.className()}`.trim();
  }

  protected onClick(event: MouseEvent): void {
    if (this.disabled()) {
      return;
    }
    this.pressed.emit(event);
  }
}
