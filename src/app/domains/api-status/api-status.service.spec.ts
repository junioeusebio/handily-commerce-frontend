import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { provideAppEnvironment, resolveApiRoot, type AppEnvironment } from '@core';

import { ApiStatusService } from './api-status.service';

const testEnv: AppEnvironment = {
  production: false,
  apiBaseUrl: 'http://localhost:5228/api',
  apiVersion: 'v1',
};

describe('ApiStatusService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAppEnvironment(testEnv),
        ApiStatusService,
      ],
    });
  });

  it('GETs ping from the versioned API root', () => {
    const service = TestBed.inject(ApiStatusService);
    const http = TestBed.inject(HttpTestingController);

    let body: unknown;
    service.ping().subscribe((res) => {
      body = res;
    });

    const req = http.expectOne(`${resolveApiRoot(testEnv)}/ping`);
    expect(req.request.method).toBe('GET');
    req.flush({
      service: 'handily-commerce-backend',
      apiVersion: 'v1',
      status: 'ok',
    });

    expect(body).toEqual({
      service: 'handily-commerce-backend',
      apiVersion: 'v1',
      status: 'ok',
    });
    http.verify();
  });

  it('GETs health from the versioned API root', () => {
    const service = TestBed.inject(ApiStatusService);
    const http = TestBed.inject(HttpTestingController);

    let body: unknown;
    service.health().subscribe((res) => {
      body = res;
    });

    const req = http.expectOne(`${resolveApiRoot(testEnv)}/health`);
    expect(req.request.method).toBe('GET');
    req.flush({ status: 'Healthy', service: 'handily-commerce-backend' });

    expect(body).toEqual({
      status: 'Healthy',
      service: 'handily-commerce-backend',
    });
    http.verify();
  });

  it('GETs apiVersion from the versioned API root', () => {
    const service = TestBed.inject(ApiStatusService);
    const http = TestBed.inject(HttpTestingController);

    let body: unknown;
    service.apiVersion().subscribe((res) => {
      body = res;
    });

    const req = http.expectOne(`${resolveApiRoot(testEnv)}/apiVersion`);
    expect(req.request.method).toBe('GET');
    req.flush({ version: '0.5.0', service: 'handily-commerce-backend', apiRouteVersion: 'v1' });

    expect(body).toEqual({
      version: '0.5.0',
      service: 'handily-commerce-backend',
      apiRouteVersion: 'v1',
    });
    http.verify();
  });
});
