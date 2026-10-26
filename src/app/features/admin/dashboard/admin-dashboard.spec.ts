import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { adminTestProviders, API_ROOT } from '../shared/admin-testing';
import { AdminDashboard } from './admin-dashboard';

describe('AdminDashboard', () => {
  it('shows summary counts, and an error with retry', () => {
    TestBed.configureTestingModule({ providers: adminTestProviders() });
    const http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(AdminDashboard);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    http.expectOne(`${API_ROOT}/admin/summary`).flush(null, { status: 500, statusText: 'x' });
    fixture.detectChanges();
    expect(el.querySelector('[role=alert]')).toBeTruthy();
    el.querySelector<HTMLButtonElement>('[role=alert] button')!.click();
    http.expectOne(`${API_ROOT}/admin/summary`).flush({
      leads: { total: 5, novo: 3, contatado: 1, descartado: 1 },
      courses: 4,
      products: 2,
    });
    fixture.detectChanges();
    expect(el.querySelector('[data-testid=leads-total]')?.textContent).toContain('5');
    expect(el.querySelector('[data-testid=courses-total]')?.textContent).toContain('4');
    expect(el.querySelector('[data-testid=products-total]')?.textContent).toContain('2');
    http.verify();
  });
});
