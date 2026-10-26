import { TestBed } from '@angular/core/testing';

import { AuthService } from '@core';

import { adminTestProviders } from '../shared/admin-testing';
import { AdminShell } from './admin-shell';

describe('AdminShell', () => {
  it('renders the admin banner, nav and logs out', () => {
    TestBed.configureTestingModule({ providers: adminTestProviders() });
    const logout = vi
      .spyOn(TestBed.inject(AuthService), 'logout')
      .mockImplementation(() => undefined);
    const fixture = TestBed.createComponent(AdminShell);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Área administrativa');
    expect(el.querySelectorAll('nav a').length).toBe(4);
    expect(el.querySelector('a[href="#admin-conteudo"]')).toBeTruthy();
    const sair = [...el.querySelectorAll('button')].find((b) => b.textContent?.includes('Sair'))!;
    sair.click();
    expect(logout).toHaveBeenCalled();
  });
});
