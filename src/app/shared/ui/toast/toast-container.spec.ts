import { TestBed } from '@angular/core/testing';

import { ToastContainer } from './toast-container';
import { ToastService } from './toast.service';

describe('ToastContainer', () => {
  it('should render toasts top-right and close on X', () => {
    const fixture = TestBed.createComponent(ToastContainer);
    const service = TestBed.inject(ToastService);
    service.show({ message: 'Enviado!', type: 'success', durationMs: 0 });
    service.show({ message: 'Falhou', type: 'error', durationMs: 0 });
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const region = root.querySelector('[role="status"]') as HTMLElement;
    expect(region.getAttribute('aria-live')).toBe('polite');
    expect(region.className).toContain('top-4');
    expect(region.className).toContain('right-4');
    const ok = root.querySelector('[data-toast-type="success"]') as HTMLElement;
    expect(ok.textContent).toContain('Enviado!');
    expect(ok.className).toContain('bg-green-600');

    (ok.querySelector('button[aria-label="Fechar notificação"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(root.querySelector('[data-toast-type="success"]')).toBeNull();
    expect(root.textContent).toContain('Falhou');
  });
});
