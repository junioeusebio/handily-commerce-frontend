import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { provideAppEnvironment, resolveApiRoot, type AppEnvironment } from '@core';

import type { LeadCreated, LeadRequest } from './lead.model';
import { LeadService } from './lead.service';

const testEnv: AppEnvironment = {
  production: false,
  apiBaseUrl: 'http://localhost:5228/api',
  apiVersion: 'v1',
};

const lead: LeadRequest = {
  name: 'Maria Silva',
  email: 'maria@prefeitura.gov.br',
  municipality: 'Campinas',
  message: 'Cursos BNCC',
};

describe('LeadService', () => {
  let service: LeadService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideAppEnvironment(testEnv)],
    });
    service = TestBed.inject(LeadService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('deve fazer POST de leads na raiz versionada da API', () => {
    let body: LeadCreated | undefined;
    service.create(lead).subscribe((res) => (body = res));

    const req = http.expectOne(`${resolveApiRoot(testEnv)}/leads`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(lead);
    req.flush({ id: 'abc' }, { status: 201, statusText: 'Created' });

    expect(body).toEqual({ id: 'abc' });
  });

  it('deve propagar erro HTTP para o consumidor', () => {
    let status: number | undefined;
    service.create(lead).subscribe({ error: (err: { status: number }) => (status = err.status) });

    http
      .expectOne(`${resolveApiRoot(testEnv)}/leads`)
      .flush({ errors: {} }, { status: 400, statusText: 'Bad Request' });

    expect(status).toBe(400);
  });
});
