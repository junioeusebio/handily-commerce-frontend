import { TestBed } from '@angular/core/testing';

import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    vi.useFakeTimers();
    service = TestBed.inject(ToastService);
  });

  afterEach(() => vi.useRealTimers());

  it('should show a toast and auto-dismiss after 10s by default', () => {
    service.show({ message: 'Oi', type: 'success' });
    expect(service.toasts()).toEqual([{ id: 1, message: 'Oi', type: 'success' }]);
    vi.advanceTimersByTime(9_999);
    expect(service.toasts().length).toBe(1);
    vi.advanceTimersByTime(1);
    expect(service.toasts()).toEqual([]);
  });

  it('should default type to info and dismiss manually clearing the timer', () => {
    const id = service.show({ message: 'A' });
    service.show({ message: 'B', durationMs: 0 });
    expect(service.toasts()[0].type).toBe('info');
    service.dismiss(id);
    expect(service.toasts().map((t) => t.message)).toEqual(['B']);
    vi.advanceTimersByTime(60_000);
    expect(service.toasts().map((t) => t.message)).toEqual(['B']);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('should clear pending timers on destroy', () => {
    service.show({ message: 'A', durationMs: 500 });
    service.ngOnDestroy();
    expect(vi.getTimerCount()).toBe(0);
  });
});
