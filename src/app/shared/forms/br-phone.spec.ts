import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { brPhoneValidator, formatBrPhone, PhoneMask, phoneDigits } from './br-phone';

describe('br-phone', () => {
  it('phoneDigits keeps up to 11 digits', () => {
    expect(phoneDigits('(11) 91234-5678 99')).toBe('11912345678');
    expect(phoneDigits(null)).toBe('');
    expect(phoneDigits(undefined)).toBe('');
  });

  it('formatBrPhone formats progressively', () => {
    expect(formatBrPhone('')).toBe('');
    expect(formatBrPhone('1')).toBe('(1');
    expect(formatBrPhone('11')).toBe('(11');
    expect(formatBrPhone('119')).toBe('(11) 9');
    expect(formatBrPhone('111234')).toBe('(11) 1234');
    expect(formatBrPhone('1112345')).toBe('(11) 1234-5');
    expect(formatBrPhone('1112345678')).toBe('(11) 1234-5678');
    expect(formatBrPhone('11912345678')).toBe('(11) 91234-5678');
    expect(formatBrPhone('abc11912345678000')).toBe('(11) 91234-5678');
  });

  it('brPhoneValidator accepts 10 or 11 digits', () => {
    const v = (value: unknown) => brPhoneValidator(new FormControl(value));
    expect(v('')).toBeNull();
    expect(v(null)).toBeNull();
    expect(v('(11) 1234-5678')).toBeNull();
    expect(v('11912345678')).toBeNull();
    expect(v('(11) 1234')).toEqual({ brPhone: true });
    expect(v('119123456789')).toEqual({ brPhone: true });
  });

  @Component({
    imports: [ReactiveFormsModule, PhoneMask],
    template: `<input appPhoneMask [formControl]="ctrl" />`,
  })
  class Host {
    readonly ctrl = new FormControl('');
  }

  it('PhoneMask formats the input and control value as user types', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.value = '11912345678';
    input.dispatchEvent(new Event('input'));
    expect(input.value).toBe('(11) 91234-5678');
    expect(fixture.componentInstance.ctrl.value).toBe('(11) 91234-5678');
  });
});
