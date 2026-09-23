import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { Modal } from './modal';

@Component({
  imports: [Modal],
  template: `
    <app-modal [open]="open()" (openChange)="open.set($event)" dialogId="smoke-dialog" titleId="t">
      <h2 id="t">Hello</h2>
      <button type="button" (click)="open.set(false)">Close</button>
    </app-modal>
  `,
})
class Host {
  readonly open = signal(false);
}

describe('Modal', () => {
  it('should render dialog when open and hide when closed', async () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('dialog')).toBeNull();

    fixture.componentInstance.open.set(true);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const dialog = fixture.nativeElement.querySelector('dialog#smoke-dialog') as HTMLDialogElement;
    expect(dialog).toBeTruthy();
    expect(dialog.textContent).toContain('Hello');
  });
});
