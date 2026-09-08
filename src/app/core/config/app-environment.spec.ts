import { TestBed } from '@angular/core/testing';

import {
  APP_ENVIRONMENT,
  provideAppEnvironment,
  resolveApiRoot,
  type AppEnvironment,
} from './app-environment';

describe('resolveApiRoot', () => {
  it('joins apiBaseUrl and apiVersion without duplicate slashes', () => {
    const env: AppEnvironment = {
      production: false,
      apiBaseUrl: 'http://localhost:5228/api/',
      apiVersion: '/v1/',
    };
    expect(resolveApiRoot(env)).toBe('http://localhost:5228/api/v1');
  });

  it('works with the default development shape', () => {
    const env: AppEnvironment = {
      production: false,
      apiBaseUrl: 'http://localhost:5228/api',
      apiVersion: 'v1',
    };
    expect(resolveApiRoot(env)).toBe('http://localhost:5228/api/v1');
  });

  it('works with relative production base', () => {
    const env: AppEnvironment = {
      production: true,
      apiBaseUrl: '/api',
      apiVersion: 'v1',
    };
    expect(resolveApiRoot(env)).toBe('/api/v1');
  });
});

describe('provideAppEnvironment', () => {
  it('exposes APP_ENVIRONMENT via DI', () => {
    const custom: AppEnvironment = {
      production: false,
      apiBaseUrl: 'http://example.test/api',
      apiVersion: 'v1',
    };

    TestBed.configureTestingModule({
      providers: [provideAppEnvironment(custom)],
    });

    expect(TestBed.inject(APP_ENVIRONMENT)).toEqual(custom);
    expect(resolveApiRoot(TestBed.inject(APP_ENVIRONMENT))).toBe(
      'http://example.test/api/v1',
    );
  });
});
