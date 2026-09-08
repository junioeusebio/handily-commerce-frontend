import type { AppEnvironment } from './environment.types';

/**
 * Production — same-origin `/api` behind reverse proxy by default.
 * Override at deploy time if the API is on another origin.
 */
export const environment: AppEnvironment = {
  production: true,
  apiBaseUrl: '/api',
  apiVersion: 'v1',
};
