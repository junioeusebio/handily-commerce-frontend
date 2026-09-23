import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type CardTone = 'default' | 'dash';

@Component({
  selector: 'app-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './card.html',
})
export class Card {
  readonly title = input<string | null>(null);
  readonly tone = input<CardTone>('default');
  readonly className = input('');

  protected shellClasses(): string {
    const base =
      'flex min-h-[11.5rem] flex-col rounded-2xl p-[1.2rem]';
    const byTone: Record<CardTone, string> = {
      default:
        'border border-[#d7e0ec] bg-white shadow-[0_10px_28px_rgba(7,17,31,0.06)]',
      dash: 'border border-dashed border-[#1e5bb8]/35 bg-[linear-gradient(180deg,#fff,#e8f1fb)]',
    };
    return `${base} ${byTone[this.tone()]} ${this.className()}`.trim();
  }
}
