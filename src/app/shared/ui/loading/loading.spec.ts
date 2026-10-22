import { TestBed } from '@angular/core/testing';

import { Loading } from './loading';

function render(inputs: Record<string, unknown> = {}) {
  const fixture = TestBed.createComponent(Loading);
  for (const [k, v] of Object.entries(inputs)) fixture.componentRef.setInput(k, v);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('Loading', () => {
  it('renders an accessible spinner by default', () => {
    const root = render();
    const status = root.querySelector('[role="status"]');
    expect(status?.getAttribute('aria-live')).toBe('polite');
    expect(root.querySelector('.sr-only')?.textContent).toContain('Carregando');
    expect(root.querySelector('.loading-spinner')).toBeTruthy();
    expect(root.querySelector('.motion-safe\\:animate-spin')?.className).toContain('size-8');
  });

  it('applies spinner size and custom message', () => {
    const root = render({ size: 'lg', message: 'Aguarde' });
    expect(root.querySelector('.motion-safe\\:animate-spin')?.className).toContain('size-12');
    expect(root.textContent).toContain('Aguarde');
    expect(
      render({ size: 'sm' }).querySelector('.motion-safe\\:animate-spin')?.className,
    ).toContain('size-4');
  });

  it('renders skeleton cards with count', () => {
    const root = render({ variant: 'skeleton-cards', count: 4, className: 'mt-2' });
    expect(root.querySelectorAll('.loading-skeleton-cards > li').length).toBe(4);
    expect(root.querySelector('[role="status"]')?.className).toContain('mt-2');
  });

  it('renders skeleton list and clamps count to at least 1', () => {
    const root = render({ variant: 'skeleton-list', count: 0 });
    expect(root.querySelectorAll('.loading-skeleton-list > li').length).toBe(1);
  });
});
