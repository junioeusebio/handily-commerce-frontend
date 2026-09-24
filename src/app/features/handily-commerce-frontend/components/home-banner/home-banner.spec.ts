import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { HomeBanner } from './home-banner';

@Component({
  imports: [HomeBanner],
  template: `<app-home-banner (requestLead)="count = count + 1" />`,
})
class Host {
  count = 0;
}

describe('HomeBanner', () => {
  it('should render Por que BNCC agora with three axes and deadline', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('#bncc')).toBeTruthy();
    expect(root.textContent).toContain('Por que BNCC agora');
    expect(root.textContent).toContain('Pensamento Computacional');
    expect(root.textContent).toContain('Mundo Digital');
    expect(root.textContent).toContain('Cultura Digital');
    expect(root.textContent).toContain('2026/2027');
    expect(root.textContent?.toLowerCase()).not.toContain('store');

    const cta = Array.from(root.querySelectorAll('button')).find((b) =>
      (b.textContent ?? '').includes('Fale conosco'),
    ) as HTMLButtonElement;
    cta.click();
    expect(fixture.componentInstance.count).toBe(1);
  });
});
