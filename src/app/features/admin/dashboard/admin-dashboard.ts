import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
  type OnInit,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { AdminService, type AdminSummary } from '@domains';
import { Loading } from '@shared';

import { errorMessage } from '../shared/admin-errors';

@Component({
  selector: 'app-admin-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Loading, RouterLink],
  templateUrl: './admin-dashboard.html',
})
export class AdminDashboard implements OnInit {
  private readonly api = inject(AdminService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly summary = signal<AdminSummary | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api
      .summary()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (s) => {
          this.summary.set(s);
          this.loading.set(false);
        },
        error: (err: unknown) => {
          this.error.set(errorMessage(err));
          this.loading.set(false);
        },
      });
  }
}
