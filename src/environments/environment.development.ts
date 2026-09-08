import type { AppEnvironment } from './environment.types';

/**
 * Local development — points at the ASP.NET `http` launch profile
 * (`applicationUrl`: http://localhost:5228).
 */
export const environment: AppEnvironment = {
  production: false,
  apiBaseUrl: 'http://localhost:5228/api',
  apiVersion: 'v1',
};
