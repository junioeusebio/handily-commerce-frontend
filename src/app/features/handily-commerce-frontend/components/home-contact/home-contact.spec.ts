import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { HomeContact } from './home-contact';

@Component({
  imports: [HomeContact],
  template: `<app-home-contact
    [contactEmail]="email"
    (requestLead)="count = count + 1"
  />`,
})
class Host {
  email = 'ajksys@protonmail.com';
  count = 0;
}

describe('HomeContact', () => {
  it('should render Fale conosco with email and open lead CTA', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('#contato')).toBeTruthy();
    expect(root.textContent).toContain('Fale conosco');
    expect(root.textContent).toContain('ajksys@protonmail.com');
    expect(root.querySelector('a[href="mailto:ajksys@protonmail.com"]')).toBeTruthy();
    expect(root.textContent?.toLowerCase()).not.toContain('store');

    const cta = Array.from(root.querySelectorAll('button')).find((b) =>
      (b.textContent ?? '').includes('Solicitar orçamento'),
    ) as HTMLButtonElement;
    expect(cta).toBeTruthy();
    expect(cta.getAttribute('aria-haspopup')).toBe('dialog');
    expect(cta.getAttribute('aria-controls')).toBe('lead-dialog');
    cta.click();
    expect(fixture.componentInstance.count).toBe(1);
  });
});
