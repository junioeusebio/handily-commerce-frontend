import { TestBed } from '@angular/core/testing';

import { HomeAbout } from './home-about';

describe('HomeAbout', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeAbout],
    }).compileComponents();
  });

  it('should create and render Quem somos with AJKSys and Handily', () => {
    const fixture = TestBed.createComponent(HomeAbout);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(fixture.componentInstance).toBeTruthy();
    expect(root.querySelector('#quem-somos')).toBeTruthy();
    expect(root.textContent).toContain('Quem somos');
    expect(root.textContent).toContain('AJKSys Consulting');
    expect(root.textContent).toContain('Handily');
    expect(root.textContent).toContain('SPA pública');
    expect(root.textContent?.toLowerCase()).not.toContain('store');
  });
});
