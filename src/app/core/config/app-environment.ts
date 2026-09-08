import { InjectionToken, makeEnvironmentProviders, type EnvironmentProviders } from '@angular/core';

import { environment } from '../../../environments/environment';
import type { AppEnvironment } from '../../../environments/environment.types';

export type { AppEnvironment };

/** DI token for the active build environment (`apiBaseUrl`, `apiVersion`, …). */
export const APP_ENVIRONMENT = new InjectionToken<AppEnvironment>('APP_ENVIRONMENT');

/**
 * Registers {@link APP_ENVIRONMENT} with the values from the file-replaced
 * `environment` module.
 */
export function provideAppEnvironment(
  value: AppEnvironment = environment,
): EnvironmentProviders {
  return makeEnvironmentProviders([{ provide: APP_ENVIRONMENT, useValue: value }]);
}

/**
 * Versioned API root, e.g. `http://localhost:5228/api/v1`.
 * Callers append resource paths (`/health`, …) in later backlog items.
 */
export function resolveApiRoot(env: AppEnvironment): string {
  const base = env.apiBaseUrl.replace(/\/+$/, '');
  const version = env.apiVersion.replace(/^\/+|\/+$/g, '');
  return `${base}/${version}`;
}
