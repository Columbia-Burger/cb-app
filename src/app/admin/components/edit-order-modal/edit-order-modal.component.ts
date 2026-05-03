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
  discountPercentage = signal(0);
  discountFixed = signal(0);
  discountFixedDisplay = signal('');
  couponCode = signal('');
  couponError = signal('');
  couponSuccess = signal('');
  validatingCoupon = signal(false);
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

  subtotal = computed(() =>
    this.items().reduce((s, i) => s + i.unitPrice * i.quantity, 0) + this.deliveryFee()
  );

  discountAmount = computed(() => {
    const sub = this.subtotal();
    const byPct = sub * (this.discountPercentage() / 100);
    const byFixed = this.discountFixed();
    return Math.min(byPct + byFixed, sub);
  });

  total = computed(() => this.subtotal() - this.discountAmount());

  ngOnInit(): void {
    this.items.set(this.order.items.map(i => ({ ...i })));
    this.notes.set(this.order.notes ?? '');
    this.deliveryFee.set(this.order.deliveryFee ?? 0);
    this.deliveryZone.set(this.order.deliveryZone ?? '');
    if (this.order.discount) {
      this.discountFixed.set(this.order.discount);
      const formatted = this.order.discount.toLocaleString('es-CO').replace(/,/g, '.');
      this.discountFixedDisplay.set(formatted);
    }
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

  validateCoupon(): void {
    const code = this.couponCode().trim().toUpperCase();
    if (!code) return;
    this.validatingCoupon.set(true);
    this.couponError.set('');
    this.couponSuccess.set('');
    this.svc.validateCoupon(code, this.subtotal()).subscribe({
      next: res => {
        this.validatingCoupon.set(false);
        const discount = Math.round(res.discountAmount);
        this.discountFixed.set(discount);
        const formatted = discount ? discount.toLocaleString('es-CO').replace(/,/g, '.') : '';
        this.discountFixedDisplay.set(formatted);
        this.discountPercentage.set(0);
        const label = res.type === 'PERCENTAGE' ? `${res.value}%` : `$${discount.toLocaleString('es-CO')}`;
        this.couponSuccess.set(`Cupón aplicado: ${label} de descuento`);
      },
      error: err => {
        this.validatingCoupon.set(false);
        this.couponError.set(err?.error?.message ?? 'Cupón inválido o expirado');
      },
    });
  }

  removeCoupon(): void {
    this.couponCode.set('');
    this.couponSuccess.set('');
    this.couponError.set('');
    this.discountFixed.set(0);
    this.discountFixedDisplay.set('');
  }

  onDiscountFixedInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '');
    const numeric = digits ? parseInt(digits, 10) : 0;
    const formatted = numeric ? numeric.toLocaleString('es-CO').replace(/,/g, '.') : '';
    input.value = formatted;
    this.discountFixed.set(numeric);
    this.discountFixedDisplay.set(formatted);
    this.couponSuccess.set('');
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
      discountPercentage: this.discountPercentage(),
      discountFixed: this.discountFixed(),
      couponCode: this.couponSuccess() ? this.couponCode() : undefined,
    }).subscribe({
      next: updated => { this.saving.set(false); this.saved.emit(updated); },
      error: () => { this.saving.set(false); this.error.set('Error al guardar los cambios'); },
    });
  }
}
