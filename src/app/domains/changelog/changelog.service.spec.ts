import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { provideAppEnvironment, resolveApiRoot, type AppEnvironment } from '@core';

import { ChangelogService } from './changelog.service';

const testEnv: AppEnvironment = {
  production: false,
  apiBaseUrl: 'http://localhost:5228/api',
  apiVersion: 'v1',
};

describe('ChangelogService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAppEnvironment(testEnv),
        ChangelogService,
      ],
    });
  });

  it('GETs changelog from the versioned API root', () => {
    const service = TestBed.inject(ChangelogService);
    const http = TestBed.inject(HttpTestingController);

    let body: unknown;
    service.list().subscribe((items) => {
      body = items;
    });

    const req = http.expectOne(`${resolveApiRoot(testEnv)}/changelog`);
    expect(req.request.method).toBe('GET');
    req.flush([
      { title: '0.4.0', summary: 'Changelog modal' },
      { title: '0.3.0', summary: 'Prior release' },
    ]);

    expect(body).toEqual([
      { title: '0.4.0', summary: 'Changelog modal' },
      { title: '0.3.0', summary: 'Prior release' },
    ]);
    http.verify();
  });
});
