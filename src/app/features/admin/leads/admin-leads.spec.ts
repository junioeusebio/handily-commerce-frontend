import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import type { AdminLead } from '@domains';

import { adminTestProviders, API_ROOT } from '../shared/admin-testing';
import { AdminLeads } from './admin-leads';

const lead = (id: string, status: AdminLead['status'] = 'Novo'): AdminLead => ({
  id,
  name: `Lead ${id}`,
  email: `${id}@x.gov.br`,
  municipality: 'Recife',
  message: 'Oi',
  createdAt: '2026-10-26T12:00:00Z',
  status,
  internalNote: null,
});

describe('AdminLeads', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: adminTestProviders() });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  const list = (query: string, items: AdminLead[], total = items.length) =>
    http
      .expectOne(`${API_ROOT}/admin/leads?${query}`)
      .flush({ items, page: 1, pageSize: 20, total });

  function setup() {
    const fixture = TestBed.createComponent(AdminLeads);
    fixture.detectChanges();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return {
      fixture,
      c: fixture.componentInstance as any,
      el: fixture.nativeElement as HTMLElement,
    };
  }

  it('lists, paginates and filters', () => {
    const { fixture, c, el } = setup();
    list('page=1&pageSize=20', [lead('a')], 45);
    fixture.detectChanges();
    expect(el.querySelector('tbody')?.textContent).toContain('Lead a');
    expect(el.textContent).toContain('Página 1 de 3');
    c.goTo(0);
    c.goTo(2);
    list('page=2&pageSize=20', [lead('b')], 45);
    c.filter('Contatado');
    list('page=1&pageSize=20&status=Contatado', []);
    fixture.detectChanges();
    expect(el.textContent).toContain('Nenhum lead');
    c.filter('');
    list('page=1&pageSize=20', [], 0);
  });

  it('shows error state and retries', () => {
    const { fixture, el } = setup();
    http
      .expectOne(`${API_ROOT}/admin/leads?page=1&pageSize=20`)
      .flush(null, { status: 500, statusText: 'x' });
    fixture.detectChanges();
    el.querySelector<HTMLButtonElement>('[role=alert] button')!.click();
    list('page=1&pageSize=20', []);
  });

  it('updates status and note, showing 400 errors', () => {
    const { fixture, c } = setup();
    list('page=1&pageSize=20', [lead('a')]);
    c.openDetail(lead('a'));
    c.form.setValue({ status: 'Contatado', internalNote: '  liguei  ' });
    c.save(new Event('submit'));
    let req = http.expectOne(`${API_ROOT}/admin/leads/a`);
    expect(req.request.body).toEqual({ status: 'Contatado', internalNote: 'liguei' });
    req.flush({ errors: { InternalNote: ['Muito longa'] } }, { status: 400, statusText: 'x' });
    expect(c.noteError()).toBe('Muito longa');
    c.save(new Event('submit'));
    req = http.expectOne(`${API_ROOT}/admin/leads/a`);
    req.flush({ ...lead('a', 'Contatado'), internalNote: 'liguei' });
    fixture.detectChanges();
    expect(c.items()[0].status).toBe('Contatado');
    expect(c.detailOpen()).toBe(false);
  });

  it('reloads when an updated lead leaves the active filter', () => {
    const { c } = setup();
    list('page=1&pageSize=20', [lead('a')]);
    c.filter('Novo');
    list('page=1&pageSize=20&status=Novo', [lead('a')]);
    c.openDetail(lead('a'));
    c.form.patchValue({ status: 'Descartado' });
    c.save(new Event('submit'));
    http.expectOne(`${API_ROOT}/admin/leads/a`).flush(lead('a', 'Descartado'));
    list('page=1&pageSize=20&status=Novo', []);
  });

  it('deletes after confirmation and handles failure', () => {
    const { c } = setup();
    list('page=1&pageSize=20', [lead('a')]);
    c.confirmDelete();
    c.askDelete(lead('a'));
    expect(c.confirmOpen()).toBe(true);
    c.confirmDelete();
    http.expectOne(`${API_ROOT}/admin/leads/a`).flush(null, { status: 404, statusText: 'x' });
    c.confirmDelete();
    http.expectOne(`${API_ROOT}/admin/leads/a`).flush(null);
    list('page=1&pageSize=20', []);
    expect(c.confirmOpen()).toBe(false);
  });
});
