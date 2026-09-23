import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { Button } from './button';

@Component({
  imports: [Button],
  template: `<app-button variant="primary" (pressed)="clicked = true">Go</app-button>`,
})
class Host {
  clicked = false;
}

describe('Button', () => {
  it('should render and emit pressed', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(button.textContent).toContain('Go');
    expect(button.disabled).toBe(false);
    button.click();
    expect(fixture.componentInstance.clicked).toBe(true);
  });

  it('should honor disabled', () => {
    @Component({
      imports: [Button],
      template: `<app-button [disabled]="true">X</app-button>`,
    })
    class DisabledHost {}

    const fixture = TestBed.createComponent(DisabledHost);
    fixture.detectChanges();
    expect((fixture.nativeElement.querySelector('button') as HTMLButtonElement).disabled).toBe(
      true,
    );
  });
});
