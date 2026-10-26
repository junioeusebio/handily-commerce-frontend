import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthService } from '@core';
import { Button } from '@shared';

import { ADMIN_INPUT, errorMessage } from '../shared/admin-errors';

@Component({
  selector: 'app-admin-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, Button],
  templateUrl: './admin-login.html',
})
export class AdminLogin {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  /** Vem da query string (`withComponentInputBinding`). */
  readonly returnUrl = input<string | undefined>();

  protected readonly inputClass = ADMIN_INPUT;
  protected readonly sending = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = inject(NonNullableFormBuilder).group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  protected readonly status = toSignal(this.form.statusChanges, { initialValue: this.form.status });

  protected submit(event: Event): void {
    event.preventDefault();
    if (this.form.invalid || this.sending()) {
      this.form.markAllAsTouched();
      return;
    }
    const { email, password } = this.form.getRawValue();
    this.sending.set(true);
    this.error.set(null);
    this.auth
      .login({ email: email.trim(), password })
      .pipe(
        finalize(() => this.sending.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.form.reset();
          const target = this.returnUrl();
          void this.router.navigateByUrl(target?.startsWith('/admin') ? target : '/admin');
        },
        error: (err: unknown) => {
          this.form.controls.password.reset();
          this.error.set(
            err instanceof HttpErrorResponse && err.status === 401
              ? 'E-mail ou senha inválidos.'
              : errorMessage(err),
          );
        },
      });
  }
}
