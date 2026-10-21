import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type LoadingVariant = 'spinner' | 'skeleton-cards' | 'skeleton-list';
export type LoadingSize = 'sm' | 'md' | 'lg';

/** Indicador de carregamento reutilizável (spinner ou skeleton), acessível. */
@Component({
  selector: 'app-loading',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './loading.html',
})
export class Loading {
  readonly variant = input<LoadingVariant>('spinner');
  /** Texto para leitores de tela; visível apenas no spinner. */
  readonly message = input('Carregando…');
  /** Quantidade de itens de skeleton. */
  readonly count = input(3);
  readonly size = input<LoadingSize>('md');
  readonly className = input('');

  protected readonly items = computed(() =>
    Array.from({ length: Math.max(1, Math.floor(this.count())) }, (_, i) => i),
  );

  protected readonly spinnerClasses = computed(() => {
    const bySize: Record<LoadingSize, string> = {
      sm: 'size-4 border-2',
      md: 'size-8 border-[3px]',
      lg: 'size-12 border-4',
    };
    return `${bySize[this.size()]} inline-block rounded-full border-[#d7e0ec] border-t-[#1e5bb8] motion-safe:animate-spin`;
  });
}
