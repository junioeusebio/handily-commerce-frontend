import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { ADMIN_LIMITS, AdminService, type Product, type ProductUpsert } from '@domains';
import { Button, Loading, Modal } from '@shared';

import { AdminCrudPage } from '../shared/admin-crud';

@Component({
  selector: 'app-admin-products',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button, Loading, Modal, ReactiveFormsModule],
  templateUrl: './admin-products.html',
})
export class AdminProducts extends AdminCrudPage<Product> {
  private readonly api = inject(AdminService);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly messages = {
    created: 'Produto criado.',
    updated: 'Produto atualizado.',
    deleted: 'Produto apagado.',
  };

  protected readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(ADMIN_LIMITS.productName)]],
    sku: ['', [Validators.maxLength(ADMIN_LIMITS.sku)]],
    items: this.fb.array([this.itemGroup()]),
  });

  protected fetch() {
    return this.api.products();
  }

  protected remove(id: string) {
    return this.api.deleteProduct(id);
  }

  private itemGroup(name = '', unitPrice: number | null = null) {
    return this.fb.group({
      name: [name, [Validators.required, Validators.maxLength(ADMIN_LIMITS.itemName)]],
      unitPrice: [unitPrice, [Validators.min(0)]],
    });
  }

  protected openCreate(): void {
    this.form.reset();
    this.form.controls.items.clear();
    this.form.controls.items.push(this.itemGroup());
    this.openForm(null);
  }

  protected openEdit(product: Product): void {
    this.form.reset({ name: product.name, sku: product.sku ?? '' });
    this.form.controls.items.clear();
    for (const item of product.items ?? []) {
      this.form.controls.items.push(this.itemGroup(item.name, item.unitPrice ?? null));
    }
    this.openForm(product.id);
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
    if (!c?.invalid || !(c.touched || c.dirty)) {
      return null;
    }
    return this.clientError(c.errors, { min: 'O preço não pode ser negativo.' });
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
    this.submit(editing ? this.api.updateProduct(editing, body) : this.api.createProduct(body));
  }
}
