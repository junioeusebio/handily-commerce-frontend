import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import type { Product } from '@domains';

import { adminTestProviders, API_ROOT } from '../shared/admin-testing';
import { AdminProducts } from './admin-products';

const product: Product = {
  id: 'p1',
  name: 'Kit',
  sku: 'KIT-1',
  createdAt: '2026-10-01T00:00:00Z',
  items: [{ id: 'i1', productId: 'p1', name: 'Apostila', unitPrice: 10 }],
};

describe('AdminProducts', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: adminTestProviders() });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  function setup() {
    const fixture = TestBed.createComponent(AdminProducts);
    fixture.detectChanges();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return {
      fixture,
      c: fixture.componentInstance as any,
      el: fixture.nativeElement as HTMLElement,
    };
  }

  it('lists products, empty and error states', () => {
    const { fixture, el, c } = setup();
    http.expectOne(`${API_ROOT}/products`).flush([product]);
    fixture.detectChanges();
    expect(el.textContent).toContain('Kit');
    expect(el.textContent).toContain('1 item');
    c.load();
    http.expectOne(`${API_ROOT}/products`).flush([]);
    fixture.detectChanges();
    expect(el.textContent).toContain('Nenhum produto');
    c.load();
    http.expectOne(`${API_ROOT}/products`).flush(null, { status: 500, statusText: 'x' });
    fixture.detectChanges();
    expect(el.querySelector('[role=alert]')).toBeTruthy();
  });

  it('creates with the items repeater and maps item errors', () => {
    const { c, fixture } = setup();
    http.expectOne(`${API_ROOT}/products`).flush([]);
    c.openCreate();
    fixture.detectChanges();
    c.save(new Event('submit'));
    expect(c.errorFor('name')).toBe('Campo obrigatório.');
    expect(c.errorFor('items[0].name')).toBe('Campo obrigatório.');
    c.addItem();
    expect(c.form.controls.items.length).toBe(2);
    c.removeItem(1);
    c.form.patchValue({ name: ' Kit ', sku: '  ', items: [{ name: 'A', unitPrice: -1 }] });
    expect(c.errorFor('items[0].unitPrice')).toContain('negativo');
    c.form.patchValue({ sku: 'x'.repeat(65) });
    expect(c.errorFor('sku')).toContain('64');
    expect(c.errorFor('nope')).toBeNull();
    c.form.patchValue({ sku: '', items: [{ name: 'A', unitPrice: null }] });
    c.save(new Event('submit'));
    let req = http.expectOne(`${API_ROOT}/admin/products`);
    expect(req.request.body).toEqual({
      name: 'Kit',
      sku: null,
      items: [{ name: 'A', unitPrice: null }],
    });
    req.flush(
      { errors: { 'items[0].unitPrice': ['inválido'], sku: ['dup'] } },
      { status: 400, statusText: 'x' },
    );
    expect(c.errorFor('items[0].unitPrice')).toBe('inválido');
    c.save(new Event('submit'));
    req = http.expectOne(`${API_ROOT}/admin/products`);
    req.flush(product, { status: 201, statusText: 'Created' });
    http.expectOne(`${API_ROOT}/products`).flush([product]);
  });

  it('edits with PUT replacing items and deletes after confirmation', () => {
    const { c } = setup();
    http.expectOne(`${API_ROOT}/products`).flush([product]);
    c.openEdit({ ...product, sku: null });
    expect(c.form.controls.items.length).toBe(1);
    c.save(new Event('submit'));
    const req = http.expectOne(`${API_ROOT}/admin/products/p1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body.items).toEqual([{ name: 'Apostila', unitPrice: 10 }]);
    req.flush(product);
    http.expectOne(`${API_ROOT}/products`).flush([product]);
    c.confirmDelete();
    c.askDelete(product);
    c.confirmDelete();
    http.expectOne(`${API_ROOT}/admin/products/p1`).flush(null, { status: 404, statusText: 'x' });
    c.confirmDelete();
    http.expectOne(`${API_ROOT}/admin/products/p1`).flush(null);
    http.expectOne(`${API_ROOT}/products`).flush([]);
  });
});
