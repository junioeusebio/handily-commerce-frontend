import type { Routes } from '@angular/router';

import { AdminShell } from './shell/admin-shell';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: AdminShell,
    children: [
      {
        path: '',
        pathMatch: 'full',
        title: 'Painel · Admin',
        loadComponent: () => import('./dashboard/admin-dashboard').then((m) => m.AdminDashboard),
      },
      {
        path: 'leads',
        title: 'Leads · Admin',
        loadComponent: () => import('./leads/admin-leads').then((m) => m.AdminLeads),
      },
      {
        path: 'cursos',
        title: 'Cursos · Admin',
        loadComponent: () => import('./courses/admin-courses').then((m) => m.AdminCourses),
      },
      {
        path: 'produtos',
        title: 'Produtos · Admin',
        loadComponent: () => import('./products/admin-products').then((m) => m.AdminProducts),
      },
    ],
  },
];
