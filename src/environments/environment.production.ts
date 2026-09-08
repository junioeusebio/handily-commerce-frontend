import type { AppEnvironment } from './environment.types';

/**
 * Production — Handily Commerce API on Render.
 * Angular `baseHref` for this build is `/handily-commerce-frontend/` (GitHub Pages).
 */
export const environment: AppEnvironment = {
  production: true,
  apiBaseUrl: 'https://handily-commerce-backend.onrender.com/api',
  apiVersion: 'v1',
};
