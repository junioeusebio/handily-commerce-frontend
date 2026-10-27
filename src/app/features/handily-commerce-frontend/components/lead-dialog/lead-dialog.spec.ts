import { Component, viewChild } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { provideAppEnvironment, resolveApiRoot, type AppEnvironment } from '@core';
import type { LeadCreated } from '@domains';

import { ToastService } from '@shared';

import { LEAD_SUCCESS_MESSAGE, LeadDialog } from './lead-dialog';

const testEnv: AppEnvironment = {
  production: false,
  apiBaseUrl: 'http://localhost:5228/api',
  apiVersion: 'v1',
};
const leadsUrl = `${resolveApiRoot(testEnv)}/leads`;

@Component({
  imports: [LeadDialog],
  template: `<app-lead-dialog (submitted)="last = $event" />`,
})
class Host {
  readonly dialog = viewChild.required(LeadDialog);
  last: LeadCreated | null = null;
}

describe('LeadDialog', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideAppEnvironment(testEnv)],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

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
    const submit = () => root.querySelector('button[type="submit"]') as HTMLButtonElement;
    return { fixture, root, q, type, submit };
  }

  function fillValid(type: (sel: string, v: string) => void) {
    type('#lead-nome', 'Maria Silva');
    type('#lead-email', 'maria@prefeitura.gov.br');
    type('#lead-municipio', 'Campinas');
    type('#lead-telefone', '11912345678');
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

  it('should POST trimmed payload, show Enviando… while sending and close + toast after 201', async () => {
    const { fixture, submit, type, q, root } = await setup();
    const showSpy = vi.spyOn(TestBed.inject(ToastService), 'show');
    fillValid(type);
    type('#lead-mensagem', '  Cursos BNCC  ');
    expect(submit().disabled).toBe(false);

    q<HTMLFormElement>('form').requestSubmit();
    fixture.detectChanges();
    const req = http.expectOne(leadsUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      name: 'Maria Silva',
      email: 'maria@prefeitura.gov.br',
      municipality: 'Campinas',
      phone: '11912345678',
      message: 'Cursos BNCC',
    });
    expect(submit().disabled).toBe(true);
    expect(submit().textContent).toContain('Enviando…');
    expect(submit().querySelector('app-loading .motion-safe\\:animate-spin')).not.toBeNull();

    req.flush({ id: 'abc' }, { status: 201, statusText: 'Created' });
    fixture.detectChanges();
    expect(fixture.componentInstance.last).toEqual({ id: 'abc' });
    expect(root.textContent).not.toContain('Recebemos seu contato!');
    expect(fixture.componentInstance.dialog().open()).toBe(false);
    expect(showSpy).toHaveBeenCalledWith({ message: LEAD_SUCCESS_MESSAGE, type: 'success' });
  });

  it('should disable all fields and buttons while sending and re-enable on error', async () => {
    const { fixture, type, q, root, submit } = await setup();
    fillValid(type);
    q<HTMLFormElement>('form').requestSubmit();
    fixture.detectChanges();
    const req = http.expectOne(leadsUrl);

    const fields = [
      '#lead-nome',
      '#lead-email',
      '#lead-municipio',
      '#lead-telefone',
      '#lead-mensagem',
    ];
    const buttons = () => Array.from(root.querySelectorAll('button')) as HTMLButtonElement[];
    for (const sel of fields) {
      expect(q<HTMLInputElement>(sel).disabled).toBe(true);
    }
    expect(buttons().length).toBeGreaterThanOrEqual(2);
    expect(buttons().every((b) => b.disabled)).toBe(true);
    expect(q('form').getAttribute('aria-busy')).toBe('true');

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(fixture.componentInstance.dialog().open()).toBe(true);

    req.error(new ProgressEvent('error'));
    fixture.detectChanges();
    for (const sel of fields) {
      expect(q<HTMLInputElement>(sel).disabled).toBe(false);
    }
    expect(q<HTMLInputElement>('#lead-nome').value).toBe('Maria Silva');
    expect(submit().disabled).toBe(false);
    expect(buttons().every((b) => !b.disabled)).toBe(true);
    expect(q('form').getAttribute('aria-busy')).toBeNull();
  });

  it('should omit empty message from the payload', async () => {
    const { fixture, type, q } = await setup();
    fillValid(type);
    q<HTMLFormElement>('form').requestSubmit();
    fixture.detectChanges();
    const req = http.expectOne(leadsUrl);
    expect(req.request.body).toEqual({
      name: 'Maria Silva',
      email: 'maria@prefeitura.gov.br',
      municipality: 'Campinas',
      phone: '11912345678',
    });
    req.flush({ id: 'x' }, { status: 201, statusText: 'Created' });
  });

  it('should map 400 field errors from the API and show error message', async () => {
    const { fixture, type, q, root, submit } = await setup();
    fillValid(type);
    q<HTMLFormElement>('form').requestSubmit();
    fixture.detectChanges();
    http
      .expectOne(leadsUrl)
      .flush(
        { status: 400, errors: { Email: ['E-mail inválido.'] } },
        { status: 400, statusText: 'Bad Request' },
      );
    fixture.detectChanges();
    expect(root.textContent).toContain('Não foi possível enviar agora.');
    expect(q('#lead-email-erro').textContent).toContain('E-mail inválido.');
    expect(fixture.componentInstance.last).toBeNull();
    expect(submit().disabled).toBe(false);
  });

  it('should show generic error on network failure', async () => {
    const { fixture, type, q, root } = await setup();
    fillValid(type);
    q<HTMLFormElement>('form').requestSubmit();
    fixture.detectChanges();
    http.expectOne(leadsUrl).error(new ProgressEvent('error'));
    fixture.detectChanges();
    expect(root.textContent).toContain('Não foi possível enviar agora.');
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

  it('should mask phone, require it and validate 10–11 digits', async () => {
    const { q, type, submit } = await setup();
    type('#lead-nome', 'Maria Silva');
    type('#lead-email', 'maria@prefeitura.gov.br');
    type('#lead-municipio', 'Campinas');
    expect(submit().disabled).toBe(true);

    const phone = q<HTMLInputElement>('#lead-telefone');
    expect(phone.type).toBe('tel');
    expect(phone.getAttribute('inputmode')).toBe('tel');
    expect(phone.getAttribute('autocomplete')).toBe('tel');

    type('#lead-telefone', '');
    expect(q('#lead-telefone-erro').textContent).toContain('Informe o telefone.');

    type('#lead-telefone', '119123');
    expect(phone.value).toBe('(11) 9123');
    expect(phone.getAttribute('aria-invalid')).toBe('true');
    expect(q('#lead-telefone-erro').textContent).toContain('telefone válido');
    expect(submit().disabled).toBe(true);

    type('#lead-telefone', '1112345678');
    expect(phone.value).toBe('(11) 1234-5678');
    expect(submit().disabled).toBe(false);

    type('#lead-telefone', '11912345678');
    expect(phone.value).toBe('(11) 91234-5678');
    expect(submit().disabled).toBe(false);
  });

  it('should send phone as digits only and map backend phone error', async () => {
    const { fixture, type, q } = await setup();
    fillValid(type);
    q<HTMLFormElement>('form').requestSubmit();
    fixture.detectChanges();
    const req = http.expectOne(leadsUrl);
    expect(req.request.body.phone).toBe('11912345678');
    req.flush(
      { status: 400, errors: { Phone: ['Telefone inválido.'] } },
      { status: 400, statusText: 'Bad Request' },
    );
    fixture.detectChanges();
    expect(q('#lead-telefone-erro').textContent).toContain('Telefone inválido.');
    expect(q('#lead-telefone').getAttribute('aria-invalid')).toBe('true');
  });
});
