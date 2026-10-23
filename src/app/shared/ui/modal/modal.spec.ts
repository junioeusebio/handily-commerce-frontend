import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { Modal } from './modal';

@Component({
  imports: [Modal],
  template: `
    <app-modal
      [open]="open()"
      [dismissDisabled]="locked()"
      (openChange)="open.set($event)"
      dialogId="smoke-dialog"
      titleId="t"
    >
      <h2 id="t">Hello</h2>
      <button type="button" (click)="open.set(false)">Close</button>
    </app-modal>
  `,
})
class Host {
  readonly open = signal(false);
  readonly locked = signal(false);
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

  it('should block Esc, backdrop and cancel while dismissDisabled, and allow them otherwise', async () => {
    const fixture = TestBed.createComponent(Host);
    const host = fixture.componentInstance;
    host.locked.set(true);
    host.open.set(true);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const dialog = fixture.nativeElement.querySelector('dialog') as HTMLDialogElement;

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    dialog.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    dialog.dispatchEvent(new Event('cancel', { cancelable: true }));
    fixture.detectChanges();
    expect(host.open()).toBe(true);

    host.locked.set(false);
    fixture.detectChanges();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(host.open()).toBe(false);
  });
});
