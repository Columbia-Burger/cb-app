import { Injectable, signal, computed } from '@angular/core';
import { environment } from '../../environments/environment';

export interface CartItem {
  name: string;
  price: string;
  priceValue: number;
  image: string;
  quantity: number;
  note: string;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly _items = signal<CartItem[]>([]);

  readonly items = this._items.asReadonly();

  readonly itemCount = computed(() =>
    this._items().reduce((sum, i) => sum + i.quantity, 0)
  );

  readonly total = computed(() =>
    this._items().reduce((sum, i) => sum + i.priceValue * i.quantity, 0)
  );

  readonly formattedTotal = computed(() =>
    `$${this.total().toLocaleString('es-CO')}`
  );

  addItem(item: Omit<CartItem, 'quantity' | 'note'>): void {
    const current = this._items();
    const existing = current.find((i) => i.name === item.name);
    if (existing) {
      this._items.set(
        current.map((i) =>
          i.name === item.name ? { ...i, quantity: i.quantity + 1 } : i
        )
      );
    } else {
      this._items.set([...current, { ...item, quantity: 1, note: '' }]);
    }
  }

  updateNote(name: string, note: string): void {
    this._items.set(
      this._items().map((i) => (i.name === name ? { ...i, note } : i))
    );
  }

  increment(name: string): void {
    this._items.set(
      this._items().map((i) =>
        i.name === name ? { ...i, quantity: i.quantity + 1 } : i
      )
    );
  }

  decrement(name: string): void {
    const current = this._items();
    const item = current.find((i) => i.name === name);
    if (!item) return;
    if (item.quantity === 1) {
      this.remove(name);
    } else {
      this._items.set(
        current.map((i) =>
          i.name === name ? { ...i, quantity: i.quantity - 1 } : i
        )
      );
    }
  }

  remove(name: string): void {
    this._items.set(this._items().filter((i) => i.name !== name));
  }

  clear(): void {
    this._items.set([]);
  }

  quantityOf(name: string): number {
    return this._items().find((i) => i.name === name)?.quantity ?? 0;
  }

  buildWhatsAppUrl(zone?: { name: string; price: number } | null): string {
    const items = this._items();
    if (items.length === 0) return '';

    const lines = items
      .map((i) => {
        const noteLine = i.note?.trim() ? `%0A  _(${i.note.trim()})_` : '';
        return `• ${i.quantity}x ${i.name} - ${i.price}${noteLine}`;
      })
      .join('%0A');

    const subtotal = `Subtotal: ${this.formattedTotal()}`;
    const deliveryLine = zone
      ? `%0ADomicilio (${zone.name}): $${zone.price.toLocaleString('es-CO')}`
      : '%0ADomicilio: a convenir según ubicación';
    const grandTotal = zone
      ? `%0A*Total con domicilio: $${(this.total() + zone.price).toLocaleString('es-CO')}*`
      : '';

    const message = `Hola,%20quiero%20hacer%20el%20siguiente%20pedido%3A%0A%0A${lines}%0A%0A${subtotal}${deliveryLine}${grandTotal}`;

    return `https://wa.me/${environment.whatsappNumber}?text=${message}`;
  }
}
