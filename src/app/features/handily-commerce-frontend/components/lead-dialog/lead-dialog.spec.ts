import { Component, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { LeadDialog, type LeadPayload } from './lead-dialog';

@Component({
  imports: [LeadDialog],
  template: `<app-lead-dialog (submitted)="last = $event" />`,
})
class Host {
  readonly dialog = viewChild.required(LeadDialog);
  last: LeadPayload | null = null;
}

describe('LeadDialog', () => {
  async function setup(prefill?: string) {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    fixture.componentInstance.dialog().openFrom(undefined, prefill);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const q = <T extends HTMLElement>(sel: string) => root.querySelector(sel) as T;
    const type = (sel: string, value: string) => {
      const el = q<HTMLInputElement>(sel);
      el.value = value;
      el.dispatchEvent(new Event('input'));
      el.dispatchEvent(new Event('blur'));
      fixture.detectChanges();
    };
    const submit = () =>
      Array.from(root.querySelectorAll('button')).find((b) =>
        (b.textContent ?? '').includes('Enviar'),
      ) as HTMLButtonElement;
    return { fixture, root, q, type, submit };
  }

  function fillValid(type: (sel: string, v: string) => void) {
    type('#lead-nome', 'Maria Silva');
    type('#lead-email', 'maria@prefeitura.gov.br');
    type('#lead-municipio', 'Campinas');
  }

  it('should disable Enviar while the form is invalid', async () => {
    const { submit, type } = await setup();
    expect(submit().disabled).toBe(true);
    type('#lead-nome', 'Maria');
    type('#lead-email', 'maria@prefeitura.gov.br');
    expect(submit().disabled).toBe(true);
    type('#lead-municipio', '   ');
    expect(submit().disabled).toBe(true);
  });

  it('should enable Enviar when required fields are valid and emit trimmed payload', async () => {
    const { fixture, submit, type, q } = await setup();
    fillValid(type);
    type('#lead-mensagem', '  Cursos BNCC  ');
    expect(submit().disabled).toBe(false);

    q<HTMLFormElement>('form').requestSubmit();
    fixture.detectChanges();
    expect(fixture.componentInstance.last).toEqual({
      name: 'Maria Silva',
      email: 'maria@prefeitura.gov.br',
      municipality: 'Campinas',
      message: 'Cursos BNCC',
    });
  });

  it('should show Portuguese errors with aria-invalid and aria-describedby after touch', async () => {
    const { q, type, root } = await setup();
    expect(root.querySelector('#lead-email-erro')).toBeNull();
    expect(q('#lead-email').getAttribute('aria-invalid')).toBeNull();

    type('#lead-email', 'nao-e-email');
    const email = q('#lead-email');
    expect(email.getAttribute('aria-invalid')).toBe('true');
    expect(email.getAttribute('aria-describedby')).toBe('lead-email-erro');
    expect(q('#lead-email-erro').textContent).toContain('Informe um e-mail válido.');

    type('#lead-nome', '');
    expect(q('#lead-nome-erro').textContent).toContain('Informe o nome.');

    type('#lead-municipio', 'x'.repeat(121));
    expect(q('#lead-municipio-erro').textContent).toContain('no máximo 120 caracteres');
  });

  it('should prefill Mensagem from the course CTA and keep it optional', async () => {
    const { q, submit, type } = await setup('Tenho interesse no curso "Mundo Digital".');
    expect(q<HTMLTextAreaElement>('#lead-mensagem').value).toContain('Mundo Digital');
    expect(q('#lead-mensagem').getAttribute('aria-invalid')).toBeNull();
    fillValid(type);
    type('#lead-mensagem', '');
    expect(submit().disabled).toBe(false);
  });
});
