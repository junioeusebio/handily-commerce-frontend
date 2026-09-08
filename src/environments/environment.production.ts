import type { AppEnvironment } from './environment.types';

/**
 * Production — apiBaseUrl is a same-origin/placeholder `/api` until a real API
 * host is configured. Angular `baseHref` for this build is
 * `/handily-commerce-frontend/` (GitHub Pages project site).
 */
export const environment: AppEnvironment = {
  production: true,
  apiBaseUrl: '/api',
  apiVersion: 'v1',
};
