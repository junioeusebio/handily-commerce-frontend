import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { adminTestProviders, API_ROOT } from '@features/admin/shared/admin-testing';

import { AdminService } from './admin.service';

describe('AdminService', () => {
  let api: AdminService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: adminTestProviders() });
    api = TestBed.inject(AdminService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  const expect1 = (method: string, url: string) => {
    const req = http.expectOne((r) => r.method === method && r.urlWithParams === url);
    req.flush(method === 'DELETE' ? null : {});
    return req;
  };

  it('hits every admin route', () => {
    const body = {
      id: 'c',
      title: 't',
      axis: 'mundo-digital' as const,
      summary: 's',
      audience: 'a',
    };
    const prod = { name: 'p', items: [] };
    api.summary().subscribe();
    expect1('GET', `${API_ROOT}/admin/summary`);
    api.leads({ page: 2, pageSize: 20, status: 'Novo' }).subscribe();
    expect1('GET', `${API_ROOT}/admin/leads?page=2&pageSize=20&status=Novo`);
    api.leads({ page: 1, pageSize: 20 }).subscribe();
    expect1('GET', `${API_ROOT}/admin/leads?page=1&pageSize=20`);
    api.lead('x').subscribe();
    expect1('GET', `${API_ROOT}/admin/leads/x`);
    const patch =
      (api.updateLead('x', { status: 'Contatado' }).subscribe(),
      expect1('PATCH', `${API_ROOT}/admin/leads/x`));
    expect(patch.request.body).toEqual({ status: 'Contatado' });
    api.deleteLead('x').subscribe();
    expect1('DELETE', `${API_ROOT}/admin/leads/x`);
    api.courses().subscribe();
    expect1('GET', `${API_ROOT}/courses`);
    api.createCourse(body).subscribe();
    expect1('POST', `${API_ROOT}/admin/courses`);
    api.updateCourse('c', body).subscribe();
    expect1('PUT', `${API_ROOT}/admin/courses/c`);
    api.deleteCourse('c').subscribe();
    expect1('DELETE', `${API_ROOT}/admin/courses/c`);
    api.products().subscribe();
    expect1('GET', `${API_ROOT}/products`);
    api.createProduct(prod).subscribe();
    expect1('POST', `${API_ROOT}/admin/products`);
    api.updateProduct('p1', prod).subscribe();
    expect1('PUT', `${API_ROOT}/admin/products/p1`);
    api.deleteProduct('p1').subscribe();
    expect1('DELETE', `${API_ROOT}/admin/products/p1`);
  });
});
