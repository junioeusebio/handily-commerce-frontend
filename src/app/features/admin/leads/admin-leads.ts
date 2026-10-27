import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
  type OnInit,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

import {
  ADMIN_LIMITS,
  AdminService,
  LEAD_STATUSES,
  type AdminLead,
  type LeadStatus,
} from '@domains';
import { Button, formatBrPhone, Loading, Modal, ToastService } from '@shared';

import { ADMIN_INPUT, errorMessage, validationErrors } from '../shared/admin-errors';

export const LEADS_PAGE_SIZE = 20;

@Component({
  selector: 'app-admin-leads',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button, DatePipe, Loading, Modal, ReactiveFormsModule],
  templateUrl: './admin-leads.html',
})
export class AdminLeads implements OnInit {
  private readonly api = inject(AdminService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly statuses = LEAD_STATUSES;
  protected readonly inputClass = ADMIN_INPUT;
  protected readonly noteMax = ADMIN_LIMITS.note;

  protected readonly items = signal<AdminLead[]>([]);
  protected readonly total = signal(0);
  protected readonly page = signal(1);
  protected readonly status = signal<LeadStatus | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.total() / LEADS_PAGE_SIZE)),
  );

  /** Lead aberto no diálogo de detalhe. */
  protected readonly selected = signal<AdminLead | null>(null);
  protected readonly detailOpen = signal(false);
  protected readonly saving = signal(false);
  protected readonly noteError = signal<string | null>(null);

  protected readonly toDelete = signal<AdminLead | null>(null);
  protected readonly confirmOpen = signal(false);
  protected readonly deleting = signal(false);

  protected readonly form = inject(NonNullableFormBuilder).group({
    status: ['Novo' as LeadStatus, Validators.required],
    internalNote: ['', Validators.maxLength(ADMIN_LIMITS.note)],
  });

  /** Telefone formatado `(11) 91234-5678`, ou `—` quando não informado. */
  protected phone(lead: AdminLead): string {
    return formatBrPhone(lead.phone) || '—';
  }

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api
      .leads({ page: this.page(), pageSize: LEADS_PAGE_SIZE, status: this.status() })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.items.set(res.items);
          this.total.set(res.total);
          this.loading.set(false);
        },
        error: (err: unknown) => {
          this.error.set(errorMessage(err));
          this.loading.set(false);
        },
      });
  }

  protected filter(value: string): void {
    this.status.set(
      (LEAD_STATUSES as readonly string[]).includes(value) ? (value as LeadStatus) : null,
    );
    this.page.set(1);
    this.load();
  }

  protected goTo(page: number): void {
    if (page < 1 || page > this.totalPages() || page === this.page()) {
      return;
    }
    this.page.set(page);
    this.load();
  }

  protected openDetail(lead: AdminLead): void {
    this.selected.set(lead);
    this.noteError.set(null);
    this.form.reset({ status: lead.status, internalNote: lead.internalNote ?? '' });
    this.detailOpen.set(true);
  }

  protected save(event: Event): void {
    event.preventDefault();
    const lead = this.selected();
    if (!lead || this.form.invalid || this.saving()) {
      return;
    }
    const v = this.form.getRawValue();
    this.saving.set(true);
    this.noteError.set(null);
    this.api
      .updateLead(lead.id, { status: v.status, internalNote: v.internalNote.trim() })
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (updated) => {
          this.items.update((list) => list.map((l) => (l.id === updated.id ? updated : l)));
          this.detailOpen.set(false);
          this.toast.show({ message: 'Lead atualizado.', type: 'success' });
          if (this.status() && updated.status !== this.status()) {
            this.load();
          }
        },
        error: (err: unknown) => {
          const fields = validationErrors(err);
          this.noteError.set(fields['internalNote'] ?? fields['status'] ?? errorMessage(err));
        },
      });
  }

  protected askDelete(lead: AdminLead): void {
    this.toDelete.set(lead);
    this.detailOpen.set(false);
    this.confirmOpen.set(true);
  }

  protected confirmDelete(): void {
    const lead = this.toDelete();
    if (!lead || this.deleting()) {
      return;
    }
    this.deleting.set(true);
    this.api
      .deleteLead(lead.id)
      .pipe(
        finalize(() => this.deleting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.confirmOpen.set(false);
          this.toDelete.set(null);
          this.toast.show({ message: 'Lead apagado.', type: 'success' });
          if (this.items().length === 1 && this.page() > 1) {
            this.page.update((p) => p - 1);
          }
          this.load();
        },
        error: (err: unknown) => {
          this.toast.show({ message: errorMessage(err), type: 'error' });
        },
      });
  }
}
