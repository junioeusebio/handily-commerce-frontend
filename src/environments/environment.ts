import type { AppEnvironment } from './environment.types';

/**
 * Default environment (import target for fileReplacements).
 * Development values: Handily Commerce API http profile from
 * handily-commerce-backend `launchSettings.json` → http://localhost:5228
 * with RoutePrefix `api` and Version `v1` (appsettings.json).
 */
export const environment: AppEnvironment = {
  production: false,
  apiBaseUrl: 'http://localhost:5228/api',
  apiVersion: 'v1',
};

export type { AppEnvironment } from './environment.types';
