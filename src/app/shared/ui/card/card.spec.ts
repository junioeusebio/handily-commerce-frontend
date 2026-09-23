import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { Card } from './card';

@Component({
  imports: [Card],
  template: `
    <app-card title="Sample">
      <span cardBadge>Tag</span>
      <p>Body</p>
      <button type="button" cardFooter>More</button>
    </app-card>
  `,
})
class Host {}

describe('Card', () => {
  it('should render title, badge slot, body, and footer', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('h3')?.textContent).toContain('Sample');
    expect(root.textContent).toContain('Tag');
    expect(root.textContent).toContain('Body');
    expect(root.textContent).toContain('More');
  });
});
