import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { authInterceptor, provideAppEnvironment, resolveApiRoot, type AppEnvironment } from '@core';

/** Ambiente e providers comuns aos specs do admin. */
export const ADMIN_TEST_ENV: AppEnvironment = {
  production: false,
  apiBaseUrl: 'http://localhost:5228/api',
  apiVersion: 'v1',
};
export const API_ROOT = resolveApiRoot(ADMIN_TEST_ENV);

export function adminTestProviders() {
  return [
    provideRouter([]),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideHttpClientTesting(),
    provideAppEnvironment(ADMIN_TEST_ENV),
  ];
}
