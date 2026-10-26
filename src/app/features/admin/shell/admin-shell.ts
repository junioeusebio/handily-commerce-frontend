import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from '@core';

/**
 * Layout da área admin. Tema próprio (ardósia escura + esmeralda) e faixa
 * "ADMIN" para não confundir com a área do cliente (navy/laranja).
 */
@Component({
  selector: 'app-admin-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './admin-shell.html',
})
export class AdminShell {
  private readonly auth = inject(AuthService);

  protected readonly links = [
    { path: '/admin', label: 'Painel', exact: true },
    { path: '/admin/leads', label: 'Leads', exact: false },
    { path: '/admin/cursos', label: 'Cursos', exact: false },
    { path: '/admin/produtos', label: 'Produtos', exact: false },
  ];

  protected logout(): void {
    this.auth.logout();
  }
}
