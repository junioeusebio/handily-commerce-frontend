import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
  type OnInit,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

import { ADMIN_LIMITS, AdminService, type Product, type ProductUpsert } from '@domains';
import { Button, Loading, Modal, ToastService } from '@shared';

import { ADMIN_INPUT, errorMessage, validationErrors } from '../shared/admin-errors';

@Component({
  selector: 'app-admin-products',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button, Loading, Modal, ReactiveFormsModule],
  templateUrl: './admin-products.html',
})
export class AdminProducts implements OnInit {
  private readonly api = inject(AdminService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly limits = ADMIN_LIMITS;
  protected readonly inputClass = ADMIN_INPUT;

  protected readonly items = signal<Product[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  protected readonly editingId = signal<string | null>(null);
  protected readonly formOpen = signal(false);
  protected readonly saving = signal(false);
  protected readonly serverErrors = signal<Record<string, string>>({});
  protected readonly formError = signal<string | null>(null);

  protected readonly toDelete = signal<Product | null>(null);
  protected readonly confirmOpen = signal(false);
  protected readonly deleting = signal(false);

  protected readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(ADMIN_LIMITS.productName)]],
    sku: ['', [Validators.maxLength(ADMIN_LIMITS.sku)]],
    items: this.fb.array([this.itemGroup()]),
  });

  ngOnInit(): void {
    this.load();
  }

  private itemGroup(name = '', unitPrice: number | null = null) {
    return this.fb.group({
      name: [name, [Validators.required, Validators.maxLength(ADMIN_LIMITS.itemName)]],
      unitPrice: [unitPrice, [Validators.min(0)]],
    });
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api
      .products()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (list) => {
          this.items.set(list);
          this.loading.set(false);
        },
        error: (err: unknown) => {
          this.error.set(errorMessage(err));
          this.loading.set(false);
        },
      });
  }

  protected openCreate(): void {
    this.editingId.set(null);
    this.form.reset();
    this.form.controls.items.clear();
    this.form.controls.items.push(this.itemGroup());
    this.openForm();
  }

  protected openEdit(product: Product): void {
    this.editingId.set(product.id);
    this.form.reset({ name: product.name, sku: product.sku ?? '' });
    this.form.controls.items.clear();
    for (const item of product.items ?? []) {
      this.form.controls.items.push(this.itemGroup(item.name, item.unitPrice ?? null));
    }
    this.openForm();
  }

  private openForm(): void {
    this.serverErrors.set({});
    this.formError.set(null);
    this.formOpen.set(true);
  }

  protected addItem(): void {
    if (this.form.controls.items.length < ADMIN_LIMITS.maxItems) {
      this.form.controls.items.push(this.itemGroup());
    }
  }

  protected removeItem(index: number): void {
    this.form.controls.items.removeAt(index);
  }

  /** Erro do campo (BE tem prioridade). `key` segue o contrato: `name`, `sku`, `items[0].name`… */
  protected errorFor(key: string): string | null {
    const server = this.serverErrors()[key];
    if (server) {
      return server;
    }
    const c = this.form.get(key.replace(/\[(\d+)\]/g, '.$1'));
    if (!c || !c.invalid || !(c.touched || c.dirty)) {
      return null;
    }
    const e = c.errors ?? {};
    if (e['required']) return 'Campo obrigatório.';
    if (e['maxlength']) return `No máximo ${e['maxlength'].requiredLength} caracteres.`;
    if (e['min']) return 'O preço não pode ser negativo.';
    return null;
  }

  protected save(event: Event): void {
    event.preventDefault();
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const sku = v.sku.trim();
    const body: ProductUpsert = {
      name: v.name.trim(),
      sku: sku || null,
      items: v.items.map((i) => ({ name: i.name.trim(), unitPrice: i.unitPrice ?? null })),
    };
    const editing = this.editingId();
    const req = editing ? this.api.updateProduct(editing, body) : this.api.createProduct(body);
    this.saving.set(true);
    this.serverErrors.set({});
    this.formError.set(null);
    req
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.formOpen.set(false);
          this.toast.show({
            message: editing ? 'Produto atualizado.' : 'Produto criado.',
            type: 'success',
          });
          this.load();
        },
        error: (err: unknown) => {
          this.serverErrors.set(validationErrors(err));
          this.formError.set(errorMessage(err));
        },
      });
  }

  protected askDelete(product: Product): void {
    this.toDelete.set(product);
    this.confirmOpen.set(true);
  }

  protected confirmDelete(): void {
    const product = this.toDelete();
    if (!product || this.deleting()) {
      return;
    }
    this.deleting.set(true);
    this.api
      .deleteProduct(product.id)
      .pipe(
        finalize(() => this.deleting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.confirmOpen.set(false);
          this.toast.show({ message: 'Produto apagado.', type: 'success' });
          this.load();
        },
        error: (err: unknown) => this.toast.show({ message: errorMessage(err), type: 'error' }),
      });
  }
}
