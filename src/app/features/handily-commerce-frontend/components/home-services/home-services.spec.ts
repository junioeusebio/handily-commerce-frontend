import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { HomeServices } from './home-services';

@Component({
  imports: [HomeServices],
  template: `<app-home-services (requestLead)="count = count + 1" />`,
})
class Host {
  count = 0;
}

describe('HomeServices', () => {
  it('should render Serviços pillars and emit requestLead', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('#servicos')).toBeTruthy();
    expect(root.textContent).toContain('Serviços');
    expect(root.textContent).toContain('Desenvolvimento de sistemas');
    expect(root.textContent).toContain('Administração e gestão para municípios');
    expect(root.textContent?.toLowerCase()).not.toContain('store');

    const cta = Array.from(root.querySelectorAll('button')).find((b) =>
      (b.textContent ?? '').includes('Falar sobre sistemas'),
    ) as HTMLButtonElement;
    cta.click();
    expect(fixture.componentInstance.count).toBe(1);
  });
});
