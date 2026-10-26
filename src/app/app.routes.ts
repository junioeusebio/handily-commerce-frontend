import type { Routes } from '@angular/router';

import { authGuard, guestGuard } from '@core';
import { HandilyCommerceFrontend } from '@features/handily-commerce-frontend/handily-commerce-frontend';

/**
 * Rotas por caminho (PathLocationStrategy). A home pública continua eager em `''`
 * e as âncoras (#cursos, #faq…) seguem nativas. A área admin é lazy.
 * Deep links no GitHub Pages: o CI copia `index.html` para `404.html`.
 */
export const routes: Routes = [
  { path: '', pathMatch: 'full', component: HandilyCommerceFrontend, title: 'AJKSys Consulting' },
  {
    path: 'admin/login',
    canActivate: [guestGuard],
    title: 'Entrar · Admin',
    loadComponent: () => import('@features/admin/login/admin-login').then((m) => m.AdminLogin),
  },
  {
    path: 'admin',
    canActivate: [authGuard],
    loadChildren: () => import('@features/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
  },
  { path: '**', redirectTo: '' },
];
