import { Component, Input, Output, EventEmitter, OnInit, signal, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe } from '@angular/common';
import { AdminService } from '../../services/admin.service';
import { OrderResponse, OrderItemResponse, OrderItemRequest, CatalogProduct } from '../../models/admin.model';

export interface EditItem extends OrderItemResponse {}

@Component({
  selector: 'app-edit-order-modal',
  standalone: true,
  imports: [FormsModule, CurrencyPipe],
  templateUrl: './edit-order-modal.component.html',
  styleUrl: './edit-order-modal.component.scss',
})
export class EditOrderModalComponent implements OnInit {
  @Input() order!: OrderResponse;
  @Output() saved = new EventEmitter<OrderResponse>();
  @Output() cancelled = new EventEmitter<void>();

  private svc = inject(AdminService);

  items = signal<EditItem[]>([]);
  notes = signal('');
  deliveryFee = signal(0);
  deliveryZone = signal('');
  saving = signal(false);
  error = signal('');

  products = signal<CatalogProduct[]>([]);
  showAddProduct = signal(false);
  searchTerm = signal('');

  filteredProducts = computed(() => {
    const q = this.searchTerm().toLowerCase();
    return this.products().filter(p =>
      p.available && p.name.toLowerCase().includes(q)
    ).slice(0, 20);
  });

  total = computed(() =>
    this.items().reduce((s, i) => s + i.unitPrice * i.quantity, 0) + this.deliveryFee()
  );

  ngOnInit(): void {
    this.items.set(this.order.items.map(i => ({ ...i })));
    this.notes.set(this.order.notes ?? '');
    this.deliveryFee.set(this.order.deliveryFee ?? 0);
    this.deliveryZone.set(this.order.deliveryZone ?? '');
    this.svc.getMenu().subscribe({ next: p => this.products.set(p) });
  }

  updateQty(index: number, delta: number): void {
    this.items.update(list => {
      const next = [...list];
      next[index] = { ...next[index], quantity: Math.max(1, next[index].quantity + delta) };
      return next;
    });
  }

  removeItem(index: number): void {
    this.items.update(list => list.filter((_, i) => i !== index));
  }

  addProduct(p: CatalogProduct): void {
    this.items.update(list => {
      const idx = list.findIndex(i => i.productName === p.name);
      if (idx >= 0) {
        const next = [...list];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
        return next;
      }
      return [...list, {
        id: 0, productId: p.id, productName: p.name,
        flavor: '', additions: '', quantity: 1,
        unitPrice: p.price, subtotal: p.price, note: ''
      }];
    });
    this.showAddProduct.set(false);
    this.searchTerm.set('');
  }

  save(): void {
    if (this.items().length === 0) { this.error.set('El pedido debe tener al menos un ítem'); return; }
    this.saving.set(true);
    this.error.set('');

    const items: OrderItemRequest[] = this.items().map(i => ({
      productId: i.productId,
      productName: i.productName,
      flavor: i.flavor || undefined,
      additions: i.additions || undefined,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      note: i.note || undefined,
    }));

    this.svc.updateOrder(this.order.id, {
      items,
      notes: this.notes(),
      deliveryFee: this.deliveryFee(),
      deliveryZone: this.deliveryZone(),
    }).subscribe({
      next: updated => { this.saving.set(false); this.saved.emit(updated); },
      error: () => { this.saving.set(false); this.error.set('Error al guardar los cambios'); },
    });
  }
}
